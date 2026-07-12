import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSeatsForMatch(
  matchId: string,
  basicId: string,
  premiumId: string
) {
  const seats: {
    matchId: string;
    categoryId: string;
    section: string;
    row: string;
    number: number;
    label: string;
    status: string;
    x: number;
    y: number;
  }[] = [];

  // Premium sections closer to pitch (rows A-C, sections P1-P2)
  const premiumRows = ["A", "B", "C"];
  for (const section of ["P1", "P2"]) {
    premiumRows.forEach((row, rowIdx) => {
      for (let n = 1; n <= 8; n++) {
        const sold = (section === "P1" && row === "A" && n <= 2) || (section === "P2" && row === "B" && n === 5);
        seats.push({
          matchId,
          categoryId: premiumId,
          section,
          row,
          number: n,
          label: `${section}-${row}${n}`,
          status: sold ? "SOLD" : "AVAILABLE",
          x: section === "P1" ? 40 + n * 28 : 280 + n * 28,
          y: 80 + rowIdx * 32,
        });
      }
    });
  }

  // Basic sections (rows D-H, sections B1-B4)
  const basicRows = ["D", "E", "F", "G", "H"];
  for (const section of ["B1", "B2", "B3", "B4"]) {
    const sectionIndex = ["B1", "B2", "B3", "B4"].indexOf(section);
    basicRows.forEach((row, rowIdx) => {
      for (let n = 1; n <= 10; n++) {
        const sold =
          (section === "B1" && row === "D" && n <= 3) ||
          (section === "B3" && row === "F" && (n === 4 || n === 5)) ||
          (section === "B2" && row === "E" && n === 8);
        seats.push({
          matchId,
          categoryId: basicId,
          section,
          row,
          number: n,
          label: `${section}-${row}${n}`,
          status: sold ? "SOLD" : "AVAILABLE",
          x: 20 + sectionIndex * 140 + n * 12,
          y: 200 + rowIdx * 28,
        });
      }
    });
  }

  await prisma.seat.createMany({ data: seats });
  return seats.length;
}

async function main() {
  console.log("Seeding FIFA Match Tickets...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.match.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.paymentLink.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.siteSetting.deleteMany();

  const passwordHash = await bcrypt.hash("Admin@FIFA2026!", 12);
  await prisma.adminUser.create({
    data: {
      email: "admin@fifatickets.com",
      passwordHash,
      name: "Tournament Admin",
      role: "SUPER_ADMIN",
    },
  });

  const basic = await prisma.ticketCategory.create({
    data: {
      code: "BASIC",
      name: "Basic",
      description: "Standard seating with excellent views of the pitch.",
      price: 70.5,
      color: "#1a7f4b",
      sortOrder: 1,
    },
  });

  const premium = await prisma.ticketCategory.create({
    data: {
      code: "PREMIUM",
      name: "Premium",
      description: "Premium midfield seats with lounge access.",
      price: 141,
      color: "#c9a227",
      sortOrder: 2,
    },
  });

  await prisma.paymentLink.createMany({
    data: [
      {
        key: "BASIC_1",
        label: "1 Basic Ticket ($70.50)",
        amount: 70.5,
        url: "https://pay.example.com/apple-cash/basic-1",
        provider: "Apple Pay / Cash App",
      },
      {
        key: "BASIC_2",
        label: "2 Basic Tickets ($141.00)",
        amount: 141,
        url: "https://pay.example.com/apple-cash/basic-2",
        provider: "Apple Pay / Cash App",
      },
      {
        key: "PREMIUM_1",
        label: "1 Premium Ticket ($141.00)",
        amount: 141,
        url: "https://pay.example.com/apple-cash/premium-1",
        provider: "Apple Pay / Cash App",
      },
      {
        key: "PREMIUM_2",
        label: "2 Premium Tickets ($282.00)",
        amount: 282,
        url: "https://pay.example.com/apple-cash/premium-2",
        provider: "Apple Pay / Cash App",
      },
    ],
  });

  const matches = [
    {
      slug: "usa-vs-mexico-metlife",
      homeTeam: "USA",
      opponent: "Mexico",
      venue: "East Rutherford, New Jersey",
      stadiumName: "MetLife Stadium",
      stadiumImage: "/images/stadium-metlife.svg",
      matchDate: new Date("2026-06-15T00:00:00.000Z"),
      matchTime: "20:00",
      description: "Group stage opener. Secure your seats for a classic CONCACAF rivalry under the lights.",
    },
    {
      slug: "brazil-vs-argentina-sofi",
      homeTeam: "Brazil",
      opponent: "Argentina",
      venue: "Inglewood, California",
      stadiumName: "SoFi Stadium",
      stadiumImage: "/images/stadium-sofi.svg",
      matchDate: new Date("2026-06-22T00:00:00.000Z"),
      matchTime: "19:30",
      description: "South American giants collide in Los Angeles. Premium midfield inventory is limited.",
    },
    {
      slug: "england-vs-france-att",
      homeTeam: "England",
      opponent: "France",
      venue: "Arlington, Texas",
      stadiumName: "AT&T Stadium",
      stadiumImage: "/images/stadium-att.svg",
      matchDate: new Date("2026-06-28T00:00:00.000Z"),
      matchTime: "18:00",
      description: "European powerhouses meet in Texas. Basic and Premium seating available.",
    },
  ];

  for (const m of matches) {
    const match = await prisma.match.create({ data: m });
    const count = await createSeatsForMatch(match.id, basic.id, premium.id);
    console.log(`  Match ${m.homeTeam} vs ${m.opponent}: ${count} seats`);
  }

  await prisma.siteSetting.createMany({
    data: [
      { key: "support_email", value: "support@fifatickets.com" },
      { key: "support_phone", value: "+1 (800) 555-FIFA" },
      { key: "max_tickets_online", value: "2" },
      { key: "announcement", value: "Online checkout limited to 2 tickets. Need more? Chat with our bulk sales team." },
    ],
  });

  // Sample customer + paid order for admin demo
  const customer = await prisma.customer.create({
    data: {
      email: "fan@example.com",
      firstName: "Alex",
      lastName: "Rivera",
      phone: "+1 555 0100",
    },
  });

  const demoMatch = await prisma.match.findFirst({ where: { slug: "usa-vs-mexico-metlife" } });
  if (demoMatch) {
    const soldSeats = await prisma.seat.findMany({
      where: { matchId: demoMatch.id, status: "SOLD", categoryId: basic.id },
      take: 2,
    });
    if (soldSeats.length === 2) {
      await prisma.order.create({
        data: {
          orderNumber: "FIFA-DEMO-0001",
          matchId: demoMatch.id,
          customerId: customer.id,
          categoryId: basic.id,
          quantity: 2,
          unitPrice: 70.5,
          totalAmount: 141,
          paymentLinkKey: "BASIC_2",
          paymentUrl: "https://pay.example.com/apple-cash/basic-2",
          paymentStatus: "PAID",
          status: "CONFIRMED",
          items: {
            create: soldSeats.map((s) => ({ seatId: s.id })),
          },
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@fifatickets.com / Admin@FIFA2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
