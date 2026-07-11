import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

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

  const brands = await Promise.all(
    ["Apextron", "Nimbus Audio", "Orbitek", "LumenHome", "PlayForge", "ClearShot", "PowerNest", "CircuitOne"].map(
      (name) =>
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
      sku: "VT-PH-001",
      name: "Apextron Pulse X1 5G",
      brand: "Apextron",
      category: "smartphones",
      shortDescription: "Flagship 5G smartphone with bright OLED display and all-day battery.",
      fullDescription:
        "The Apextron Pulse X1 pairs a vivid 6.7-inch OLED panel with a versatile triple camera system and 5G connectivity. Designed for everyday US carriers and long battery life.",
      specs: { Display: "6.7-inch OLED 120Hz", Chipset: "Apextron A8", Battery: "5000mAh", Camera: "50MP + 12MP + 12MP", OS: "Android 15" },
      mainImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80",
      ],
      originalPrice: 199.8,
      sellingPrice: 169.8,
      stock: 42,
      badges: ["Trending", "Best Seller"],
      featured: true,
      trending: true,
      best: true,
      variants: [
        { name: "128GB / Midnight", sku: "VT-PH-001-128-BK", color: "Midnight", storage: "128GB", stock: 18, mod: 0.0 },
        { name: "256GB / Midnight", sku: "VT-PH-001-256-BK", color: "Midnight", storage: "256GB", stock: 14, mod: 20.0 },
        { name: "256GB / Silver", sku: "VT-PH-001-256-SV", color: "Silver", storage: "256GB", stock: 10, mod: 20.0 },
      ],
    },
    {
      sku: "VT-LP-002",
      name: "Orbitek NovaBook 14",
      brand: "Orbitek",
      category: "laptops",
      shortDescription: "Ultra-portable 14-inch laptop for creators and professionals.",
      fullDescription:
        "NovaBook 14 balances performance and portability with a sharp IPS display, modern connectivity, and a quiet cooling design suited for travel and desk work.",
      specs: { Display: "14-inch IPS 2.2K", Processor: "Intel Core Ultra 7", RAM: "16GB", Storage: "512GB SSD", Weight: "2.9 lbs" },
      mainImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80"],
      originalPrice: 259.8,
      sellingPrice: 219.8,
      stock: 28,
      badges: ["Featured", "Hot Deal"],
      featured: true,
      best: true,
      variants: [
        { name: "16GB / 512GB", sku: "VT-LP-002-16-512", storage: "512GB", stock: 16, mod: 0.0 },
        { name: "32GB / 1TB", sku: "VT-LP-002-32-1TB", storage: "1TB", stock: 12, mod: 50.0 },
      ],
    },
    {
      sku: "VT-TB-003",
      name: "Orbitek TabAir 11",
      brand: "Orbitek",
      category: "tablets",
      shortDescription: "Lightweight tablet for streaming, sketching, and productivity.",
      fullDescription: "TabAir 11 delivers a crisp display and long battery life in a slim aluminum body. Optional keyboard accessory supported.",
      specs: { Display: "11-inch Liquid Retina", Chip: "Orbit N3", Storage: "128GB", Battery: "Up to 12 hours" },
      mainImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80"],
      originalPrice: 119.8,
      sellingPrice: 99.8,
      stock: 35,
      badges: ["New Arrival"],
      newArrival: true,
      featured: true,
    },
    {
      sku: "VT-SW-004",
      name: "Apextron Motion Watch Pro",
      brand: "Apextron",
      category: "wearables",
      shortDescription: "Advanced smartwatch with GPS, heart rate, and multi-day battery.",
      fullDescription: "Track workouts, sleep, and notifications with a bright always-on display and water resistance for daily training.",
      specs: { Display: "1.4-inch AMOLED", Sensors: "HR, SpO2, GPS", Battery: "Up to 7 days", Water: "5ATM" },
      mainImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"],
      originalPrice: 69.8,
      sellingPrice: 55.8,
      stock: 50,
      badges: ["Trending", "Limited Deal"],
      trending: true,
      variants: [
        { name: "Black Sport Band", sku: "VT-SW-004-BK", color: "Black", stock: 25, mod: 0.0 },
        { name: "Silver Metal Band", sku: "VT-SW-004-SV", color: "Silver", stock: 25, mod: 8.0 },
      ],
    },
    {
      sku: "VT-EB-005",
      name: "Nimbus AirPods Neo",
      brand: "Nimbus Audio",
      category: "audio",
      shortDescription: "True wireless earbuds with adaptive ANC and spatial audio.",
      fullDescription: "Comfortable fit, strong noise cancellation, and clear calls make AirPods Neo a daily driver for commuting and workouts.",
      specs: { ANC: "Adaptive", Battery: "6h buds / 30h case", Drivers: "11mm", IP: "IP54" },
      mainImage: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"],
      originalPrice: 39.8,
      sellingPrice: 29.8,
      stock: 80,
      badges: ["Best Seller", "Hot Deal"],
      best: true,
      trending: true,
      featured: true,
    },
    {
      sku: "VT-HP-006",
      name: "Nimbus Studio Over-Ear",
      brand: "Nimbus Audio",
      category: "audio",
      shortDescription: "Premium over-ear headphones with studio-tuned sound.",
      fullDescription: "Closed-back design for focused listening with plush ear cushions and USB-C charging.",
      specs: { Drivers: "40mm", ANC: "Hybrid", Battery: "40 hours", Connectivity: "BT 5.3 + cable" },
      mainImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
      originalPrice: 69.8,
      sellingPrice: 59.8,
      stock: 40,
      badges: ["Featured"],
      featured: true,
    },
    {
      sku: "VT-GC-007",
      name: "PlayForge Horizon Console",
      brand: "PlayForge",
      category: "gaming",
      shortDescription: "Next-gen gaming console with 4K output and fast load times.",
      fullDescription: "Horizon Console delivers smooth 4K gaming, expanded storage options, and a refined wireless controller.",
      specs: { Resolution: "Up to 4K 60fps", Storage: "1TB SSD", HDR: "Yes", "Ray Tracing": "Supported" },
      mainImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80"],
      originalPrice: 99.8,
      sellingPrice: 99.8,
      stock: 22,
      badges: ["New Arrival", "Trending"],
      newArrival: true,
      trending: true,
      best: true,
    },
    {
      sku: "VT-GA-008",
      name: "PlayForge Pro Controller",
      brand: "PlayForge",
      category: "gaming",
      shortDescription: "Hall-effect sticks, programmable paddles, long battery life.",
      fullDescription: "Competitive-ready controller with low latency wireless and USB-C charging.",
      specs: { Connectivity: "2.4GHz + BT", Battery: "30 hours", Sticks: "Hall effect" },
      mainImage: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80"],
      originalPrice: 35.8,
      sellingPrice: 29.8,
      stock: 60,
      badges: ["Best Seller"],
      best: true,
    },
    {
      sku: "VT-SH-009",
      name: "LumenHome Hub Mini",
      brand: "LumenHome",
      category: "smart-home",
      shortDescription: "Compact smart home hub with Matter and Thread support.",
      fullDescription: "Connect lights, locks, and sensors from one reliable hub designed for US homes.",
      specs: { Protocols: "Matter, Thread, Wi-Fi", Voice: "Assistant ready", Power: "USB-C" },
      mainImage: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80"],
      originalPrice: 25.8,
      sellingPrice: 19.8,
      stock: 70,
      badges: ["Hot Deal", "New Arrival"],
      newArrival: true,
    },
    {
      sku: "VT-CM-010",
      name: "ClearShot Mirrorless Z50",
      brand: "ClearShot",
      category: "cameras",
      shortDescription: "Compact mirrorless camera for travel photography and video.",
      fullDescription: "APS-C sensor, 4K video, and a versatile kit lens option for creators on the move.",
      specs: { Sensor: "APS-C 26MP", Video: "4K30", IBIS: "5-axis", Mount: "Z-Mount" },
      mainImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],
      originalPrice: 239.8,
      sellingPrice: 199.8,
      stock: 15,
      badges: ["Featured"],
      featured: true,
      condition: "NEW",
    },
    {
      sku: "VT-PB-011",
      name: "PowerNest VoltBank 20K",
      brand: "PowerNest",
      category: "chargers-power",
      shortDescription: "20,000mAh power bank with dual USB-C PD fast charging.",
      fullDescription: "Charge phones and laptops on the go with transparent capacity readout and airline-friendly capacity.",
      specs: { Capacity: "20000mAh", Ports: "2x USB-C, 1x USB-A", PD: "65W", Weight: "12.8 oz" },
      mainImage: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80"],
      originalPrice: 15.8,
      sellingPrice: 11.8,
      stock: 120,
      badges: ["Best Seller", "Hot Deal"],
      best: true,
      trending: true,
    },
    {
      sku: "VT-CA-012",
      name: "CircuitOne Pro Mechanical Keyboard",
      brand: "CircuitOne",
      category: "computer-accessories",
      shortDescription: "Hot-swappable mechanical keyboard with RGB and aluminum frame.",
      fullDescription: "Tactile switches, gasket mount feel, and per-key RGB for desk setups that look as good as they type.",
      specs: { Layout: "75%", Switches: "Hot-swappable", Connectivity: "Wired USB-C", Keycaps: "PBT" },
      mainImage: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80"],
      originalPrice: 33.8,
      sellingPrice: 25.8,
      stock: 45,
      badges: ["Trending", "New Arrival"],
      trending: true,
      newArrival: true,
    },
    {
      sku: "VT-PH-013",
      name: "Apextron Pulse X1 (Open Box)",
      brand: "Apextron",
      category: "smartphones",
      shortDescription: "Inspected open-box Pulse X1 with full functionality and accessories.",
      fullDescription:
        "Open-box unit inspected by Voltora. Includes charger and cable. Cosmetic wear may be present. 90-day limited warranty.",
      specs: { Display: "6.7-inch OLED 120Hz", Condition: "Open Box - Excellent", Storage: "128GB" },
      mainImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80"],
      originalPrice: 169.8,
      sellingPrice: 139.8,
      stock: 8,
      badges: ["Limited Deal"],
      condition: "OPEN_BOX",
      delivery: "4–6 business days",
    },
    {
      sku: "VT-CH-014",
      name: "PowerNest GaN Charger 65W",
      brand: "PowerNest",
      category: "chargers-power",
      shortDescription: "Compact GaN wall charger with dual USB-C ports.",
      fullDescription: "Fold-flat prongs and intelligent power distribution for laptop + phone charging.",
      specs: { Output: "65W", Ports: "2x USB-C", Tech: "GaN" },
      mainImage: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80"],
      originalPrice: 9.8,
      sellingPrice: 7.8,
      stock: 90,
      badges: ["Hot Deal"],
    },
    {
      sku: "VT-MS-015",
      name: "CircuitOne Silent Mouse",
      brand: "CircuitOne",
      category: "computer-accessories",
      shortDescription: "Ergonomic wireless mouse with silent clicks and USB-C receiver.",
      fullDescription: "Comfortable shape for long workdays with multi-device pairing.",
      specs: { DPI: "Up to 4000", Battery: "Rechargeable", Connectivity: "2.4GHz + BT" },
      mainImage: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
      images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80"],
      originalPrice: 11.8,
      sellingPrice: 8.8,
      stock: 75,
      badges: ["New Arrival"],
      newArrival: true,
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

  // related products
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
        paymentUrl: "https://example.com/pay/cashapp",
        buttonText: "Continue to Cash App",
        instructions: "Pay the exact order total. Include your Order ID in the payment note. Your order stays Payment Pending until our team confirms payment.",
        isActive: true,
      },
      {
        slot: 2,
        name: "Google Pay",
        iconUrl: "/images/pay-gpay.svg",
        paymentUrl: "https://example.com/pay/googlepay",
        buttonText: "Continue to Google Pay",
        instructions: "Complete payment for the exact amount shown. Do not share passwords or OTPs with anyone. Order status updates after manual confirmation.",
        isActive: true,
      },
      {
        slot: 3,
        name: "Apple Pay",
        iconUrl: "/images/pay-applepay.svg",
        paymentUrl: "https://example.com/pay/applepay",
        buttonText: "Continue to Apple Pay",
        instructions: "Use Apple Pay for the listed amount. Opening this link does not mark your order as paid.",
        isActive: true,
      },
      {
        slot: 4,
        name: "Chime",
        iconUrl: "/images/pay-chime.svg",
        paymentUrl: "https://example.com/pay/chime",
        buttonText: "Continue to Chime",
        instructions: "Send the exact order total and reference your Order ID. Voltora never asks for banking passwords.",
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
        description: "$25 off orders over $200",
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
