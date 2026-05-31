import { prisma } from "../src/lib/prisma";
import { verifyGoogleUser } from "../src/config/passport";

const testGoogleId1 = `google_test_id_${Date.now()}`;
const testGoogleId2 = `google_test_id_link_${Date.now()}`;
const testEmail1 = `oauth_test_new_${Date.now()}@example.com`;
const testEmail2 = `oauth_test_link_${Date.now()}@example.com`;

async function runTest() {
  console.log("🚀 Starting Google OAuth2 Mock Strategy Verification Test...\n");

  // ============================================
  // Test Scenario 1: New Google User Registration
  // ============================================
  console.log("1. Testing registration of a brand new Google user...");
  const mockProfile1 = {
    id: testGoogleId1,
    displayName: "OAuth New User",
    emails: [{ value: testEmail1 }],
  };

  let registeredUser: any = null;
  await new Promise<void>((resolve, reject) => {
    verifyGoogleUser("mock_access", "mock_refresh", mockProfile1, (err, user) => {
      if (err) return reject(err);
      registeredUser = user;
      resolve();
    });
  });

  if (!registeredUser) throw new Error("User was not returned in callback");
  if (registeredUser.email !== testEmail1) throw new Error("Email mismatch");
  if (registeredUser.googleId !== testGoogleId1) throw new Error("GoogleId mismatch");
  if (!registeredUser.emailVerified) throw new Error("Email should be verified");

  // Check profile auto-creation
  const profile = await prisma.userProfile.findUnique({
    where: { userId: registeredUser.id },
  });
  if (!profile) throw new Error("UserProfile was not auto-created");
  console.log("✅ New Google user registered and UserProfile auto-created successfully.");

  // ============================================
  // Test Scenario 2: Linking Account to Existing Email
  // ============================================
  console.log("\n2. Testing linking Google account to an existing email record...");
  
  // Create user manually first (simulating pre-existing local credential account)
  const localUser = await prisma.user.create({
    data: {
      email: testEmail2,
      fullName: "Local Account Owner",
      passwordHash: "some_local_hash",
      emailVerified: false,
    },
  });

  const mockProfile2 = {
    id: testGoogleId2,
    displayName: "Google Linked User",
    emails: [{ value: testEmail2 }],
  };

  let linkedUser: any = null;
  await new Promise<void>((resolve, reject) => {
    verifyGoogleUser("mock_access", "mock_refresh", mockProfile2, (err, user) => {
      if (err) return reject(err);
      linkedUser = user;
      resolve();
    });
  });

  if (!linkedUser) throw new Error("User was not returned in callback");
  if (linkedUser.id !== localUser.id) throw new Error("Linking failed: user ID mismatch");
  if (linkedUser.googleId !== testGoogleId2) throw new Error("Linking failed: google ID not saved");
  if (!linkedUser.emailVerified) throw new Error("Linked user's email should now be verified");
  console.log("✅ Existing user successfully linked and verified via Google OAuth.");

  // ============================================
  // Test Scenario 3: Log In Existing Google User
  // ============================================
  console.log("\n3. Testing login for existing Google user...");
  let loggedInUser: any = null;
  await new Promise<void>((resolve, reject) => {
    verifyGoogleUser("mock_access", "mock_refresh", mockProfile1, (err, user) => {
      if (err) return reject(err);
      loggedInUser = user;
      resolve();
    });
  });

  if (!loggedInUser || loggedInUser.id !== registeredUser.id) {
    throw new Error("Failed to authenticate existing Google user");
  }
  console.log("✅ Existing Google user authenticated successfully.");

  // ============================================
  // Clean Up
  // ============================================
  console.log("\n4. Cleaning up test database records...");
  await prisma.userProfile.deleteMany({
    where: { userId: { in: [registeredUser.id, localUser.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [registeredUser.id, localUser.id] } },
  });
  console.log("✅ Test database records cleaned up successfully.");

  console.log("\n🎉 ALL GOOGLE OAUTH2 STRATEGY TESTS PASSED SUCCESSFULLY!");
}

runTest().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
