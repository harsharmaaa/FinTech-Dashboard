import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { redis } from "../src/lib/redis";

import { alpaca } from "../src/services/alpaca.service";

jest.setTimeout(60000);

jest.spyOn(alpaca, "getAssets").mockImplementation(async () => {
  return [
    { symbol: "AAPL", name: "Apple Inc. Common Stock", exchange: "NASDAQ", tradable: true },
    { symbol: "TSLA", name: "Tesla Inc. Common Stock", exchange: "NASDAQ", tradable: true },
    { symbol: "MSFT", name: "Microsoft Corporation Common Stock", exchange: "NASDAQ", tradable: true },
    { symbol: "GOOGL", name: "Alphabet Inc. Common Stock", exchange: "NASDAQ", tradable: true },
  ] as any[];
});

describe("Market Data & Alpaca Integration Tests", () => {
  const timestamp = Date.now();
  const testEmail = `test_market_user_${timestamp}@example.com`;
  const testPassword = "Password123!";
  const testFullName = "Market Tester";

  let accessToken: string;

  beforeAll(async () => {
    // 1. Create a temporary user to authorize requests
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
      });

    if (regRes.status !== 201) {
      throw new Error(`Test setup registration failed: ${JSON.stringify(regRes.body)}`);
    }

    // 2. Login to get the access token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    accessToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup the user
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });

    // Cleanup keys
    const keys = await redis.keys("market:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await prisma.$disconnect();
    await redis.quit();
  });

  describe("GET /api/v1/market/quote/:symbol", () => {
    it("should return a normalized quote for a valid symbol (AAPL)", async () => {
      const res = await request(app)
        .get("/api/v1/market/quote/AAPL")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeDefined();

      const quote = res.body.data;
      expect(quote.symbol).toBe("AAPL");
      expect(typeof quote.lastPrice).toBe("number");
      expect(quote.lastPrice).toBeGreaterThan(0);
      expect(typeof quote.bidPrice).toBe("number");
      expect(typeof quote.askPrice).toBe("number");
      expect(typeof quote.volume).toBe("number");
      expect(typeof quote.changePercent).toBe("number");
      expect(quote.timestamp).toBeDefined();

      // Check if price is within reasonable range for Google Finance verification
      console.log(`📈 Real AAPL Price: $${quote.lastPrice} (Change: ${quote.changePercent.toFixed(2)}%)`);
    });

    it("should return quote from cache on subsequent request", async () => {
      const start = Date.now();
      const res1 = await request(app)
        .get("/api/v1/market/quote/AAPL")
        .set("Authorization", `Bearer ${accessToken}`);
      const time1 = Date.now() - start;

      const start2 = Date.now();
      const res2 = await request(app)
        .get("/api/v1/market/quote/AAPL")
        .set("Authorization", `Bearer ${accessToken}`);
      const time2 = Date.now() - start2;

      expect(res1.body.data).toEqual(res2.body.data);
      // Cache response should be extremely fast (typically < 10ms)
      console.log(`⚡ First request: ${time1}ms, Cache hit request: ${time2}ms`);
    });

    it("should return 401 for unauthorized access", async () => {
      const res = await request(app).get("/api/v1/market/quote/AAPL");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/market/bars/:symbol", () => {
    it("should return normalized daily bars for a valid symbol (TSLA)", async () => {
      const res = await request(app)
        .get("/api/v1/market/bars/TSLA?timeframe=1Day&limit=5")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.bars).toBeDefined();
      expect(Array.isArray(res.body.data.bars)).toBe(true);
      expect(res.body.data.bars.length).toBeLessThanOrEqual(5);

      if (res.body.data.bars.length > 0) {
        const bar = res.body.data.bars[0];
        expect(bar.time).toBeDefined();
        expect(typeof bar.open).toBe("number");
        expect(typeof bar.high).toBe("number");
        expect(typeof bar.low).toBe("number");
        expect(typeof bar.close).toBe("number");
        expect(typeof bar.volume).toBe("number");
      }
    });

    it("should return 365 daily bars for AAPL in less than 200ms from the database", async () => {
      const start = Date.now();
      const res = await request(app)
        .get("/api/v1/market/bars/AAPL?timeframe=1Day&limit=365")
        .set("Authorization", `Bearer ${accessToken}`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.bars).toBeDefined();
      expect(Array.isArray(res.body.data.bars)).toBe(true);
      expect(res.body.data.bars.length).toBe(365);

      console.log(`⏱️ API Response Time for 365 AAPL bars: ${duration}ms`);
      expect(duration).toBeLessThan(200);
    });
  });

  describe("GET /api/v1/market/search", () => {
    it("should return search results for a fuzzy query (apple)", async () => {
      const res = await request(app)
        .get("/api/v1/market/search?q=apple")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.results).toBeDefined();
      expect(Array.isArray(res.body.data.results)).toBe(true);

      const appleResult = res.body.data.results.find((r: any) => r.symbol === "AAPL");
      expect(appleResult).toBeDefined();
      expect(appleResult.name.toLowerCase()).toContain("apple");
    }, 60000);
  });

  describe("GET /api/v1/market/movers", () => {
    it("should return top gainers and losers", async () => {
      const res = await request(app)
        .get("/api/v1/market/movers")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.gainers).toBeDefined();
      expect(res.body.data.losers).toBeDefined();
      expect(Array.isArray(res.body.data.gainers)).toBe(true);
      expect(Array.isArray(res.body.data.losers)).toBe(true);

      if (res.body.data.gainers.length > 0) {
        const gainer = res.body.data.gainers[0];
        expect(gainer.symbol).toBeDefined();
        expect(typeof gainer.price).toBe("number");
        expect(typeof gainer.changePercent).toBe("number");
      }
    });
  });

  describe("GET /api/v1/market/overview", () => {
    it("should return the market overview, including clock and index prices", async () => {
      const res = await request(app)
        .get("/api/v1/market/overview")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.clock).toBeDefined();
      expect(res.body.data.clock.is_open).toBeDefined();
      expect(res.body.data.indices).toBeDefined();
      expect(res.body.data.topGainers).toBeDefined();
      expect(res.body.data.topLosers).toBeDefined();
    });
  });

  describe("GET /api/v1/market/news", () => {
    it("should return a list of recent stock market news", async () => {
      const res = await request(app)
        .get("/api/v1/market/news?limit=5")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/v1/market/calendar/earnings", () => {
    it("should return mock upcoming corporate earnings events", async () => {
      const res = await request(app)
        .get("/api/v1/market/calendar/earnings?days=7")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const event = res.body.data[0];
        expect(event.symbol).toBeDefined();
        expect(event.companyName).toBeDefined();
        expect(event.date).toBeDefined();
      }
    });
  });

  describe("GET /api/v1/market/assets", () => {
    it("should return a cached list of active, tradable US equities", async () => {
      const res = await request(app)
        .get("/api/v1/market/assets")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      const asset = res.body.data[0];
      expect(asset.symbol).toBeDefined();
      expect(asset.name).toBeDefined();
      expect(asset.exchange).toBeDefined();
      expect(asset.tradable).toBe(true);
    });
  });
});
