import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const matchCount = await prisma.match.count().catch(() => 0);
  if (matchCount > 0) {
    console.log(`Seed skipped (${matchCount} matches already present)`);
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
