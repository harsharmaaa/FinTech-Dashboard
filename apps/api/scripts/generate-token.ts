import { generateAccessToken } from "../src/lib/jwt";

async function main() {
  const token = generateAccessToken(
    "test-user-id",
    "USER",
    "test@example.com",
    true
  );
  console.log("JWT Access Token:");
  console.log(token);
}

main().catch(console.error);
