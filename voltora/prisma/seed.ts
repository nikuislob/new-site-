import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/db";

async function main() {
  const passwordHash = await hashPassword("Admin123!");
  await prisma.adminUser.upsert({
    where: { email: "admin@pitchpassusa.example" },
    update: { passwordHash, name: "PitchPass Admin" },
    create: {
      email: "admin@pitchpassusa.example",
      name: "PitchPass Admin",
      passwordHash,
    },
  });

  await prisma.order.deleteMany();
  await prisma.match.deleteMany();

  const matches = [
    {
      homeTeam: "USA Lions",
      awayTeam: "Mexico Fire",
      venue: "MetLife Stadium — East Rutherford, NJ",
      stadiumViewUrl: "/images/stadium-metlife.svg",
      matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      standardAvailable: 420,
      premiumAvailable: 180,
    },
    {
      homeTeam: "Canada North",
      awayTeam: "Brazil Stars",
      venue: "SoFi Stadium — Inglewood, CA",
      stadiumViewUrl: "/images/stadium-sofi.svg",
      matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35),
      standardAvailable: 510,
      premiumAvailable: 210,
    },
    {
      homeTeam: "Argentina Blue",
      awayTeam: "Germany Unity",
      venue: "AT&T Stadium — Arlington, TX",
      stadiumViewUrl: "/images/stadium-att.svg",
      matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 48),
      standardAvailable: 390,
      premiumAvailable: 160,
    },
  ];

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }

  console.log("Seeded PitchPass USA admin + upcoming matches");
  console.log("Admin: admin@pitchpassusa.example / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
