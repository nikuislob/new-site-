import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

/** Deterministic pseudo-random from seed string */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type ZoneSeatPlan = {
  code: string;
  name: string;
  section: string;
  categorySlug: "standard-view" | "good-view";
  viewingQuality: string;
  svgPathId: string;
  sortOrder: number;
  blocks: string[];
  rows: string[];
  seatsPerRow: number;
  availableCount: number;
  originX: number;
  originY: number;
  stepX: number;
  stepY: number;
};

const ZONE_PLANS: ZoneSeatPlan[] = [
  {
    code: "SU-N",
    name: "Upper North",
    section: "312",
    categorySlug: "standard-view",
    viewingQuality: "STANDARD",
    svgPathId: "zone-upper-north",
    sortOrder: 1,
    blocks: ["A", "B"],
    rows: ["12", "13", "14"],
    seatsPerRow: 4,
    availableCount: 3,
    originX: 130,
    originY: 28,
    stepX: 18,
    stepY: 12,
  },
  {
    code: "SU-S",
    name: "Upper South",
    section: "318",
    categorySlug: "standard-view",
    viewingQuality: "STANDARD",
    svgPathId: "zone-upper-south",
    sortOrder: 2,
    blocks: ["A", "B"],
    rows: ["20", "21", "22"],
    seatsPerRow: 4,
    availableCount: 3,
    originX: 130,
    originY: 348,
    stepX: 18,
    stepY: 12,
  },
  {
    code: "SU-E",
    name: "Upper East",
    section: "324",
    categorySlug: "standard-view",
    viewingQuality: "STANDARD",
    svgPathId: "zone-upper-east",
    sortOrder: 3,
    blocks: ["C"],
    rows: ["15", "16", "17", "18"],
    seatsPerRow: 3,
    availableCount: 2,
    originX: 342,
    originY: 120,
    stepX: 12,
    stepY: 18,
  },
  {
    code: "SU-W",
    name: "Upper West",
    section: "306",
    categorySlug: "standard-view",
    viewingQuality: "STANDARD",
    svgPathId: "zone-upper-west",
    sortOrder: 4,
    blocks: ["C"],
    rows: ["15", "16", "17", "18"],
    seatsPerRow: 3,
    availableCount: 2,
    originX: 34,
    originY: 120,
    stepX: 12,
    stepY: 18,
  },
  {
    code: "GV-N",
    name: "Lower North",
    section: "114",
    categorySlug: "good-view",
    viewingQuality: "GOOD",
    svgPathId: "zone-lower-north",
    sortOrder: 5,
    blocks: ["A", "B"],
    rows: ["6", "7", "8"],
    seatsPerRow: 3,
    availableCount: 3,
    originX: 145,
    originY: 92,
    stepX: 16,
    stepY: 10,
  },
  {
    code: "GV-S",
    name: "Lower South",
    section: "120",
    categorySlug: "good-view",
    viewingQuality: "GOOD",
    svgPathId: "zone-lower-south",
    sortOrder: 6,
    blocks: ["A", "B"],
    rows: ["9", "10", "11"],
    seatsPerRow: 3,
    availableCount: 2,
    originX: 145,
    originY: 290,
    stepX: 16,
    stepY: 10,
  },
  {
    code: "GV-E",
    name: "Sideline East",
    section: "108",
    categorySlug: "good-view",
    viewingQuality: "GOOD",
    svgPathId: "zone-lower-east",
    sortOrder: 7,
    blocks: ["A"],
    rows: ["5", "6", "7", "8"],
    seatsPerRow: 2,
    availableCount: 2,
    originX: 286,
    originY: 145,
    stepX: 10,
    stepY: 16,
  },
  {
    code: "GV-W",
    name: "Sideline West",
    section: "102",
    categorySlug: "good-view",
    viewingQuality: "GOOD",
    svgPathId: "zone-lower-west",
    sortOrder: 8,
    blocks: ["A"],
    rows: ["5", "6", "7", "8"],
    seatsPerRow: 2,
    availableCount: 2,
    originX: 96,
    originY: 145,
    stepX: 10,
    stepY: 16,
  },
];

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentLinkMapping.deleteMany();
  await prisma.stadiumZone.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.match.deleteMany();
  await prisma.adminActivityLog.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.siteSetting.create({ data: { key, value } });
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const customerHash = await bcrypt.hash("Customer123!", 12);

  await prisma.adminUser.createMany({
    data: [
      { email: "admin@arenanights.example", passwordHash, name: "Super Admin", role: "SUPER_ADMIN" },
      { email: "tickets@arenanights.example", passwordHash, name: "Ticket Manager", role: "TICKET_MANAGER" },
      { email: "support@arenanights.example", passwordHash, name: "Support Agent", role: "SUPPORT_AGENT" },
    ],
  });

  await prisma.user.create({
    data: {
      email: "demo@customer.example",
      passwordHash: customerHash,
      fullName: "Demo Fan",
      phone: "+1 555 0100",
    },
  });

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
      totalInventory: 40,
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
      totalInventory: 24,
      reservedCount: 0,
      soldCount: 0,
      sortOrder: 2,
      isActive: true,
    },
  });

  const categoryBySlug = {
    "standard-view": standard,
    "good-view": good,
  } as const;

  let totalAvailable = 0;

  for (const plan of ZONE_PLANS) {
    const category = categoryBySlug[plan.categorySlug];
    const zone = await prisma.stadiumZone.create({
      data: {
        matchId: match.id,
        categoryId: category.id,
        code: plan.code,
        name: plan.name,
        sectionLabel: plan.section,
        viewingQuality: plan.viewingQuality,
        svgPathId: plan.svgPathId,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    });

    const seatDefs: Array<{
      section: string;
      block: string;
      row: string;
      seatNumber: string;
      posX: number;
      posY: number;
    }> = [];

    let idx = 0;
    for (const block of plan.blocks) {
      for (let r = 0; r < plan.rows.length; r++) {
        for (let s = 0; s < plan.seatsPerRow; s++) {
          const seatNumber = String(10 + s + block.charCodeAt(0) - 65 * 0);
          seatDefs.push({
            section: plan.section,
            block,
            row: plan.rows[r],
            seatNumber: String(Number(seatNumber) + s + r),
            posX: plan.originX + s * plan.stepX + (block === "B" ? plan.stepX * plan.seatsPerRow + 8 : 0),
            posY: plan.originY + r * plan.stepY,
          });
          idx++;
        }
      }
    }

    // Deduplicate seat numbers within zone
    const seen = new Set<string>();
    const uniqueDefs = seatDefs.filter((d) => {
      const key = `${d.section}-${d.block}-${d.row}-${d.seatNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const rand = seededRandom(`${match.id}-${plan.code}`);
    const indices = uniqueDefs.map((_, i) => i);
    // Fisher-Yates with seeded random
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const availableSet = new Set(indices.slice(0, plan.availableCount));
    totalAvailable += plan.availableCount;

    for (let i = 0; i < uniqueDefs.length; i++) {
      const d = uniqueDefs[i];
      await prisma.seat.create({
        data: {
          matchId: match.id,
          zoneId: zone.id,
          categoryId: category.id,
          section: d.section,
          block: d.block,
          row: d.row,
          seatNumber: d.seatNumber,
          status: availableSet.has(i) ? "AVAILABLE" : "UNAVAILABLE",
          posX: d.posX,
          posY: d.posY,
        },
      });
    }
  }

  // Sync inventory totals to seat counts
  const stdAvail = await prisma.seat.count({
    where: { categoryId: standard.id, status: "AVAILABLE" },
  });
  const goodAvail = await prisma.seat.count({
    where: { categoryId: good.id, status: "AVAILABLE" },
  });
  const stdTotal = await prisma.seat.count({ where: { categoryId: standard.id } });
  const goodTotal = await prisma.seat.count({ where: { categoryId: good.id } });

  await prisma.ticketCategory.update({
    where: { id: standard.id },
    data: { totalInventory: stdTotal, soldCount: stdTotal - stdAvail },
  });
  await prisma.ticketCategory.update({
    where: { id: good.id },
    data: { totalInventory: goodTotal, soldCount: goodTotal - goodAvail },
  });

  const applePay = await prisma.paymentMethod.create({
    data: {
      code: "APPLE_PAY",
      name: "Apple Pay",
      iconUrl: "/images/pay-applepay.svg",
      buttonText: "Pay with Apple Pay",
      instructions:
        "Complete payment using Apple Pay on the secure external checkout page. Return here afterward — payment must be verified before tickets are issued.",
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
      instructions:
        "Complete payment using Cash App on the secure external checkout page. Return here afterward — payment must be verified before tickets are issued.",
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
    await prisma.paymentLinkMapping.create({ data: { ...mapping, isActive: true } });
  }

  console.log("✅ Arena Nights seed complete");
  console.log("   Available seats:", totalAvailable, "(persisted, not random on refresh)");
  console.log("   Admin: admin@arenanights.example / Admin123!");
  console.log("   Customer: demo@customer.example / Customer123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
