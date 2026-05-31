import { prisma } from "./lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    include: { refreshTokens: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
