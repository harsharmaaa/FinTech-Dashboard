import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { redis } from "../src/lib/redis";
import jwt from "jsonwebtoken";
import { config } from "../src/config";

describe("Authentication & Session Hardening Integration Tests", () => {
  const timestamp = Date.now();
  const testEmail = `test_user_${timestamp}@example.com`;
  const testPassword = "Password123!";
  const testFullName = "Test User";

  let accessToken: string;
  let rawRefreshToken: string;
  let refreshTokenCookie: string;
  let userId: string;
  let sessionId: string;

  afterAll(async () => {
    // 1. Delete all test users created during tests
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: "test_user_",
        },
      },
    });

    // 2. Clean up Redis rate limit keys
    const keys = await redis.keys("rate_limit:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // 3. Disconnect database & redis
    await prisma.$disconnect();
    await redis.quit();
  });

  describe("1. User Registration", () => {
    it("should successfully register a new user with valid data (201)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.id).toBeDefined();
      userId = res.body.data.user.id;
    });

    it("should reject registration with a duplicate email (409)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain("already exists");
    });
  });

  describe("2. User Login & Rate Limiting", () => {
    it("should successfully login with correct credentials (200)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) => c.startsWith("refreshToken="));
      expect(refreshCookie).toBeDefined();
      refreshTokenCookie = refreshCookie;
      rawRefreshToken = decodeURIComponent(refreshCookie.split(";")[0].split("=")[1]);
    });

    it("should reject login with an incorrect password (401)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testEmail,
          password: "WrongPassword123",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it("should trigger rate limit after 5 failed login attempts (429)", async () => {
      // We already had 1 failed attempt in the previous test.
      // Let's run 5 more failed attempts to reach 6 total attempts (limit is > 5 attempts).
      let res;
      for (let i = 0; i < 5; i++) {
        res = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: testEmail,
            password: "WrongPassword123",
          });
      }

      // The final attempt must be rate-limited with status 429
      expect(res?.status).toBe(429);
      expect(res?.body.error.code).toBe("TOO_MANY_REQUESTS");

      // Reset login rate limits in Redis for our IP so subsequent tests aren't blocked
      const keys = await redis.keys("rate_limit:login:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    });
  });

  describe("3. Protected Route Access Control", () => {
    it("should grant access with a valid token (200)", async () => {
      const res = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("works");
    });

    it("should deny access when Authorization header is missing (401)", async () => {
      const res = await request(app).get("/api/protected");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("should deny access with a tampered JWT signature (401)", async () => {
      const tamperedToken = accessToken + "tampered";
      const res = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("should deny access with an expired token (401)", async () => {
      const expiredToken = jwt.sign(
        { userId, role: "USER", email: testEmail, emailVerified: false },
        config.jwt.accessSecret,
        { expiresIn: "-1s" }
      );

      const res = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  describe("4. Session Management & Token Revocation", () => {
    it("should list all active sessions for the user (200)", async () => {
      const res = await request(app)
        .get("/api/v1/auth/sessions")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.sessions).toBeDefined();
      expect(res.body.data.sessions.length).toBeGreaterThanOrEqual(1);

      // Save a sessionId to test revocation
      sessionId = res.body.data.sessions[0].id;
    });

    it("should successfully revoke a specific session (200)", async () => {
      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${sessionId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toContain("revoked successfully");
    });

    it("should fail when using a revoked refresh token to refresh a session (401)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", refreshTokenCookie);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain("Compromised session. All tokens revoked.");
    });
  });
});
