import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes } from "date-fns";
import { buildSeatPlan } from "../src/lib/seats";

const prisma = new PrismaClient();

function kickoff(daysFromNow: number, hour = 19, minute = 0) {
  return setMinutes(setHours(addDays(new Date(), daysFromNow), hour), minute);
}

const FAQ = [
  {
    question: "How many tickets can I buy in one order?",
    answer:
      "Each online order is limited to 2 tickets. For 3 or more seats, submit a bulk request and our team will assist you.",
  },
  {
    question: "Which payment methods do you accept?",
    answer: "We currently accept Apple Pay and Cash App only. Payment links are provided at checkout.",
  },
  {
    question: "Can I choose my exact seats?",
    answer:
      "Yes. After selecting a seat category, use the interactive stadium map to pick available seats by section, row, and number.",
  },
  {
    question: "Will I receive a digital ticket?",
    answer:
      "After payment confirmation you receive an order ID, QR ticket, booking summary, and a printable/downloadable ticket.",
  },
  {
    question: "What happens to past matches?",
    answer:
      "Completed fixtures are automatically hidden from the public site. Only upcoming matches appear in listings and countdowns.",
  },
];

const PRIVACY = `# Privacy Policy

Pitchora ("we", "us") respects your privacy.

## Information We Collect
- Contact details you provide during booking (name, email, phone)
- Order and seat selection details
- Bulk request and contact form submissions

## How We Use Information
- To process ticket bookings and confirmations
- To respond to support and bulk ticket requests
- To improve our platform and prevent fraud

## Sharing
We do not sell personal data. Payment is completed via Apple Pay or Cash App links configured by our administrators.

## Data Retention
Order records are retained for customer service, accounting, and fraud prevention.

## Contact
Email support@pitchora.com for privacy questions.`;

const TERMS = `# Terms & Conditions

By using Pitchora you agree to these terms.

## Ticket Limits
Online purchases are limited to a maximum of 2 tickets per order. Requests for 3+ tickets must go through our bulk request process.

## Payments
Accepted methods are Apple Pay and Cash App only. Orders remain pending until payment is verified.

## Seat Availability
Seat maps update in real time. Selecting a seat reserves it for your checkout session subject to availability at confirmation.

## Refunds
Refund eligibility depends on the event organizer and match status. Contact support for assistance.

## Conduct
Tickets are for personal use. Resale restrictions may apply depending on venue policy.

## Liability
Pitchora provides a booking platform and is not liable for match postponements, cancellations, or venue decisions beyond facilitating customer communication.`;

