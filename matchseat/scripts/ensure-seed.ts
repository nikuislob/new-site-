import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const [matchCount, adminCount, paymentCount] = await Promise.all([
    prisma.match.count().catch(() => 0),
    prisma.adminUser.count().catch(() => 0),
    prisma.paymentMethod.count().catch(() => 0),
  ]);
  if (matchCount > 0 && adminCount > 0 && paymentCount > 0) {
    console.log(`Seed skipped (matches=${matchCount}, admins=${adminCount}, payments=${paymentCount})`);
    return;
  }
  console.log("Seeding PitchPass database...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main()
  .catch((error) => {
    console.error("ensure-seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
