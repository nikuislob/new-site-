import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const paymentAmounts = [7000, 14000, 21000, 28000];

const matches = [
  {
    homeTeam: "USA",
    awayTeam: "Mexico",
    homeFlag: "🇺🇸",
    awayFlag: "🇲🇽",
    stage: "Group Stage",
    groupName: "Group A",
    kickoffAt: new Date("2026-06-12T00:00:00.000Z"),
    venueName: "MetLife Stadium",
    venueCity: "East Rutherford",
    venueState: "NJ",
    venueCapacity: 82500,
    coverImage: null,
    description: "A marquee North American rivalry opens a packed summer of soccer for US fans.",
    isFeatured: true,
    isPublished: true,
    basicStock: 650,
    premiumStock: 220,
  },
  {
    homeTeam: "Brazil",
    awayTeam: "Argentina",
    homeFlag: "🇧🇷",
    awayFlag: "🇦🇷",
    stage: "Group Stage",
    groupName: "Group B",
    kickoffAt: new Date("2026-06-15T01:00:00.000Z"),
    venueName: "SoFi Stadium",
    venueCity: "Inglewood",
    venueState: "CA",
    venueCapacity: 70240,
    coverImage: null,
    description: "South American giants meet under the lights in Los Angeles.",
    isFeatured: true,
    isPublished: true,
    basicStock: 520,
    premiumStock: 180,
  },
  {
    homeTeam: "England",
    awayTeam: "France",
    homeFlag: "🇬🇧",
    awayFlag: "🇫🇷",
    stage: "Group Stage",
    groupName: "Group C",
    kickoffAt: new Date("2026-06-18T23:00:00.000Z"),
    venueName: "AT&T Stadium",
    venueCity: "Arlington",
    venueState: "TX",
    venueCapacity: 80000,
    coverImage: null,
    description: "Two European contenders bring pace, pressure, and star power to Texas.",
    isFeatured: true,
    isPublished: true,
    basicStock: 580,
    premiumStock: 210,
  },
  {
    homeTeam: "Germany",
    awayTeam: "Spain",
    homeFlag: "🇩🇪",
    awayFlag: "🇪🇸",
    stage: "Group Stage",
    groupName: "Group D",
    kickoffAt: new Date("2026-06-20T22:00:00.000Z"),
    venueName: "Hard Rock Stadium",
    venueCity: "Miami Gardens",
    venueState: "FL",
    venueCapacity: 64767,
    coverImage: null,
    description: "A tactical showcase pairs Germany's structure with Spain's possession game.",
    isFeatured: false,
    isPublished: true,
    basicStock: 500,
    premiumStock: 160,
  },
  {
    homeTeam: "Japan",
    awayTeam: "Canada",
    homeFlag: "🇯🇵",
    awayFlag: "🇨🇦",
    stage: "Group Stage",
    groupName: "Group E",
    kickoffAt: new Date("2026-06-23T00:30:00.000Z"),
    venueName: "Lumen Field",
    venueCity: "Seattle",
    venueState: "WA",
    venueCapacity: 68740,
    coverImage: null,
    description: "High-tempo Japan faces a fast Canadian side in the Pacific Northwest.",
    isFeatured: false,
    isPublished: true,
    basicStock: 620,
    premiumStock: 190,
  },
  {
    homeTeam: "USA",
    awayTeam: "Brazil",
    homeFlag: "🇺🇸",
    awayFlag: "🇧🇷",
    stage: "Round of 16",
    groupName: null,
    kickoffAt: new Date("2026-06-28T01:00:00.000Z"),
    venueName: "Mercedes-Benz Stadium",
    venueCity: "Atlanta",
    venueState: "GA",
    venueCapacity: 71000,
    coverImage: null,
    description: "A knockout-stage test with tournament pressure and a roaring home crowd.",
    isFeatured: true,
    isPublished: true,
    basicStock: 450,
    premiumStock: 175,
  },
  {
    homeTeam: "Mexico",
    awayTeam: "Canada",
    homeFlag: "🇲🇽",
    awayFlag: "🇨🇦",
    stage: "Round of 16",
    groupName: null,
    kickoffAt: new Date("2026-06-30T00:00:00.000Z"),
    venueName: "NRG Stadium",
    venueCity: "Houston",
    venueState: "TX",
    venueCapacity: 72220,
    coverImage: null,
    description: "A North American knockout clash built for noise, speed, and late drama.",
    isFeatured: false,
    isPublished: true,
    basicStock: 480,
    premiumStock: 150,
  },
  {
    homeTeam: "Argentina",
    awayTeam: "Germany",
    homeFlag: "🇦🇷",
    awayFlag: "🇩🇪",
    stage: "Round of 16",
    groupName: null,
    kickoffAt: new Date("2026-07-02T02:00:00.000Z"),
    venueName: "Levi's Stadium",
    venueCity: "Santa Clara",
    venueState: "CA",
    venueCapacity: 68500,
    coverImage: null,
    description: "A classic knockout fixture between two nations with deep World Cup history.",
    isFeatured: true,
    isPublished: true,
    basicStock: 430,
    premiumStock: 165,
  },
];

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentLinkOverride.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.match.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminActivityLog.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await hashPassword("Admin123!");
  await prisma.adminUser.createMany({
    data: [
      {
        email: "admin@pitchpass.example",
        passwordHash: adminPasswordHash,
        role: "SUPER_ADMIN",
        name: "Site Operator",
      },
      {
        email: "matches@pitchpass.example",
        passwordHash: adminPasswordHash,
        role: "MATCH_MANAGER",
        name: "Match Manager",
      },
      {
        email: "orders@pitchpass.example",
        passwordHash: adminPasswordHash,
        role: "ORDER_MANAGER",
        name: "Order Manager",
      },
      {
        email: "support@pitchpass.example",
        passwordHash: adminPasswordHash,
        role: "SUPPORT_AGENT",
        name: "Support Agent",
      },
    ],
  });

  await prisma.user.create({
    data: {
      email: "demo@customer.example",
      passwordHash: await hashPassword("Customer123!"),
      firstName: "Demo",
      lastName: "Fan",
    },
  });

  const cashApp = await prisma.paymentMethod.create({
    data: {
      code: "CASHAPP",
      name: "Cash App",
      // Fallback template if POLAPINE_API_KEY is unset; live checkout uses Polapine API links.
      urlTemplate: "https://pay.polapine.com/pay/@pitchpass",
      iconUrl: "/images/pay-cashapp.svg",
      buttonText: "Pay with Cash App",
      instructions:
        "You will be redirected to Polapine Cash App checkout for the exact order total. After paying, return here — PitchPass confirms payment automatically via webhook.",
      isActive: true,
      sortOrder: 1,
    },
  });

  const applePay = await prisma.paymentMethod.create({
    data: {
      code: "APPLEPAY",
      name: "Apple Pay",
      urlTemplate: "https://example.com/pay/applepay/{amount}",
      iconUrl: "/images/pay-applepay.svg",
      buttonText: "Pay with Apple Pay",
      instructions:
        "Complete payment with Apple Pay and include your PitchPass Order ID in the note so support can confirm your tickets quickly.",
      isActive: false,
      sortOrder: 2,
    },
  });

  for (const method of [
    { id: cashApp.id, path: "cashapp" },
    { id: applePay.id, path: "applepay" },
  ]) {
    await prisma.paymentLinkOverride.createMany({
      data: paymentAmounts.map((amountCents) => {
        const dollars = amountCents / 100;
        return {
          paymentMethodId: method.id,
          amountCents,
          paymentUrl: `https://example.com/pay/${method.path}/${dollars}`,
          isActive: false,
        };
      }),
    });
  }

  for (const match of matches) {
    const datePart = match.kickoffAt.toISOString().slice(0, 10);
    await prisma.match.create({
      data: {
        ...match,
        slug: slugify(`${match.homeTeam} vs ${match.awayTeam} ${datePart}`),
      },
    });
  }

  await prisma.siteSetting.createMany({
    data: [
      { key: "siteName", value: "PitchPass" },
      {
        key: "announcement",
        value: "US fans: Basic seats $70 · Premium $140 · Max 2 tickets per order",
      },
    ],
  });
}

main()
  .then(async () => {
    console.log("PitchPass seed complete.");
    console.log("Admin: admin@pitchpass.example / Admin123!");
    console.log("Customer: demo@customer.example / Customer123!");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