async function main() {
  await prisma.seat.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bulkRequest.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.settings.deleteMany();

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  await prisma.adminUser.create({
    data: {
      email: "admin@pitchora.com",
      passwordHash,
      name: "Pitchora Admin",
      role: "SUPER_ADMIN",
    },
  });

  await prisma.settings.create({
    data: {
      id: "default",
      upperSeatPrice: 89,
      closerSeatPrice: 218,
      maxTicketsPerOrder: 2,
      serviceFeeEnabled: false,
      serviceFeePercent: 5,
      taxEnabled: false,
      taxPercent: 8.25,
      uniquePaymentEnabled: true,
      upperApplePayUrl: "https://www.apple.com/apple-pay/",
      upperCashAppUrl: "https://cash.app/$PitchoraUpper",
      closerApplePayUrl: "https://www.apple.com/apple-pay/",
      closerCashAppUrl: "https://cash.app/$PitchoraCloser",
      siteName: "Pitchora",
      heroHeadline: "Book Your Football Tickets",
      heroSubheadline: "Premium seats. Iconic stadiums. Unforgettable nights under the lights.",
      contactEmail: "support@pitchora.com",
      contactPhone: "+1 (555) 014-2200",
      contactAddress: "1200 Arena Boulevard, Suite 400, Austin, TX 78701",
      whatsappUrl: "https://wa.me/15550142200",
      liveChatEnabled: true,
      footerText: "Premium football ticket experiences worldwide.",
      faqJson: JSON.stringify(FAQ),
      privacyPolicy: PRIVACY,
      termsAndConditions: TERMS,
    },
  });

  const teams = await Promise.all(
    [
      { name: "Aurora FC", shortName: "AUR", country: "United States", logoUrl: "/teams/aurora.svg" },
      { name: "Cascade United", shortName: "CAS", country: "Canada", logoUrl: "/teams/cascade.svg" },
      { name: "Verdant Rovers", shortName: "VER", country: "Ireland", logoUrl: "/teams/verdant.svg" },
      { name: "Gold Harbor SC", shortName: "GHS", country: "Portugal", logoUrl: "/teams/goldharbor.svg" },
      { name: "Northwind Athletic", shortName: "NWA", country: "Scotland", logoUrl: "/teams/northwind.svg" },
      { name: "Ember City FC", shortName: "EMB", country: "Spain", logoUrl: "/teams/ember.svg" },
      { name: "Silverline United", shortName: "SLU", country: "England", logoUrl: "/teams/silverline.svg" },
      { name: "Pacific Titans", shortName: "PAC", country: "Japan", logoUrl: "/teams/pacific.svg" },
    ].map((team) => prisma.team.create({ data: team }))
  );

  const fixtures = [
    {
      home: teams[0],
      away: teams[1],
      kickoffAt: kickoff(3, 19, 30),
      stadium: "Aurora Grand Arena",
      country: "United States",
      city: "Austin",
      isFeatured: true,
      upperSeatsTotal: 200,
      closerSeatsTotal: 160,
    },
    {
      home: teams[2],
      away: teams[3],
      kickoffAt: kickoff(7, 20, 0),
      stadium: "Emerald Pitch",
      country: "Ireland",
      city: "Dublin",
      isFeatured: true,
      upperSeatsTotal: 220,
      closerSeatsTotal: 160,
    },
    {
      home: teams[4],
      away: teams[5],
      kickoffAt: kickoff(12, 18, 45),
      stadium: "Highland Lights Stadium",
      country: "Scotland",
      city: "Glasgow",
      isFeatured: false,
      upperSeatsTotal: 200,
      closerSeatsTotal: 160,
    },
    {
      home: teams[6],
      away: teams[7],
      kickoffAt: kickoff(18, 21, 0),
      stadium: "Coastal Crown Bowl",
      country: "England",
      city: "Manchester",
      isFeatured: true,
      upperSeatsTotal: 200,
      closerSeatsTotal: 160,
    },
    {
      home: teams[1],
      away: teams[6],
      kickoffAt: kickoff(24, 19, 0),
      stadium: "Cascade Dome",
      country: "Canada",
      city: "Vancouver",
      isFeatured: false,
      upperSeatsTotal: 200,
      closerSeatsTotal: 160,
    },
    {
      home: teams[5],
      away: teams[0],
      kickoffAt: kickoff(30, 20, 15),
      stadium: "Ember Night Stadium",
      country: "Spain",
      city: "Seville",
      isFeatured: false,
      upperSeatsTotal: 200,
      closerSeatsTotal: 160,
    },
  ];

  for (const fixture of fixtures) {
    const match = await prisma.match.create({
      data: {
        homeTeamId: fixture.home.id,
        awayTeamId: fixture.away.id,
        kickoffAt: fixture.kickoffAt,
        stadium: fixture.stadium,
        country: fixture.country,
        city: fixture.city,
        stadiumImageUrl: "/stadium-hero.svg",
        isFeatured: fixture.isFeatured,
        upperSeatsTotal: fixture.upperSeatsTotal,
        closerSeatsTotal: fixture.closerSeatsTotal,
        upperSeatsSold: 12,
        closerSeatsSold: 8,
        status: "UPCOMING",
      },
    });

    const plan = buildSeatPlan();
    const soldCloser = plan
      .filter((s) => s.category === "CLOSER")
      .slice(0, 8)
      .map((s) => `${s.section}-${s.row}-${s.number}`);
    const soldUpper = plan
      .filter((s) => s.category === "UPPER")
      .slice(0, 12)
      .map((s) => `${s.section}-${s.row}-${s.number}`);
    const reserved = new Set([...soldCloser, ...soldUpper]);

    await prisma.seat.createMany({
      data: plan.map((seat) => {
        const key = `${seat.section}-${seat.row}-${seat.number}`;
        return {
          matchId: match.id,
          section: seat.section,
          row: seat.row,
          number: seat.number,
          category: seat.category,
          status: reserved.has(key) ? "SOLD" : "AVAILABLE",
        };
      }),
    });
  }

  console.log("Pitchora seed complete.");
  console.log("Admin: admin@pitchora.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
