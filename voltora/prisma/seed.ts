import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

const IMG = {
  phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
  tablet: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  earbuds: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  console: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80",
  controller: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80",
  smarthome: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
  powerbank: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
  keyboard: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80",
  charger: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80",
  mouse: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
  vr: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
} as const;

function price(msrp: number) {
  return {
    originalPrice: msrp,
    sellingPrice: Math.round(msrp * 0.2 * 100) / 100,
  };
}

async function main() {
  console.log("Seeding Voltora database...");

  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminActivityLog.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.siteSetting.create({ data: { key, value } });
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const customerHash = await bcrypt.hash("Customer123!", 12);

  const superAdmin = await prisma.adminUser.create({
    data: {
      email: "admin@voltora.example",
      passwordHash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  await prisma.adminUser.createMany({
    data: [
      {
        email: "products@voltora.example",
        passwordHash,
        name: "Product Manager",
        role: "PRODUCT_MANAGER",
      },
      {
        email: "orders@voltora.example",
        passwordHash,
        name: "Order Manager",
        role: "ORDER_MANAGER",
      },
      {
        email: "support@voltora.example",
        passwordHash,
        name: "Support Agent",
        role: "SUPPORT_AGENT",
      },
    ],
  });

  const customer = await prisma.user.create({
    data: {
      email: "demo@customer.example",
      passwordHash: customerHash,
      firstName: "Alex",
      lastName: "Rivera",
      phone: "555-010-2000",
      emailVerified: true,
      addresses: {
        create: {
          label: "Home",
          fullName: "Alex Rivera",
          phone: "555-010-2000",
          line1: "1200 Market Street",
          city: "San Francisco",
          state: "CA",
          zipCode: "94103",
          country: "United States",
          isDefault: true,
        },
      },
    },
  });

  const brandNames = [
    "Apple",
    "Samsung",
    "Sony",
    "Google",
    "Microsoft",
    "Bose",
    "Anker",
    "Logitech",
    "Nintendo",
    "Meta",
    "JBL",
    "Beats",
  ];

  const brands = await Promise.all(
    brandNames.map((name) =>
      prisma.brand.create({
        data: { name, slug: slugify(name), isActive: true },
      })
    )
  );

  const brand = (name: string) => brands.find((b) => b.name === name)!;

  const parentCats = [
    { name: "Smartphones", slug: "smartphones" },
    { name: "Laptops", slug: "laptops" },
    { name: "Tablets", slug: "tablets" },
    { name: "Wearables", slug: "wearables" },
    { name: "Audio", slug: "audio" },
    { name: "Gaming", slug: "gaming" },
    { name: "Smart Home", slug: "smart-home" },
    { name: "Cameras", slug: "cameras" },
    { name: "Chargers & Power", slug: "chargers-power" },
    { name: "Computer Accessories", slug: "computer-accessories" },
  ];

  const categories = [];
  for (let i = 0; i < parentCats.length; i++) {
    const c = await prisma.category.create({
      data: { ...parentCats[i], sortOrder: i, isActive: true },
    });
    categories.push(c);
  }

  const cat = (slug: string) => categories.find((c) => c.slug === slug)!;

  await prisma.category.createMany({
    data: [
      { name: "Wireless Earbuds", slug: "wireless-earbuds", parentId: cat("audio").id, sortOrder: 0 },
      { name: "Headphones", slug: "headphones", parentId: cat("audio").id, sortOrder: 1 },
      { name: "Gaming Consoles", slug: "gaming-consoles", parentId: cat("gaming").id, sortOrder: 0 },
      { name: "Gaming Accessories", slug: "gaming-accessories", parentId: cat("gaming").id, sortOrder: 1 },
      { name: "Smartwatches", slug: "smartwatches", parentId: cat("wearables").id, sortOrder: 0 },
      { name: "Power Banks", slug: "power-banks", parentId: cat("chargers-power").id, sortOrder: 0 },
    ],
  });

  const productsData = [
    {
      sku: "VT-APL-001",
      name: "iPhone 16 Pro",
      brand: "Apple",
      category: "smartphones",
      shortDescription: "Apple's latest Pro iPhone with A18 Pro chip, titanium design, and advanced camera system.",
      fullDescription:
        "iPhone 16 Pro features a stunning 6.3-inch Super Retina XDR display, the powerful A18 Pro chip, and a versatile 48MP camera system with 5x optical zoom. Built for 5G networks across the US with all-day battery life.",
      specs: {
        Display: "6.3-inch Super Retina XDR 120Hz",
        Chip: "A18 Pro",
        Camera: "48MP Main + 48MP Ultra Wide + 12MP 5x Telephoto",
        Battery: "Up to 27 hours video playback",
        OS: "iOS 18",
      },
      mainImage: IMG.phone,
      images: [IMG.phone, IMG.tablet],
      ...price(999),
      stock: 48,
      badges: ["Trending", "Best Seller"],
      featured: true,
      trending: true,
      best: true,
      variants: [
        { name: "128GB / Natural Titanium", sku: "VT-APL-001-128-NT", color: "Natural Titanium", storage: "128GB", stock: 20, mod: 0 },
        { name: "256GB / Natural Titanium", sku: "VT-APL-001-256-NT", color: "Natural Titanium", storage: "256GB", stock: 16, mod: 40 },
        { name: "256GB / Black Titanium", sku: "VT-APL-001-256-BK", color: "Black Titanium", storage: "256GB", stock: 12, mod: 40 },
      ],
    },
    {
      sku: "VT-SAM-002",
      name: "Samsung Galaxy S25",
      brand: "Samsung",
      category: "smartphones",
      shortDescription: "Samsung's 2025 flagship with Galaxy AI, bright AMOLED display, and pro-grade cameras.",
      fullDescription:
        "Galaxy S25 delivers a refined design, Snapdragon-powered performance, and intelligent Galaxy AI features for photos, search, and everyday productivity on US carriers.",
      specs: {
        Display: "6.2-inch Dynamic AMOLED 2X 120Hz",
        Processor: "Snapdragon 8 Elite",
        Camera: "50MP + 12MP + 10MP",
        Battery: "4000mAh",
        OS: "Android 15",
      },
      mainImage: IMG.phone,
      images: [IMG.phone],
      ...price(799),
      stock: 55,
      badges: ["New Arrival", "Featured"],
      newArrival: true,
      featured: true,
      variants: [
        { name: "128GB / Onyx Black", sku: "VT-SAM-002-128-BK", color: "Onyx Black", storage: "128GB", stock: 28, mod: 0 },
        { name: "256GB / Silver Shadow", sku: "VT-SAM-002-256-SV", color: "Silver Shadow", storage: "256GB", stock: 27, mod: 40 },
      ],
    },
    {
      sku: "VT-GGL-003",
      name: "Google Pixel 9",
      brand: "Google",
      category: "smartphones",
      shortDescription: "Google's AI-first smartphone with Tensor G4 and best-in-class computational photography.",
      fullDescription:
        "Pixel 9 combines clean Android, seven years of updates, and Gemini-powered AI assistance. Capture stunning photos in any light with Google's advanced image processing.",
      specs: {
        Display: "6.3-inch Actua OLED 120Hz",
        Chip: "Google Tensor G4",
        Camera: "50MP Wide + 48MP Ultra Wide",
        Battery: "4700mAh",
        OS: "Android 15",
      },
      mainImage: IMG.phone,
      images: [IMG.phone, IMG.smarthome],
      ...price(799),
      stock: 36,
      badges: ["Trending", "Hot Deal"],
      trending: true,
    },
    {
      sku: "VT-APL-004",
      name: "MacBook Air M3",
      brand: "Apple",
      category: "laptops",
      shortDescription: "Ultra-thin laptop with Apple M3 chip, all-day battery, and fanless silent design.",
      fullDescription:
        "MacBook Air with M3 delivers blazing-fast performance for work, school, and creative projects. The 13.6-inch Liquid Retina display and up to 18 hours of battery life make it the ultimate portable Mac.",
      specs: {
        Display: "13.6-inch Liquid Retina",
        Chip: "Apple M3 8-core CPU / 10-core GPU",
        RAM: "8GB unified memory",
        Storage: "256GB SSD",
        Weight: "2.7 lbs",
      },
      mainImage: IMG.laptop,
      images: [IMG.laptop],
      ...price(1099),
      stock: 30,
      badges: ["Featured", "Best Seller"],
      featured: true,
      best: true,
      variants: [
        { name: "8GB / 256GB / Midnight", sku: "VT-APL-004-8-256", color: "Midnight", storage: "256GB", stock: 14, mod: 0 },
        { name: "16GB / 512GB / Starlight", sku: "VT-APL-004-16-512", color: "Starlight", storage: "512GB", stock: 16, mod: 80 },
      ],
    },
    {
      sku: "VT-MSF-005",
      name: "Microsoft Surface Laptop",
      brand: "Microsoft",
      category: "laptops",
      shortDescription: "Premium Windows laptop with Snapdragon X Elite, vivid touchscreen, and all-day battery.",
      fullDescription:
        "Surface Laptop blends sleek aluminum craftsmanship with Copilot+ PC intelligence. Ideal for professionals who want a refined Windows experience with excellent battery life.",
      specs: {
        Display: "13.8-inch PixelSense Flow touchscreen",
        Processor: "Snapdragon X Elite",
        RAM: "16GB",
        Storage: "512GB SSD",
        Weight: "2.96 lbs",
      },
      mainImage: IMG.laptop,
      images: [IMG.laptop, IMG.tablet],
      ...price(999),
      stock: 22,
      badges: ["New Arrival"],
      newArrival: true,
      featured: true,
    },
    {
      sku: "VT-APL-006",
      name: "iPad Pro",
      brand: "Apple",
      category: "tablets",
      shortDescription: "The ultimate iPad with M4 chip, Ultra Retina XDR display, and Apple Pencil Pro support.",
      fullDescription:
        "iPad Pro redefines what's possible on a tablet with the M4 chip, tandem OLED display, and Thunderbolt connectivity. Perfect for creative professionals and power users.",
      specs: {
        Display: "11-inch Ultra Retina XDR OLED",
        Chip: "Apple M4",
        Storage: "256GB",
        Battery: "Up to 10 hours",
        Connectivity: "Wi-Fi 6E",
      },
      mainImage: IMG.tablet,
      images: [IMG.tablet],
      ...price(999),
      stock: 28,
      badges: ["Featured", "Trending"],
      featured: true,
      trending: true,
    },
    {
      sku: "VT-APL-007",
      name: "Apple Watch Ultra 2",
      brand: "Apple",
      category: "wearables",
      shortDescription: "The most capable Apple Watch with rugged titanium case, precision GPS, and 36-hour battery.",
      fullDescription:
        "Apple Watch Ultra 2 is built for adventure with a bright Always-On Retina display, dual-frequency GPS, depth gauge, and advanced health sensors for athletes and explorers.",
      specs: {
        Display: "49mm Always-On Retina",
        Case: "Titanium",
        Battery: "Up to 36 hours",
        Water: "100m water resistant",
        GPS: "Precision dual-frequency",
      },
      mainImage: IMG.watch,
      images: [IMG.watch],
      ...price(799),
      stock: 40,
      badges: ["Best Seller", "Trending"],
      best: true,
      trending: true,
      variants: [
        { name: "Natural Titanium / Alpine Loop", sku: "VT-APL-007-NT-AL", color: "Natural Titanium", stock: 22, mod: 0 },
        { name: "Black Titanium / Ocean Band", sku: "VT-APL-007-BK-OB", color: "Black Titanium", stock: 18, mod: 0 },
      ],
    },
    {
      sku: "VT-APL-008",
      name: "AirPods Pro 2",
      brand: "Apple",
      category: "audio",
      shortDescription: "Premium wireless earbuds with Adaptive Audio, Active Noise Cancellation, and USB-C.",
      fullDescription:
        "AirPods Pro 2 deliver immersive sound with Personalized Spatial Audio, up to 2x more Active Noise Cancellation, and a MagSafe charging case with USB-C.",
      specs: {
        ANC: "Active Noise Cancellation",
        Battery: "6 hours (30 hours with case)",
        Drivers: "Custom high-excursion",
        IP: "IP54 dust and sweat resistant",
        Chip: "H2",
      },
      mainImage: IMG.earbuds,
      images: [IMG.earbuds],
      ...price(249),
      stock: 95,
      badges: ["Best Seller", "Hot Deal"],
      best: true,
      featured: true,
    },
    {
      sku: "VT-SNY-009",
      name: "Sony WH-1000XM5",
      brand: "Sony",
      category: "audio",
      shortDescription: "Industry-leading noise-canceling over-ear headphones with exceptional sound quality.",
      fullDescription:
        "WH-1000XM5 features Sony's best noise cancellation, 30-hour battery life, multipoint connection, and speak-to-chat for effortless everyday listening.",
      specs: {
        Drivers: "30mm",
        ANC: "Industry-leading",
        Battery: "30 hours",
        Connectivity: "Bluetooth 5.2 + 3.5mm",
        Weight: "250g",
      },
      mainImage: IMG.headphones,
      images: [IMG.headphones],
      ...price(399),
      stock: 45,
      badges: ["Featured", "Best Seller"],
      featured: true,
      best: true,
    },
    {
      sku: "VT-SAM-010",
      name: "Samsung Galaxy Buds3",
      brand: "Samsung",
      category: "audio",
      shortDescription: "Galaxy Buds3 with blade lights, adaptive ANC, and seamless Galaxy ecosystem integration.",
      fullDescription:
        "Galaxy Buds3 deliver rich 360 audio, intelligent ANC, and intuitive touch controls. Pair instantly with Galaxy devices or any Bluetooth phone.",
      specs: {
        ANC: "Adaptive",
        Battery: "6 hours buds / 30 hours case",
        Drivers: "11mm",
        IP: "IP57",
        Connectivity: "Bluetooth 5.4",
      },
      mainImage: IMG.earbuds,
      images: [IMG.earbuds, IMG.headphones],
      ...price(179),
      stock: 70,
      badges: ["New Arrival", "Trending"],
      newArrival: true,
      trending: true,
    },
    {
      sku: "VT-SNY-011",
      name: "PlayStation 5",
      brand: "Sony",
      category: "gaming",
      shortDescription: "Sony's next-gen console with ultra-fast SSD, ray tracing, and DualSense controller.",
      fullDescription:
        "PlayStation 5 delivers breathtaking immersion with 4K gaming, haptic feedback, adaptive triggers, and a lightning-fast custom SSD for near-instant load times.",
      specs: {
        Resolution: "Up to 4K 120fps",
        Storage: "1TB SSD",
        "Ray Tracing": "Hardware-accelerated",
        HDR: "Yes",
        Controller: "DualSense wireless",
      },
      mainImage: IMG.console,
      images: [IMG.console, IMG.controller],
      ...price(499),
      stock: 24,
      badges: ["Trending", "Best Seller"],
      trending: true,
      best: true,
      featured: true,
    },
    {
      sku: "VT-NIN-012",
      name: "Nintendo Switch OLED",
      brand: "Nintendo",
      category: "gaming",
      shortDescription: "Nintendo Switch with vibrant 7-inch OLED screen and enhanced audio for handheld play.",
      fullDescription:
        "Switch OLED model features a stunning OLED display, wide adjustable stand, 64GB internal storage, and wired LAN port in the dock for stable online play.",
      specs: {
        Display: "7-inch OLED 720p",
        Storage: "64GB",
        Modes: "TV, Tabletop, Handheld",
        Battery: "4.5–9 hours",
        Audio: "Enhanced speakers",
      },
      mainImage: IMG.console,
      images: [IMG.console],
      ...price(349),
      stock: 38,
      badges: ["Hot Deal", "Featured"],
      featured: true,
    },
    {
      sku: "VT-MTA-013",
      name: "Meta Quest 3",
      brand: "Meta",
      category: "gaming",
      shortDescription: "Mixed reality headset with Snapdragon XR2 Gen 2 and full-color passthrough.",
      fullDescription:
        "Meta Quest 3 blends VR and MR with sharper visuals, faster performance, and a vast library of games and fitness apps. No PC required.",
      specs: {
        Display: "2064 x 2208 per eye",
        Chip: "Snapdragon XR2 Gen 2",
        Storage: "128GB",
        "Passthrough": "Full-color mixed reality",
        Battery: "2–3 hours",
      },
      mainImage: IMG.vr,
      images: [IMG.vr, IMG.smarthome],
      ...price(499),
      stock: 20,
      badges: ["New Arrival", "Trending"],
      newArrival: true,
      trending: true,
    },
    {
      sku: "VT-ANK-015",
      name: "Anker 737 Power Bank",
      brand: "Anker",
      category: "chargers-power",
      shortDescription: "24,000mAh GaN power bank with 140W output and smart digital display.",
      fullDescription:
        "Anker 737 (PowerCore 24K) charges laptops, tablets, and phones at blazing speeds with dual USB-C and one USB-A port. Airline-friendly when under 100Wh.",
      specs: {
        Capacity: "24000mAh (87Wh)",
        Output: "140W max",
        Ports: "2x USB-C, 1x USB-A",
        Tech: "GaN II",
        Display: "Smart digital",
      },
      mainImage: IMG.powerbank,
      images: [IMG.powerbank, IMG.charger],
      ...price(149),
      stock: 110,
      badges: ["Best Seller", "Hot Deal"],
      best: true,
      trending: true,
    },
    {
      sku: "VT-LOG-016",
      name: "Logitech MX Master 3S",
      brand: "Logitech",
      category: "computer-accessories",
      shortDescription: "Premium ergonomic mouse with 8K DPI sensor, quiet clicks, and multi-device flow.",
      fullDescription:
        "MX Master 3S is crafted for precision and comfort with MagSpeed scrolling, USB-C quick charging, and seamless switching between three devices.",
      specs: {
        DPI: "Up to 8000",
        Battery: "Up to 70 days",
        Connectivity: "Bluetooth + Logi Bolt",
        Buttons: "7 programmable",
        Weight: "141g",
      },
      mainImage: IMG.mouse,
      images: [IMG.mouse, IMG.keyboard],
      ...price(99),
      stock: 65,
      badges: ["Trending", "New Arrival"],
      trending: true,
      newArrival: true,
    },
    {
      sku: "VT-APL-017",
      name: "iPhone 16 Pro (Open Box)",
      brand: "Apple",
      category: "smartphones",
      shortDescription: "Inspected open-box iPhone 16 Pro with full functionality and included accessories.",
      fullDescription:
        "Open-box unit inspected by Voltora. Includes USB-C cable and documentation. Cosmetic wear may be present on the titanium frame. 90-day limited warranty.",
      specs: {
        Display: "6.3-inch Super Retina XDR 120Hz",
        Chip: "A18 Pro",
        Storage: "128GB",
        Condition: "Open Box - Excellent",
        Camera: "48MP Pro camera system",
      },
      mainImage: IMG.phone,
      images: [IMG.phone],
      ...price(899),
      stock: 6,
      badges: ["Limited Deal"],
      condition: "OPEN_BOX",
      delivery: "4–6 business days",
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: slugify(p.name),
        brandId: brand(p.brand).id,
        categoryId: cat(p.category).id,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        specifications: JSON.stringify(p.specs),
        mainImage: p.mainImage,
        originalPrice: p.originalPrice,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stock,
        condition: p.condition || "NEW",
        deliveryEstimate: p.delivery || "3–4 business days",
        badges: JSON.stringify(p.badges),
        isFeatured: !!p.featured,
        isTrending: !!p.trending,
        isBestSeller: !!p.best,
        isNewArrival: !!p.newArrival,
        isActive: true,
        salesCount: p.best ? 120 : p.trending ? 80 : 20,
        images: {
          create: p.images.map((url, i) => ({ url, alt: p.name, sortOrder: i })),
        },
        variants: p.variants
          ? {
              create: p.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                color: v.color || null,
                storage: v.storage || null,
                priceModifier: v.mod || 0,
                stockQuantity: v.stock,
                isActive: true,
              })),
            }
          : undefined,
      },
    });
    createdProducts.push(product);
  }

  for (let i = 0; i < createdProducts.length; i++) {
    const related = createdProducts
      .filter((_, idx) => idx !== i)
      .slice(0, 4)
      .map((p) => p.id);
    await prisma.product.update({
      where: { id: createdProducts[i].id },
      data: { relatedIds: JSON.stringify(related) },
    });
  }

  await prisma.paymentMethod.createMany({
    data: [
      {
        slot: 1,
        name: "Cash App",
        iconUrl: "/images/pay-cashapp.svg",
        paymentUrl: "https://www.ggusonepay.com",
        buttonText: "Pay with Cash App",
        instructions:
          "WAYCODE:CASHAPP — Pay the exact order total shown at checkout. Include your Order ID in the payment note. Your order stays Payment Pending until our team confirms payment. Voltora never asks for your Cash App PIN or login credentials.",
        isActive: true,
      },
      {
        slot: 2,
        name: "Google Pay",
        iconUrl: "/images/pay-gpay.svg",
        paymentUrl: "https://www.ggusonepay.com",
        buttonText: "Pay with Google Pay",
        instructions:
          "WAYCODE:GOOGLEPAY — Complete payment for the exact amount shown. Do not share passwords, OTPs, or verification codes with anyone. Order status updates after manual confirmation.",
        isActive: true,
      },
      {
        slot: 3,
        name: "Apple Pay",
        iconUrl: "/images/pay-applepay.svg",
        paymentUrl: "https://www.ggusonepay.com",
        buttonText: "Pay with Apple Pay",
        instructions:
          "WAYCODE:APPLEPAY — Use Apple Pay for the listed order total. Opening this link does not mark your order as paid. Reference your Order ID if prompted.",
        isActive: true,
      },
      {
        slot: 4,
        name: "Chime",
        iconUrl: "/images/pay-chime.svg",
        paymentUrl: "https://www.ggusonepay.com",
        buttonText: "Pay with Chime",
        instructions:
          "WAYCODE:CHIME — Send the exact order total and reference your Order ID in the transfer note. Voltora never asks for banking passwords or Chime login details.",
        isActive: true,
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "10% off your first order",
        discountType: "percent",
        discountValue: 10,
        minOrderAmount: 10,
        maxUses: 1000,
        isActive: true,
      },
      {
        code: "SAVE25",
        description: "$5 off orders over $40",
        discountType: "fixed",
        discountValue: 5,
        minOrderAmount: 40,
        maxUses: 500,
        isActive: true,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin: admin@voltora.example / Admin123!");
  console.log("Customer: demo@customer.example / Customer123!");
  console.log(`Products: ${createdProducts.length}, Super admin: ${superAdmin.email}, Demo customer: ${customer.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
