import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

const pitchPassSettings: Record<string, string> = {
  ...DEFAULT_SETTINGS,
  store_name: "PitchPass",
  store_tagline: "Your seat. Your match. Your moment.",
  announcement_bar: "World Cup 2026 · Transparent pricing · Ticket delivery updates",
  hero_title: "Your Seat. Your Match. Your Moment.",
  hero_subtitle: "Discover tickets for the remaining FIFA World Cup 2026 matches, with clear pricing and support at every step.",
  hero_cta_text: "Explore matches",
  hero_cta_link: "/#matches",
  footer_about: "PitchPass is an independent ticket marketplace for remaining FIFA World Cup 2026 matches. PitchPass is not affiliated with or endorsed by FIFA.",
  contact_email: "support@pitchpass.example",
  contact_phone: "+1 (800) 555-2026",
  service_fee_percent: "8",
  reservation_minutes: "10",
  tax_percent: "0",
  payment_link_allowlist: "pay.google.com,apple.com,square.link,cash.app,stripe.com",
  match_api_provider: "football-data",
  match_sync_enabled: "true",
};

async function main() {
  await prisma.approvedPaymentLink.deleteMany();
  await prisma.ticketDelivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.inventoryReservation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketListing.deleteMany();
  await prisma.eventMatch.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.adminActivityLog.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();

  await prisma.siteSetting.createMany({
    data: Object.entries(pitchPassSettings).map(([key, value]) => ({ key, value })),
  });

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  await prisma.adminUser.createMany({
    data: [
      { email: "admin@pitchpass.example", passwordHash, name: "PitchPass Admin", role: "SUPER_ADMIN" },
      { email: "inventory@pitchpass.example", passwordHash, name: "Inventory Manager", role: "PRODUCT_MANAGER" },
      { email: "orders@pitchpass.example", passwordHash, name: "Order Manager", role: "ORDER_MANAGER" },
      { email: "support@pitchpass.example", passwordHash, name: "Support Agent", role: "SUPPORT_AGENT" },
    ],
  });

  const customerPassword = await bcrypt.hash("Customer123!", 12);
  await prisma.user.create({
    data: {
      email: "demo@pitchpass.example",
      passwordHash: customerPassword,
      firstName: "Alex",
      lastName: "Morgan",
      phone: "+1 202 555 0142",
      emailVerified: true,
    },
  });

  const venues = await Promise.all([
    prisma.venue.create({ data: { externalId: "atlanta", name: "Atlanta Stadium", city: "Atlanta", region: "Georgia", timezone: "America/New_York", capacity: 75000 } }),
    prisma.venue.create({ data: { externalId: "dallas", name: "Dallas Stadium", city: "Arlington", region: "Texas", timezone: "America/Chicago", capacity: 94000 } }),
    prisma.venue.create({ data: { externalId: "miami", name: "Miami Stadium", city: "Miami Gardens", region: "Florida", timezone: "America/New_York", capacity: 64000 } }),
    prisma.venue.create({ data: { externalId: "new-york-new-jersey", name: "New York New Jersey Stadium", city: "East Rutherford", region: "New Jersey", timezone: "America/New_York", capacity: 82500 } }),
  ]);

  const matches = await Promise.all([
    prisma.eventMatch.create({
      data: {
        externalId: "wc26-sf1",
        slug: "semi-final-1-atlanta",
        round: "Semi-final",
        homeTeam: "Winner of Quarter-final 1",
        awayTeam: "Winner of Quarter-final 2",
        homePlaceholder: "Winner of Quarter-final 1",
        awayPlaceholder: "Winner of Quarter-final 2",
        kickoffAt: new Date("2026-07-14T19:00:00-04:00"),
        venueId: venues[0].id,
      },
    }),
    prisma.eventMatch.create({
      data: {
        externalId: "wc26-sf2",
        slug: "semi-final-2-dallas",
        round: "Semi-final",
        homeTeam: "Winner of Quarter-final 3",
        awayTeam: "Winner of Quarter-final 4",
        homePlaceholder: "Winner of Quarter-final 3",
        awayPlaceholder: "Winner of Quarter-final 4",
        kickoffAt: new Date("2026-07-15T19:00:00-05:00"),
        venueId: venues[1].id,
      },
    }),
    prisma.eventMatch.create({
      data: {
        externalId: "wc26-third-place",
        slug: "third-place-playoff-miami",
        round: "Third-place play-off",
        homeTeam: "Loser of Semi-final 1",
        awayTeam: "Loser of Semi-final 2",
        homePlaceholder: "Loser of Semi-final 1",
        awayPlaceholder: "Loser of Semi-final 2",
        kickoffAt: new Date("2026-07-18T17:00:00-04:00"),
        venueId: venues[2].id,
      },
    }),
    prisma.eventMatch.create({
      data: {
        externalId: "wc26-final",
        slug: "world-cup-final-new-york-new-jersey",
        round: "Final",
        homeTeam: "Winner of Semi-final 1",
        awayTeam: "Winner of Semi-final 2",
        homePlaceholder: "Winner of Semi-final 1",
        awayPlaceholder: "Winner of Semi-final 2",
        kickoffAt: new Date("2026-07-19T15:00:00-04:00"),
        venueId: venues[3].id,
      },
    }),
  ]);

  const templates = [
    { category: "Category 3", section: "Upper Level", row: "18–24", mapZone: "UPPER", price: 425, quantityTotal: 20, quantityAvailable: 20, exactSeats: null, notes: "Exact seats assigned before delivery." },
    { category: "Category 2", section: "Corner Lower", row: "12", mapZone: "CORNER", price: 695, quantityTotal: 8, quantityAvailable: 8, exactSeats: "1–8", notes: "Clear sightline. Mobile transfer or PDF." },
    { category: "Category 1", section: "Lower Sideline", row: "8", mapZone: "SIDELINE", price: 1125, quantityTotal: 6, quantityAvailable: 6, exactSeats: "14–19", notes: "Seats together in adjacent pairs." },
    { category: "Premium", section: "Club Level", row: "5", mapZone: "CLUB", price: 1890, quantityTotal: 4, quantityAvailable: 4, exactSeats: "21–24", notes: "Premium padded seating; lounge access is not included." },
  ];

  for (const [matchIndex, match] of matches.entries()) {
    for (const [listingIndex, template] of templates.entries()) {
      await prisma.ticketListing.create({
        data: {
          ...template,
          matchId: match.id,
          price: template.price + matchIndex * 160 + listingIndex * 25,
          allowedQuantities: listingIndex === 2 ? "[2,4,6]" : "[]",
          seatsTogether: true,
          ticketType: listingIndex === 0 ? "Category allocation" : "Reserved seat",
        },
      });
    }
  }

  console.log("PitchPass seed complete");
  console.log("Admin: admin@pitchpass.example / Admin123!");
  console.log("Customer: demo@pitchpass.example / Customer123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
