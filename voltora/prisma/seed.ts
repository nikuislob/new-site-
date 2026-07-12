import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data in FK-safe order
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentLinkMapping.deleteMany();
  await prisma.stadiumZone.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.match.deleteMany();
  await prisma.adminActivityLog.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminUser.deleteMany();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.siteSetting.create({ data: { key, value } });
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  await prisma.adminUser.createMany({
    data: [
      {
        email: "admin@arenanights.example",
        passwordHash,
        name: "Super Admin",
        role: "SUPER_ADMIN",
      },
      {
        email: "tickets@arenanights.example",
        passwordHash,
        name: "Ticket Manager",
        role: "TICKET_MANAGER",
      },
      {
        email: "support@arenanights.example",
        passwordHash,
        name: "Support Agent",
        role: "SUPPORT_AGENT",
      },
    ],
  });

  // Championship final ~45 days from seed time
  const matchDate = new Date();
  matchDate.setDate(matchDate.getDate() + 45);
  matchDate.setHours(20, 0, 0, 0);

  const match = await prisma.match.create({
    data: {
      slug: "championship-final-2026",
      title: "Arena Nights Championship Final",
      teamAName: "North United",
      teamBName: "South Alliance",
      teamACode: "NUN",
      teamBCode: "SAL",
      teamAFlagUrl: "/images/team-north.svg",
      teamBFlagUrl: "/images/team-south.svg",
      matchDate,
      stadiumName: "Lumina Grand Stadium",
      city: "Metro Harbor",
      description:
        "The culminating night of the Arena Nights International Championship. Two continental champions meet under the floodlights.",
      salesEnabled: true,
      isSoldOut: false,
      isFeatured: true,
      isActive: true,
    },
  });

  const standard = await prisma.ticketCategory.create({
    data: {
      matchId: match.id,
      slug: "standard-view",
      name: "STANDARD VIEW",
      description:
        "Experience the full match-day atmosphere with a wide view of the stadium and pitch.",
      priceCents: 8900,
      totalInventory: 500,
      reservedCount: 0,
      soldCount: 0,
      sortOrder: 1,
      isActive: true,
    },
  });

  const good = await prisma.ticketCategory.create({
    data: {
      matchId: match.id,
      slug: "good-view",
      name: "GOOD VIEW",
      description:
        "Enjoy an enhanced viewing position with a clearer perspective of the action.",
      priceCents: 16800,
      totalInventory: 300,
      reservedCount: 0,
      soldCount: 0,
      sortOrder: 2,
      isActive: true,
    },
  });

  const zones = [
    { code: "SU-N", name: "Upper North", categoryId: standard.id, viewingQuality: "STANDARD", svgPathId: "zone-upper-north", sortOrder: 1 },
    { code: "SU-S", name: "Upper South", categoryId: standard.id, viewingQuality: "STANDARD", svgPathId: "zone-upper-south", sortOrder: 2 },
    { code: "SU-E", name: "Upper East", categoryId: standard.id, viewingQuality: "STANDARD", svgPathId: "zone-upper-east", sortOrder: 3 },
    { code: "SU-W", name: "Upper West", categoryId: standard.id, viewingQuality: "STANDARD", svgPathId: "zone-upper-west", sortOrder: 4 },
    { code: "GV-N", name: "Lower North", categoryId: good.id, viewingQuality: "GOOD", svgPathId: "zone-lower-north", sortOrder: 5 },
    { code: "GV-S", name: "Lower South", categoryId: good.id, viewingQuality: "GOOD", svgPathId: "zone-lower-south", sortOrder: 6 },
    { code: "GV-E", name: "Sideline East", categoryId: good.id, viewingQuality: "GOOD", svgPathId: "zone-lower-east", sortOrder: 7 },
    { code: "GV-W", name: "Sideline West", categoryId: good.id, viewingQuality: "GOOD", svgPathId: "zone-lower-west", sortOrder: 8 },
  ];

  for (const zone of zones) {
    await prisma.stadiumZone.create({
      data: {
        matchId: match.id,
        ...zone,
      },
    });
  }

  const applePay = await prisma.paymentMethod.create({
    data: {
      code: "APPLE_PAY",
      name: "Apple Pay",
      iconUrl: "/images/pay-applepay.svg",
      buttonText: "Pay with Apple Pay",
      instructions: "Complete payment using Apple Pay on the secure external checkout page. Return here afterward — payment must be verified before tickets are issued.",
      isActive: true,
      sortOrder: 1,
    },
  });

  const cashApp = await prisma.paymentMethod.create({
    data: {
      code: "CASH_APP",
      name: "Cash App",
      iconUrl: "/images/pay-cashapp.svg",
      buttonText: "Pay with Cash App",
      instructions: "Complete payment using Cash App on the secure external checkout page. Return here afterward — payment must be verified before tickets are issued.",
      isActive: true,
      sortOrder: 2,
    },
  });

  const mappings = [
    { ticketCategoryId: standard.id, quantity: 1, paymentMethodId: applePay.id, expectedAmountCents: 8900, paymentUrl: "https://example.com/pay/standard-1-apple" },
    { ticketCategoryId: standard.id, quantity: 2, paymentMethodId: applePay.id, expectedAmountCents: 17800, paymentUrl: "https://example.com/pay/standard-2-apple" },
    { ticketCategoryId: standard.id, quantity: 1, paymentMethodId: cashApp.id, expectedAmountCents: 8900, paymentUrl: "https://example.com/pay/standard-1-cashapp" },
    { ticketCategoryId: standard.id, quantity: 2, paymentMethodId: cashApp.id, expectedAmountCents: 17800, paymentUrl: "https://example.com/pay/standard-2-cashapp" },
    { ticketCategoryId: good.id, quantity: 1, paymentMethodId: applePay.id, expectedAmountCents: 16800, paymentUrl: "https://example.com/pay/good-1-apple" },
    { ticketCategoryId: good.id, quantity: 2, paymentMethodId: applePay.id, expectedAmountCents: 33600, paymentUrl: "https://example.com/pay/good-2-apple" },
    { ticketCategoryId: good.id, quantity: 1, paymentMethodId: cashApp.id, expectedAmountCents: 16800, paymentUrl: "https://example.com/pay/good-1-cashapp" },
    { ticketCategoryId: good.id, quantity: 2, paymentMethodId: cashApp.id, expectedAmountCents: 33600, paymentUrl: "https://example.com/pay/good-2-cashapp" },
  ];

  for (const mapping of mappings) {
    await prisma.paymentLinkMapping.create({
      data: { ...mapping, isActive: true },
    });
  }

  console.log("✅ Arena Nights seed complete");
  console.log("   Match:", match.title, "on", matchDate.toISOString());
  console.log("   Admin: admin@arenanights.example / Admin123!");
  console.log("   Tickets: tickets@arenanights.example / Admin123!");
  console.log("   Support: support@arenanights.example / Admin123!");
  console.log("   Payment link mappings: 8 combinations seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
