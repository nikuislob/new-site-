import { prisma } from "./db";

export const DEFAULT_SETTINGS: Record<string, string> = {
  store_name: "Arena Nights",
  store_tagline: "THE WORLD'S BIGGEST FOOTBALL NIGHT AWAITS",
  hero_headline: "THE WORLD'S BIGGEST FOOTBALL NIGHT AWAITS",
  hero_subcopy:
    "Choose your view. Secure your seat. Experience every moment live from inside the stadium.",
  announcement: "Official independent ticket partner experience — not affiliated with FIFA.",
  max_tickets_per_order: "2",
  reservation_minutes: "15",
  support_welcome: "Welcome to Arena Nights support. How can we help with your tickets?",
  footer_disclaimer:
    "Arena Nights is an independent ticket experience platform. We are not affiliated with, endorsed by, or connected to FIFA or any official tournament organizer unless explicitly stated.",
  entry_instructions:
    "Arrive at least 90 minutes before kickoff. Present your QR pass at the designated gate. Valid photo ID may be required.",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  const wanted = keys ?? Object.keys(DEFAULT_SETTINGS);
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: wanted } },
  });
  const map: Record<string, string> = {};
  for (const key of wanted) {
    map[key] = DEFAULT_SETTINGS[key] ?? "";
  }
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function setSetting(key: string, value: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function setSettings(entries: Record<string, string>) {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );
}
