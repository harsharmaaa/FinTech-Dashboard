import { prisma } from "../src/lib/prisma";

const API_URL = "http://localhost:3001/api";
const email1 = `verify_test_1_${Date.now()}@example.com`;
const email2 = `verify_test_2_${Date.now()}@example.com`;
const password = "password123";
const newPassword = "newpassword456";

async function runTest() {
  console.log("🚀 Starting Email Verification & Password Reset Integration Test...\n");

  // ==========================================
  // PHASE 1: User Registration & Verification
  // ==========================================
  
  console.log(`\n1. Registering user 1 (${email1})...`);
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email1, password, fullName: "Verification Test 1" }),
  });
  if (regRes.status !== 201) {
    throw new Error(`Registration failed: ${await regRes.text()}`);
  }
  console.log("✅ User 1 registered successfully.");

  console.log("\n2. Logging in to get initial tokens...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email1, password }),
  });
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  const loginData = (await loginRes.json()) as any;
  const initialAccessToken = loginData.data.accessToken;
  const initialCookie = loginRes.headers.get("set-cookie");
  console.log("✅ Initial login successful.");

  console.log("\n3. Testing accessing /verified-only with unverified account...");
  const verifiedOnlyRes = await fetch(`${API_URL}/verified-only`, {
    headers: { Authorization: `Bearer ${initialAccessToken}` },
  });
  if (verifiedOnlyRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${verifiedOnlyRes.status}`);
  }
  const verifiedOnlyData = (await verifiedOnlyRes.json()) as any;
  if (verifiedOnlyData.error?.code !== "EMAIL_NOT_VERIFIED") {
    throw new Error(`Expected EMAIL_NOT_VERIFIED error code, got ${JSON.stringify(verifiedOnlyData)}`);
  }
  console.log("✅ Access correctly blocked with 403 EMAIL_NOT_VERIFIED.");

  console.log("\n4. Querying database for emailVerifyToken...");
  const dbUser1 = await prisma.user.findUnique({
    where: { email: email1 },
  });
  const verifyToken = dbUser1?.emailVerifyToken;
  if (!verifyToken) {
    throw new Error("No verify token found in the database!");
  }
  console.log(`✅ Token found: ${verifyToken}`);

  console.log("\n5. Verifying email address...");
  const verifyRes = await fetch(`${API_URL}/auth/verify-email?token=${verifyToken}`);
  if (verifyRes.status !== 200) {
    throw new Error(`Email verification failed: ${await verifyRes.text()}`);
  }
  const verifyData = (await verifyRes.json()) as any;
  if (!verifyData.data.emailVerified) {
    throw new Error("Response did not indicate email is verified");
  }
  console.log("✅ Email successfully verified.");

  console.log("\n6. Verifying again with the same token...");
  const reVerifyRes = await fetch(`${API_URL}/auth/verify-email?token=${verifyToken}`);
  if (reVerifyRes.status !== 400) {
    throw new Error(`Expected 400 for duplicate verification, got ${reVerifyRes.status}`);
  }
  console.log("✅ Duplicate verification correctly rejected with 400.");

  console.log("\n7. Accessing /verified-only with outdated stateless access token...");
  const verifiedOnlyOldTokenRes = await fetch(`${API_URL}/verified-only`, {
    headers: { Authorization: `Bearer ${initialAccessToken}` },
  });
  if (verifiedOnlyOldTokenRes.status !== 403) {
    throw new Error(`Expected outdated token to still yield 403, got ${verifiedOnlyOldTokenRes.status}`);
  }
  console.log("✅ Stateless token correctly remains unverified.");

  console.log("\n8. Refreshing token to get updated verified status...");
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: initialCookie || "",
    },
  });
  if (refreshRes.status !== 200) {
    throw new Error(`Refresh failed: ${await refreshRes.text()}`);
  }
  const refreshData = (await refreshRes.json()) as any;
  const newAccessToken = refreshData.data.accessToken;
  console.log("✅ Refresh successful, got new access token.");

  console.log("\n9. Testing accessing /verified-only with updated access token...");
  const verifiedOnlyNewTokenRes = await fetch(`${API_URL}/verified-only`, {
    headers: { Authorization: `Bearer ${newAccessToken}` },
  });
  if (verifiedOnlyNewTokenRes.status !== 200) {
    throw new Error(`Expected 200, got ${verifiedOnlyNewTokenRes.status} - ${await verifiedOnlyNewTokenRes.text()}`);
  }
  console.log("✅ Access successfully granted (200 OK) for verified user.");

  // ==========================================
  // PHASE 2: Resend Verification Rate Limiting
  // ==========================================
  
  console.log("\n10. Testing resend-verification on already verified user...");
  const resendFailRes = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email1 }),
  });
  if (resendFailRes.status !== 400) {
    throw new Error(`Expected 400 for already verified, got ${resendFailRes.status}`);
  }
  console.log("✅ Resend rejected with 400 because email is already verified.");

  console.log(`\n11. Registering user 2 (${email2}) for rate limiter test...`);
  const regRes2 = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2, password, fullName: "Verification Test 2" }),
  });
  if (regRes2.status !== 201) {
    throw new Error(`Registration 2 failed: ${await regRes2.text()}`);
  }

  console.log("\n12. Testing resend-verification rate limiter (max 3)...");
  let lastResendStatus = 0;
  for (let i = 1; i <= 4; i++) {
    const resendRes = await fetch(`${API_URL}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email2 }),
    });
    lastResendStatus = resendRes.status;
    console.log(`Resend ${i}: Status ${resendRes.status}`);
  }
  if (lastResendStatus !== 429) {
    throw new Error(`Expected 429 on 4th resend attempt, got ${lastResendStatus}`);
  }
  console.log("✅ Rate limiter correctly blocked 4th request with 429.");

  // ==========================================
  // PHASE 3: Forgot / Reset Password Flow
  // ==========================================
  
  console.log(`\n13. Requesting password reset for user 2 (${email2})...`);
  const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2 }),
  });
  if (forgotRes.status !== 200) {
    throw new Error(`Forgot password failed: ${await forgotRes.text()}`);
  }
  console.log("✅ Password reset email request successful.");

  console.log("\n14. Querying database for passwordResetToken...");
  const dbUser2 = await prisma.user.findUnique({
    where: { email: email2 },
  });
  const resetToken = dbUser2?.passwordResetToken;
  if (!resetToken) {
    throw new Error("No reset token found in database!");
  }
  console.log(`✅ Reset Token found: ${resetToken}`);

  console.log("\n15. Resetting password...");
  const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: newPassword }),
  });
  if (resetRes.status !== 200) {
    throw new Error(`Reset password failed: ${await resetRes.text()}`);
  }
  console.log("✅ Password reset successful.");

  console.log("\n16. Testing login with old password...");
  const oldLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2, password }),
  });
  if (oldLoginRes.status !== 401) {
    throw new Error(`Expected 401 for old password login, got ${oldLoginRes.status}`);
  }
  console.log("✅ Login with old password correctly rejected with 401.");

  console.log("\n17. Testing login with new password...");
  const newLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2, password: newPassword }),
  });
  if (newLoginRes.status !== 200) {
    throw new Error(`Expected 200 for new password login, got ${newLoginRes.status} - ${await newLoginRes.text()}`);
  }
  console.log("✅ Login with new password successfully authenticated.");

  console.log("\n🎉 ALL EMAIL VERIFICATION AND PASSWORD RESET INTEGRATION TESTS PASSED!");
}

runTest().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
