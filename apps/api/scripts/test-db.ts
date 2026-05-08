import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: "123456",
      fullName: "Test User",
    },
  });

  console.log("User created:", user);

  const found = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  console.log("User fetched:", found);

  await prisma.user.delete({
    where: { email: "test@example.com" },
  });

  console.log("User deleted");
  console.log("DB connection successful ✅");
}

main().catch(console.error);