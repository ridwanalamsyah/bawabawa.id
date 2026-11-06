/**
 * Bawabawa.id — Default Seed & Fallback Data for Viral Bandung Catalog,
 * 3-Zone Delivery (Bandung Instant, Travel Jawa Barat/Jakarta, Kloter Hub Samarinda),
 * Store Directory, Blog Posts, Payment Info (BCA/Mandiri/QRIS), and 3-Partner Profit Split.
 *
 * All items here mirror migration 024_seed_viral_bandung_and_hub.sql and are
 * 100% editable via Admin (/admin/catalog, /admin/blog, /admin/trips, /admin/settings,
 * /admin/hub-samarinda, /admin/bagi-hasil).
 */

export type DeliveryZoneKey = "bandung_instant" | "jabar_travel" | "samarinda_hub";

export type ZoneRateConfig = {
  id: DeliveryZoneKey;
  badge: string;
  label: string;
  shortLabel: string;
  eta: string;
  cities: string[];
  shuttles?: string[];
  baseShippingRp: number;
  perKgRp: number;
  freeKgIncluded: number;
  jastipFeeRate: number;
  jastipFeeMinRp: number;
  description: string;
  pickupInfo?: string;
};

export type PaymentInfoConfig = {
  bcaNumber: string;
  bcaHolder: string;
  mandiriNumber: string;
  mandiriHolder: string;
  seabankNumber: string;
  seabankHolder: string;
  qrisMerchantName: string;
  qrisNmid: string;
  qrisImageUrl: string;
  whatsappAdmin: string;
  whatsappHubSamarinda: string;
  paymentNote: string;
};

export type LiveShopperStatusConfig = {
  active: boolean;
  headline: string;
  currentLocation: string;
  nextZoneCutoff: string;
  hubSamarindaStatus: string;
};

export type HubSamarindaStockItem = {
  id: string;
  productName: string;
  originStore: string;
  variant: string;
  priceSamarindaRp: number;
  stockQty: number;
  unit: string;
  batchArrivalDate: string;
  status: "ready" | "low" | "sold_out";
};

export type ViralBandungProduct = {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string | null;
  originStore: string;
  storeDistrict: string;
  price: number;
  weightKg: number;
  category: "Bakery & Pastry Viral" | "Kopi & Dessert" | "Camilan & Pedas" | "Frozen & Vacuum" | "Parfum & Fashion" | "Klasik & Bundling";
  variants: string[];
  tripId: string | null;
  shelfLife: "Tahan 1-2 Hari" | "Tahan 3-5 Hari" | "Tahan 1-6 Bulan" | "Wajib Kulkas / Chiller" | "Non-Makanan (Aman Semua Jalur)";
  allowedZones: DeliveryZoneKey[];
  isViralBadge?: string;
  readyAtSamarinda?: boolean;
};

export type ViralBandungStore = {
  id: string;
  name: string;
  district: string;
  category: string;
  signatureItems: string[];
  queueSchedule: string;
  shelfLifeNote: string;
  badge: string;
};

export type ViralBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  publishedAt: string;
  authorName: string;
  bodyMd: string;
};

export const DEFAULT_LIVE_STATUS: LiveShopperStatusConfig = {
  active: true,
  headline: "Tim Belanja Bandung sedang keliling Cihapit, Buah Batu, Jl. Riau & Trunojoyo hari ini!",
  currentLocation: "Roti Macan Buah Batu & Tjilaki 9 Cihapit",
  nextZoneCutoff: "Cut-off Travel Jabar/Jakarta pukul 15.00 WIB · Kloter Hub Samarinda berangkat Jumat",
  hubSamarindaStatus: "Hub Samarinda: Ready Stock Basreng Sultan, In Parfume & Bolen",
};

export const DEFAULT_PAYMENT_INFO: PaymentInfoConfig = {
  bcaNumber: "7772 8891 04",
  bcaHolder: "Bawabawa Jastip Bandung",
  mandiriNumber: "1300 0248 9912 3",
  mandiriHolder: "Bawabawa Jastip Bandung",
  seabankNumber: "9012 8834 7712",
  seabankHolder: "Bawabawa Jastip Bandung",
  qrisMerchantName: "BAWABAWA.ID JASTIP BANDUNG & HUB SAMARINDA",
  qrisNmid: "ID1026384920192",
  qrisImageUrl: "",
  whatsappAdmin: "6281122334455",
  whatsappHubSamarinda: "6281255667788",
  paymentNote: "Transfer sesuai nominal setelah admin konfirmasi ketersediaan stok di toko Bandung. Kirim bukti transfer langsung via tombol WhatsApp.",
};

export const DEFAULT_ZONE_RATES: ZoneRateConfig[] = [
  {
    id: "bandung_instant",
    badge: "🛵 JALUR 1 · BANDUNG RAYA INSTANT",
    label: "Bandung Raya & Sekitarnya (Instant Sameday)",
    shortLabel: "🛵 Bandung Instant",
    eta: "Sampai Hari Ini (2–4 Jam)",
    cities: [
      "Kota Bandung",
      "Cimahi",
      "Lembang",
      "Kab. Bandung (Soreang/Kopo/Bojongsoang)",
      "Bandung Barat (Padalarang)",
      "Jatinangor",
      "Antar ke Hotel / Stasiun Bandung / KCIC Whoosh Tegalluar & Padalarang",
    ],
    shuttles: ["Kurir Instant Bawabawa", "Gosend / GrabExpress Instant", "Drop-off Hotel / Stasiun"],
    baseShippingRp: 18000,
    perKgRp: 5000,
    freeKgIncluded: 3,
    jastipFeeRate: 0.1,
    jastipFeeMinRp: 15000,
    description:
      "Cocok untuk warga Bandung yang malas antre subuh di Roti Macan / Tjilaki 9, atau wisatawan di hotel & stasiun KCIC Whoosh sebelum pulang.",
    pickupInfo: "Diantar langsung ke alamat rumah, kos, lobi hotel, atau stasiun di Bandung Raya.",
  },
  {
    id: "jabar_travel",
    badge: "🚐 JALUR 2 · JAWA BARAT & SEKITAR VIA SHUTTLE TRAVEL",
    label: "Jawa Barat, Jabodetabek & Ciremai via Shuttle Travel",
    shortLabel: "🚐 Jabar & Travel Sameday",
    eta: "Sameday (4–8 Jam via Pool Travel)",
    cities: [
      "Jakarta (Selatan/Pusat/Barat/Timur/Utara)",
      "Bekasi & Cikarang",
      "Depok & Cibubur",
      "Bogor",
      "Tangerang & BSD",
      "Garut",
      "Tasikmalaya",
      "Sumedang",
      "Purwakarta",
      "Subang",
      "Karawang",
      "Cianjur",
      "Sukabumi",
      "Cirebon & Indramayu",
      "Majalengka & Kuningan",
    ],
    shuttles: [
      "Cititrans (Jakarta, BSD, Depok, Bekasi)",
      "DayTrans (Jakarta, Bogor, Bekasi, Ciawi)",
      "Arnes Shuttle (Sumedang, Purwakarta, Karawang, Subang, Indramayu)",
      "Pasteur Trans & Jackal Holidays (Jabodetabek)",
      "Bhinneka Shuttle (Cirebon, Majalengka, Kuningan)",
      "Primajasa / Budiman Pool-to-Pool (Garut, Tasikmalaya, Ciamis)",
      "Siliwangi Trans (Cianjur, Sukabumi)",
    ],
    baseShippingRp: 35000,
    perKgRp: 10000,
    freeKgIncluded: 2,
    jastipFeeRate: 0.1,
    jastipFeeMinRp: 20000,
    description:
      "Dikirim di hari yang sama lewat bagasi Shuttle Travel resmi dari Bandung. Roti hangat pagi dari Bandung sudah sampai sore/malam di kota kamu!",
    pickupInfo: "Ambil di Pool Travel terdekat di kotamu atau diteruskan kurir ojek lokal dari pool ke rumah.",
  },
  {
    id: "samarinda_hub",
    badge: "✈️ JALUR 3 · SAMARINDA & KALTIM VIA HUB SAMARINDA",
    label: "Samarinda, Balikpapan & Kaltim via Kloter & Hub Samarinda",
    shortLabel: "✈️ Hub Samarinda & Kaltim",
    eta: "Kloter Udara 1–2 Hari Tiba di Hub Samarinda",
    cities: [
      "Samarinda Kota (Pickup di Hub Samarinda — Gratis Ongkir Lokal)",
      "Samarinda Ulu / Ilir / Sungai Kunjang / Samarinda Seberang",
      "Tenggarong (Kutai Kartanegara)",
      "Balikpapan",
      "Bontang",
      "Sangatta",
    ],
    shuttles: [
      "Pickup Point Hub Bawabawa Samarinda (Dikelola Partner Samarinda)",
      "Kurir Lokal Hub Samarinda (Antar ke Rumah/Kantor)",
      "Travel Samarinda–Balikpapan / Tenggarong / Bontang",
    ],
    baseShippingRp: 45000,
    perKgRp: 38000,
    freeKgIncluded: 1,
    jastipFeeRate: 0.12,
    jastipFeeMinRp: 25000,
    description:
      "Dikirim via Kloter Kargo Udara/Handcarry Bandung → Hub Bawabawa Samarinda. Dicek ulang oleh Partner Hub Samarinda kami sebelum diambil atau diantar ke rumahmu.",
    pickupInfo: "Bisa ambil langsung di Hub Bawabawa Samarinda (hemat ongkir kurir lokal) atau diantar kurir Samarinda.",
  },
];

export const DEFAULT_HUB_SAMARINDA_STOCK: HubSamarindaStockItem[] = [
  {
    id: "hub-stock-1",
    productName: "Basreng Sultan Daun Jeruk (500gr)",
    originStore: "Basreng Sultan Bandung",
    variant: "Pedas Daun Jeruk",
    priceSamarindaRp: 68000,
    stockQty: 14,
    unit: "pouch",
    batchArrivalDate: "Kloter Minggu Ini",
    status: "ready",
  },
  {
    id: "hub-stock-2",
    productName: "In Parfume Fragrance Bandung (35ml Extrait)",
    originStore: "In Parfume Banceuy Bandung",
    variant: "Best Seller Baccarat / Black Opium / Sauvage",
    priceSamarindaRp: 98000,
    stockQty: 9,
    unit: "botol",
    batchArrivalDate: "Kloter Minggu Ini",
    status: "ready",
  },
  {
    id: "hub-stock-3",
    productName: "Keripik Pedas Mang Odod & Seblak Kering",
    originStore: "Mang Odod Bandung",
    variant: "Level 3 Daun Jeruk",
    priceSamarindaRp: 48000,
    stockQty: 11,
    unit: "pouch",
    batchArrivalDate: "Kloter Minggu Ini",
    status: "ready",
  },
  {
    id: "hub-stock-4",
    productName: "Pisang Bolen Kartika Sari / Prima Rasa (Fresh Kloter)",
    originStore: "Prima Rasa Kemuning Bandung",
    variant: "Bolen Pisang Keju Besar",
    priceSamarindaRp: 95000,
    stockQty: 4,
    unit: "box",
    batchArrivalDate: "Baru Mendarat",
    status: "low",
  },
];

export const VIRAL_BANDUNG_STORES: ViralBandungStore[] = [
  {
    id: "store-roti-macan",
    name: "Roti Macan Bandung",
    district: "Jl. Buah Batu / Lengkong",
    category: "Bakery & Sourdough Viral",
    signatureItems: ["Cranberry Cheese Sourdough", "Double Chocolate", "Bundling 4 Rasa"],
    queueSchedule: "War antrean batch 08.00 & 13.00 WIB (Kuota dibatasi/orang)",
    shelfLifeNote: "Tahan 3-4 hari suhu ruang, 7 hari chiller",
    badge: "🔥 Paling Dicari 2025/2026",
  },
  {
    id: "store-tjilaki-9",
    name: "Tjilaki 9 (Bolu Pisang)",
    district: "Jl. Cilaki No. 9, Cihapit",
    category: "Artisan Banana Cake",
    signatureItems: ["Bolu Pisang Cokelat Keju", "Bolu Pisang Cinnamon", "Loaf Spesial"],
    queueSchedule: "Restock pagi 09.00 & siang 14.00 WIB",
    shelfLifeNote: "Tahan 3-4 hari suhu ruang, packaging kaleng/box estetik",
    badge: "🍌 Hits Cihapit",
  },
  {
    id: "store-roti-merak",
    name: "Roti Merak",
    district: "Jl. Sadang Serang / Cikutra",
    category: "Roti Sobek & Sisir Klasik",
    signatureItems: ["Roti Sobek Butter Meses", "Roti Sisir Keju Spesial", "Srikaya Pandan"],
    queueSchedule: "Fresh keluar oven setiap pagi 07.30 WIB",
    shelfLifeNote: "Tahan 3 hari suhu ruang",
    badge: "🦚 Favorit Keluarga",
  },
  {
    id: "store-rochi",
    name: "Rochi (Roti Mochi)",
    district: "Jl. LLRE Martadinata (Riau) No. 61",
    category: "Japanese Mochi Bun",
    signatureItems: ["Rochi Choco Crunchy", "Rochi Matcha Ogura", "Rochi Taro Cheese"],
    queueSchedule: "Ready mulai 10.00 WIB",
    shelfLifeNote: "Tahan 2-3 hari suhu ruang",
    badge: "🍡 Chewy Viral",
  },
  {
    id: "store-studio-bolen",
    name: "Studio Bolen",
    district: "Jl. Trunojoyo, Dago",
    category: "Artisan Pastry & Bolen",
    signatureItems: ["Bolen Pisang Cokelat Lumer", "Bolen Durian", "Cheese Roll"],
    queueSchedule: "Batch panggang 09.30 & 15.00 WIB",
    shelfLifeNote: "Tahan 4 hari suhu ruang (Aman ke Samarinda)",
    badge: "🥐 Generasi Baru Bolen",
  },
  {
    id: "store-seroja-bake",
    name: "Seroja Bake",
    district: "Pasar Cihapit, Bandung",
    category: "Local Ingredient Bakehouse",
    signatureItems: ["Pavlova Buah Lokal", "Tart Singkong Keju", "Focaccia Rempah"],
    queueSchedule: "Buka 08.00 WIB (Sering sold out siang)",
    shelfLifeNote: "Khusus Jalur Bandung Instant & Travel Sameday",
    badge: "🌿 Artisanal Cihapit",
  },
  {
    id: "store-sapporo-puln-warisan",
    name: "Sapporo Soes, Puln & Kue Warisan",
    district: "Pusat Kota Bandung",
    category: "Pastry, Soes & Marmer Cake",
    signatureItems: ["Sapporo Soes Cream", "Puln Shio Pan", "Kue Marmer Warisan Wijsman"],
    queueSchedule: "Belanja setiap pagi pukul 09.00 WIB",
    shelfLifeNote: "Soes (Sameday/Chiller) · Marmer Warisan (Tahan 5 hari)",
    badge: "🧈 Butter Wijsman",
  },
  {
    id: "store-makjay",
    name: "Kopi Susu Makmur Jaya (Makjay)",
    district: "Jl. Lengkong Besar / Dago",
    category: "Kopi Susu Botol 1 Liter",
    signatureItems: ["Es Kopi Susu Makjay 1 Liter", "Makjay Butterscotch 1L", "Botol 250ml"],
    queueSchedule: "Ready setiap hari (Dikirim pakai Ice Gel Pack)",
    shelfLifeNote: "Wajib Chiller (Bandung Instant & Travel Sameday)",
    badge: "☕ Kopi No.1 Bandung",
  },
  {
    id: "store-inparfume-fashion",
    name: "In Parfume, Exsport & Distro Braga",
    district: "Jl. Banceuy, Tamblong & Braga",
    category: "Parfum, Tas & Apparel",
    signatureItems: ["In Parfume Extrait 35ml/60ml", "Tas Exsport Space", "Kaos Tahilalats Braga"],
    queueSchedule: "Belanja setiap hari Senin–Minggu",
    shelfLifeNote: "Non-Makanan (Aman dikirim ke seluruh Indonesia)",
    badge: "✨ Non-Kuliner Hits",
  },
];

export const VIRAL_BANDUNG_CATALOG: ViralBandungProduct[] = [
  {
    id: "prod-roti-macan-satuan",
    sku: "BDG-RMACAN-01",
    name: "Roti Macan Bandung — Cranberry Cheese / Double Choco",
    description:
      "Roti sourdough lembut dengan isian cream cheese & cranberry melimpah yang antreannya paling viral di Bandung. Kami antrekan dari pagi di Buah Batu.",
    imageUrl: null,
    originStore: "Roti Macan Buah Batu",
    storeDistrict: "Buah Batu",
    price: 42000,
    weightKg: 0.45,
    category: "Bakery & Pastry Viral",
    variants: ["Cranberry Cheese (Best Seller)", "Double Chocolate", "Cinnamon Roll", "Garlic Cheese"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🔥 No.1 Antrean Bandung",
  },
  {
    id: "prod-roti-macan-bundling",
    sku: "BDG-RMACAN-04",
    name: "Paket Bundling 4 Box Roti Macan Bandung (Bebas Pilih Rasa)",
    description:
      "Paket puas 4 box Roti Macan Bandung tanpa perlu ikut war kuota. Cocok untuk patungan kantor di Jakarta/Jabar atau stok keluarga di Samarinda.",
    imageUrl: null,
    originStore: "Roti Macan Buah Batu",
    storeDistrict: "Buah Batu",
    price: 162000,
    weightKg: 1.6,
    category: "Klasik & Bundling",
    variants: ["Mix 4 Rasa Favorit", "2 Cranberry Cheese + 2 Double Choco"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "📦 Paket Hemat",
  },
  {
    id: "prod-bolu-pisang-tjilaki",
    sku: "BDG-TJILAKI-01",
    name: "Bolu Pisang Tjilaki 9 Cihapit — Box Spesial",
    description:
      "Bolu pisang artisan paling hits di kawasan Cihapit Bandung. Tekstur moist, wangi pisang asli & butter premium dengan kemasan estetik.",
    imageUrl: null,
    originStore: "Tjilaki 9 Cihapit",
    storeDistrict: "Cihapit",
    price: 85000,
    weightKg: 0.65,
    category: "Bakery & Pastry Viral",
    variants: ["Original Banana Loaf", "Choco Melt Banana", "Cheese Streusel", "Cinnamon Walnut"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🍌 Viral Cihapit",
  },
  {
    id: "prod-roti-merak",
    sku: "BDG-RMERAK-01",
    name: "Roti Merak Bandung — Roti Sobek & Sisir Butter",
    description:
      "Roti klasik Bandung dengan serat super lembut dan olesan butter melimpah. Selalu ludes sejak pagi di Sadang Serang.",
    imageUrl: null,
    originStore: "Roti Merak Sadang Serang",
    storeDistrict: "Sadang Serang",
    price: 48000,
    weightKg: 0.5,
    category: "Bakery & Pastry Viral",
    variants: ["Sobek Butter Meses Keju", "Roti Sisir Butter Spesial", "Sobek Srikaya Pandan", "Sobek Cokelat Lumer"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🦚 Fresh Pagi",
  },
  {
    id: "prod-rochi-mochi",
    sku: "BDG-ROCHI-01",
    name: "Rochi (Roti Mochi) Jl. Riau 61 — Box Isi 6",
    description:
      "Perpaduan roti lembut dengan isian mochi kenyal lumer di tengahnya. Oleh-oleh kekinian paling dicari di Jl. Riau Bandung.",
    imageUrl: null,
    originStore: "Rochi Jl. Riau 61",
    storeDistrict: "Jl. Riau",
    price: 68000,
    weightKg: 0.5,
    category: "Bakery & Pastry Viral",
    variants: ["Mix 6 Rasa Best Seller", "Choco Crunchy Mochi", "Matcha Ogura Mochi", "Cheese Milky Mochi"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🍡 Mochi Bun",
  },
  {
    id: "prod-studio-bolen",
    sku: "BDG-SBOLEN-01",
    name: "Studio Bolen Bandung — Artisan Pastry Bolen",
    description:
      "Generasi baru pisang bolen Bandung dengan kulit pastry super flaky berlapis-lapis, tidak bikin eneg, dan pisang raja matang sempurna.",
    imageUrl: null,
    originStore: "Studio Bolen Trunojoyo",
    storeDistrict: "Trunojoyo / Dago",
    price: 78000,
    weightKg: 0.65,
    category: "Bakery & Pastry Viral",
    variants: ["Pisang Cokelat Keju", "Full Keju Spesial", "Bolen Durian Musang", "Nutella Banana"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🥐 Pastry Hits",
  },
  {
    id: "prod-seroja-bake",
    sku: "BDG-SEROJA-01",
    name: "Seroja Bake Pasar Cihapit — Artisan Tart & Pastry Lokal",
    description:
      "Bakehouse lokal favorit anak skena Cihapit Bandung dengan bahan nusantara terpilih. Cocok untuk pengiriman Bandung Instant & Travel Sameday.",
    imageUrl: null,
    originStore: "Seroja Bake Cihapit",
    storeDistrict: "Pasar Cihapit",
    price: 62000,
    weightKg: 0.4,
    category: "Bakery & Pastry Viral",
    variants: ["Tart Singkong Keju", "Focaccia Kecombrang", "Brownies Teh Jawa", "Cookies Gula Aren"],
    tripId: null,
    shelfLife: "Tahan 1-2 Hari",
    allowedZones: ["bandung_instant", "jabar_travel"],
    isViralBadge: "🌿 Artisanal",
  },
  {
    id: "prod-sapporo-soes",
    sku: "BDG-SAPPORO-01",
    name: "Sapporo Soes Bandung — Box Isi 8 Japanese Cream Puff",
    description:
      "Kue soes Jepang dengan kulit renyah dan vla diplomat cream dingin yang melimpah. Dikirim menggunakan thermal bag + ice gel.",
    imageUrl: null,
    originStore: "Sapporo Soes Bandung",
    storeDistrict: "Bandung Kota",
    price: 64000,
    weightKg: 0.55,
    category: "Kopi & Dessert",
    variants: ["Mix Vanilla & Belgian Choco", "Full Vanilla Custard", "Matcha & Tiramisu"],
    tripId: null,
    shelfLife: "Wajib Kulkas / Chiller",
    allowedZones: ["bandung_instant", "jabar_travel"],
    isViralBadge: "❄️ Wajib Dingin",
  },
  {
    id: "prod-puln-bakehouse",
    sku: "BDG-PULN-01",
    name: "Puln Bakehouse Bandung — Shio Pan & Butter Brioche",
    description:
      "Japanese salt bread (Shio Pan) garing di luar, lembut berongga butter di dalam dari Puln Bandung.",
    imageUrl: null,
    originStore: "Puln Bakehouse Bandung",
    storeDistrict: "Dago / Riau",
    price: 58000,
    weightKg: 0.4,
    category: "Bakery & Pastry Viral",
    variants: ["Paket 4 Original Shio Pan", "Truffle Egg Shio Pan", "Garlic Cream Brioche"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🥖 Salt Bread",
  },
  {
    id: "prod-kue-warisan",
    sku: "BDG-WARISAN-01",
    name: "Kue Marmer Warisan Bandung — Full Wijsman Butter",
    description:
      "Bolu marmer jadul premium khas Bandung dengan wangi butter Wijsman asli yang padat, lembut, dan tahan kirim luar pulau.",
    imageUrl: null,
    originStore: "Kue Warisan Bandung",
    storeDistrict: "Bandung Kota",
    price: 115000,
    weightKg: 0.75,
    category: "Bakery & Pastry Viral",
    variants: ["Marmer Klasik Wijsman", "Pandan KejuJadul", "Speculaas Almond"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🧈 Full Wijsman",
  },
  {
    id: "prod-kopi-makjay",
    sku: "BDG-MAKJAY-1L",
    name: "Kopi Susu Makmur Jaya ('Makjay') — Botol 1 Liter",
    description:
      "Es kopi susu creamy legendaris anak Bandung dari Kedai Makmur Jaya. Dikirim lengkap dengan ice gel pack agar tetap segar sampai rumah.",
    imageUrl: null,
    originStore: "Kedai Kopi Makmur Jaya (Makjay)",
    storeDistrict: "Lengkong Besar / Dago",
    price: 92000,
    weightKg: 1.15,
    category: "Kopi & Dessert",
    variants: ["Kopi Susu Makjay 1 Liter", "Butterscotch Sea Salt 1 Liter", "Paket 4 Botol @250ml"],
    tripId: null,
    shelfLife: "Wajib Kulkas / Chiller",
    allowedZones: ["bandung_instant", "jabar_travel"],
    isViralBadge: "☕ Kopi Viral",
  },
  {
    id: "prod-tiramisusu",
    sku: "BDG-TIRAMISUSU-01",
    name: "Tiramisusu by Chocomory Bandung — Dessert Box Lumer",
    description:
      "6 lapisan kebahagiaan tiramisu cake dan milk crumble lumer khas Bandung. Packing aman dengan ice gel.",
    imageUrl: null,
    originStore: "Tiramisusu Jl. Anggrek Bandung",
    storeDistrict: "Jl. Riau / Anggrek",
    price: 88000,
    weightKg: 0.6,
    category: "Kopi & Dessert",
    variants: ["Original Tiramisusu", "Cookies & Cream"],
    tripId: null,
    shelfLife: "Wajib Kulkas / Chiller",
    allowedZones: ["bandung_instant", "jabar_travel"],
  },
  {
    id: "prod-basreng-sultan",
    sku: "BDG-BASRENG-01",
    name: "Basreng Sultan Bandung Daun Jeruk (500gr — Renyah No Atos)",
    description:
      "Basreng ikan tenggiri asli Bandung yang diiris tipis renyah (dijamin tidak keras/atos!) dengan taburan bumbu cabai asli dan daun jeruk wangi.",
    imageUrl: null,
    originStore: "Basreng Sultan Bandung",
    storeDistrict: "Kopo / Buah Batu",
    price: 55000,
    weightKg: 0.55,
    category: "Camilan & Pedas",
    variants: ["Pedas Daun Jeruk (Best Seller)", "Original Gurih Daun Jeruk", "Extra Pedas Cikruh"],
    tripId: null,
    shelfLife: "Tahan 1-6 Bulan",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🌶️ Ready di Hub Samarinda",
    readyAtSamarinda: true,
  },
  {
    id: "prod-keripik-mang-odod",
    sku: "BDG-ODOD-01",
    name: "Keripik Singkong Pedas Mang Odod & Seblak Kering Rafael",
    description:
      "Paket camilan pedas gurih khas Bandung yang bikin nagih. Tahan lama dan aman untuk dikirim ke seluruh jalur.",
    imageUrl: null,
    originStore: "Camilan Pedas Bandung",
    storeDistrict: "Bandung Kota",
    price: 42000,
    weightKg: 0.45,
    category: "Camilan & Pedas",
    variants: ["Keripik Mang Odod Pedas Jeruk", "Kerupuk Seblak Kencur Rafael", "Gurilem Cililin Pedas"],
    tripId: null,
    shelfLife: "Tahan 1-6 Bulan",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    readyAtSamarinda: true,
  },
  {
    id: "prod-batagor-kingsley",
    sku: "BDG-KINGSLEY-01",
    name: "Batagor Kingsley / Riri / Cuplis Vacuum Pack (Isi 10 Pcs)",
    description:
      "Batagor ikan tenggiri legendaris Bandung kemasan vakum higienis lengkap dengan bumbu kacang kental, kecap, dan jeruk limau.",
    imageUrl: null,
    originStore: "Batagor Kingsley Jl. Veteran Bandung",
    storeDistrict: "Veteran / Burangrang",
    price: 125000,
    weightKg: 0.85,
    category: "Frozen & Vacuum",
    variants: ["5 Siomay + 5 Tahu Batagor", "Full 10 Siomay Goreng", "Batagor Riri Vacuum Pack"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🥟 Vacuum Aman",
  },
  {
    id: "prod-in-parfume",
    sku: "BDG-INPARFUME-01",
    name: "In Parfume Fragrance Bandung — Extrait de Parfum (35ml / 60ml)",
    description:
      "Parfum racikan paling legendaris di Jl. Banceuy & Tamblong Bandung yang antreannya mengular! Wangi tahan 12-24 jam, bebas request ratusan aroma designer/niche.",
    imageUrl: null,
    originStore: "In Parfume Banceuy / Tamblong Bandung",
    storeDistrict: "Banceuy / Braga",
    price: 85000,
    weightKg: 0.25,
    category: "Parfum & Fashion",
    variants: [
      "35ml Extrait (Tulis Aroma di Catatan)",
      "60ml Extrait (+Rp45.000)",
      "100ml Extrait (+Rp90.000)",
    ],
    tripId: null,
    shelfLife: "Non-Makanan (Aman Semua Jalur)",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "✨ Ready di Hub Samarinda",
    readyAtSamarinda: true,
  },
  {
    id: "prod-tas-exsport-torch",
    sku: "BDG-EXSPORT-01",
    name: "Tas Exsport Space / Torch Bandung — Store Exclusive",
    description:
      "Koleksi tas kasual, sling bag, dan backpack warna pastel dari flagship store Exsport & Torch Bandung lengkap dengan charm lucu.",
    imageUrl: null,
    originStore: "Exsport Space / Torch Bandung",
    storeDistrict: "Dago / Bahureksa",
    price: 279000,
    weightKg: 0.5,
    category: "Parfum & Fashion",
    variants: ["RR01 Everyday Backpack", "Playmaker Sling Bag Pastel", "Torch Foldable Travel Bag"],
    tripId: null,
    shelfLife: "Non-Makanan (Aman Semua Jalur)",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
  },
  {
    id: "prod-apparel-distro-braga",
    sku: "BDG-BRAGA-01",
    name: "Apparel Distro Bandung & Merchandise Tahilalats Braga",
    description:
      "Titip kaos edisi terbatas dari Toko Tahilalats Braga, Maternal Disaster, Screamous, atau Bloods Flagship Store Bandung.",
    imageUrl: null,
    originStore: "Jl. Braga & Trunojoyo Bandung",
    storeDistrict: "Braga / Trunojoyo",
    price: 189000,
    weightKg: 0.35,
    category: "Parfum & Fashion",
    variants: ["Size M", "Size L", "Size XL"],
    tripId: null,
    shelfLife: "Non-Makanan (Aman Semua Jalur)",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
  },
  {
    id: "prod-prima-rasa-kartika",
    sku: "BDG-PRIMARASA-01",
    name: "Prima Rasa & Kartika Sari — Brownies Panggang & Pisang Bolen",
    description:
      "Oleh-oleh wajib Bandung yang tidak pernah salah! Diambil fresh pagi hari dari outlet pusat Kemuning / Kebon Kawung.",
    imageUrl: null,
    originStore: "Prima Rasa Kemuning / Kartika Sari",
    storeDistrict: "Kemuning / Kebon Kawung",
    price: 82000,
    weightKg: 0.7,
    category: "Klasik & Bundling",
    variants: ["Bolen Pisang Keju Besar", "Bolen Pisang Cokelat Besar", "Brownies Panggang Prima Rasa", "Bagelen Butter Spesial"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    readyAtSamarinda: true,
  },
  {
    id: "prod-paket-kangen-bandung",
    sku: "BDG-BUNDLING-ALL",
    name: "Paket Hampers 'Kangen Bandung' (Roti Macan + Tjilaki 9 + Basreng)",
    description:
      "1 Paket lengkap berisi 1 Box Roti Macan Cranberry Cheese + 1 Box Bolu Pisang Tjilaki 9 + 1 Pouch Basreng Sultan Daun Jeruk + Kartu Ucapan.",
    imageUrl: null,
    originStore: "Kurasi Tim Bawabawa Bandung",
    storeDistrict: "Multi-Toko Bandung",
    price: 175000,
    weightKg: 1.5,
    category: "Klasik & Bundling",
    variants: ["Paket Komplit Kangen Bandung", "Paket Hampers Hadiah (+Pita & Kartu)"],
    tripId: null,
    shelfLife: "Tahan 3-5 Hari",
    allowedZones: ["bandung_instant", "jabar_travel", "samarinda_hub"],
    isViralBadge: "🎁 Best Value",
  },
];

export const VIRAL_BANDUNG_BLOGS: ViralBlogPost[] = [
  {
    slug: "daftar-kuliner-roti-viral-bandung-2026-roti-macan-tjilaki-rochi",
    title: "10 Kuliner & Roti Viral Bandung 2026: Dari Roti Macan, Tjilaki 9, Roti Merak hingga Rochi!",
    excerpt:
      "Bosan oleh-oleh Bandung yang itu-itu saja? Ini daftar lengkap bakery, kopi Makjay, dan jajanan Bandung yang antreannya paling mengular tahun ini beserta cara titipnya tanpa antre.",
    category: "Kuliner Viral Bandung",
    readingMinutes: 5,
    publishedAt: "2026-03-15T08:00:00Z",
    authorName: "Tim Shopper Bawabawa Bandung",
    bodyMd: `## Bandung Tidak Pernah Kehabisan Kuliner Viral!

Kalau dulu orang ke Bandung hanya mencari bolen klasik, sekarang peta kuliner Bandung sudah berubah total. Setiap pagi dari kawasan **Pasar Cihapit**, **Buah Batu**, **Jl. Riau**, sampai **Trunojoyo**, antrean anak muda dan wisatawan mengular demi mendapatkan roti *fresh from the oven*.

Berikut 10 kuliner & barang viral Bandung yang paling banyak dititipkan lewat **Bawabawa.id**:

### 1. Roti Macan Bandung (Buah Batu)
Roti *sourdough* bertekstur super lembut dengan isian *Cranberry Cream Cheese* dan *Double Chocolate* yang lumer. Karena sistem *war* antrean pagi dan kuota beli per orang dibatasi, banyak pelanggan Bandung, Jakarta, hingga Samarinda menitip lewat tim shopper Bawabawa.

### 2. Bolu Pisang Tjilaki 9 (Cihapit)
Terletak di Jl. Cilaki No. 9 dekat kawasan Cihapit, bolu pisang *artisan* ini punya aroma pisang raja dan *butter* yang khas, dikemas dalam box/kaleng retro yang sangat cocok untuk hadiah.

### 3. Roti Merak (Sadang Serang) & Rochi Roti Mochi (Jl. Riau 61)
* **Roti Merak** terkenal dengan roti sobek dan roti sisir *butter* meses keju yang super lembut.
* **Rochi (Jl. Riau 61)** memadukan roti panggang empuk dengan mochi kenyal di dalamnya.

### 4. Studio Bolen, Seroja Bake, Puln & Kue Warisan
* **Studio Bolen (Trunojoyo):** Kulit pastry renyah berlapis dengan pisang manis legit.
* **Seroja Bake (Pasar Cihapit):** Kue & tart berbahan lokal nusantara yang selalu *sold out* siang hari.
* **Puln Bakehouse:** *Shio Pan* (Japanese Salt Bread) yang garing di luar, *buttery* di dalam.
* **Kue Marmer Warisan:** Bolu marmer jadul *full Wijsman butter* yang awet dikirim sampai Kalimantan.

### 5. Kopi Susu Makmur Jaya ("Makjay") 1 Liter & Sapporo Soes
Untuk wilayah **Bandung Raya Instant** dan **Travel Sameday Jawa Barat/Jakarta**, kamu bisa titip **Kopi Makjay 1 Liter** dan **Sapporo Soes** yang kami kirim menggunakan *thermal pouch* + *ice gel*!`,
  },
  {
    slug: "cara-kerja-3-jalur-pengiriman-bawabawa-bandung-jabar-samarinda",
    title: "3 Jalur Pengiriman Bawabawa.id: Bandung Instant, Shuttle Travel Jawa Barat, & Hub Samarinda",
    excerpt:
      "Tinggal di Bandung tapi malas antre? Di Jakarta/Jawa Barat butuh sampai hari ini via Travel? Atau di Samarinda mau ambil di Hub lokal? Kenali 3 jalur pengiriman kami.",
    category: "Panduan Jastip",
    readingMinutes: 4,
    publishedAt: "2026-03-18T08:00:00Z",
    authorName: "Tim Operasional Bawabawa",
    bodyMd: `## Satu Pusat Belanja di Bandung, Tiga Jalur Pengiriman Cepat

Banyak yang bertanya: *"Apakah Bawabawa.id hanya untuk pengiriman ke Samarinda?"*
Jawabannya: **Tidak!** Sekarang Bawabawa.id melayani **3 Jalur Pengiriman** yang semuanya berpusat dari tim belanja kami di Bandung:

### 🛵 Jalur 1 — Bandung Raya Instant (Sampai Hari Ini)
Cocok untuk warga Bandung, Cimahi, Lembang, Jatinangor, atau wisatawan yang menginap di hotel Bandung / mau naik **KCIC Whoosh**. Tim kami yang antre subuh di toko, lalu kurir langsung mengantar ke rumah, kos, lobi hotel, atau stasiun di hari yang sama.

### 🚐 Jalur 2 — Jawa Barat & Jabodetabek via Shuttle Travel (Sameday 4–8 Jam)
Untuk kamu yang tinggal di **Jakarta, Bekasi, Depok, Bogor, Tangerang, Garut, Tasikmalaya, Sumedang, Purwakarta, Subang, Karawang, Cianjur, Sukabumi, hingga Cirebon & Majalengka**, kami kirim lewat bagasi *Shuttle Travel* resmi (*Cititrans, DayTrans, Arnes, Pasteur Trans, Bhinneka*).
* Roti dibeli pagi di Bandung → Siang masuk travel → Sore/Malam sudah bisa kamu ambil atau diantar ke rumah!

### ✈️ Jalur 3 — Samarinda & Kalimantan Timur via Hub Bawabawa Samarinda
Khusus pelanggan di **Samarinda, Balikpapan, dan Tenggarong**, paket dikirim dalam Kloter Kargo Udara/Handcarry langsung menuju **Hub Bawabawa Samarinda** yang dikelola oleh Partner resmi kami di Samarinda. Kamu bisa ambil langsung di Hub Samarinda (hemat ongkir lokal!) atau diantar kurir Samarinda.`,
  },
  {
    slug: "tips-titip-roti-dan-makanan-bandung-ke-luar-kota-dan-samarinda",
    title: "Tips Aman Titip Roti, Frozen Food & Kopi Bandung ke Luar Kota agar Tetap Fresh",
    excerpt:
      "Mana makanan Bandung yang aman dikirim ke Samarinda, dan mana yang khusus jalur Travel Jawa Barat? Simak panduan ketahanan produk dan standar packing Bawabawa.id.",
    category: "Tips & Packing",
    readingMinutes: 4,
    publishedAt: "2026-03-20T08:00:00Z",
    authorName: "Tim QC & Packing Bawabawa",
    bodyMd: `## Cara Kami Menjaga Makanan Bandung Tetap Segar Sampai Tujuan

Setiap makanan viral Bandung punya daya tahan (*shelf life*) yang berbeda. Agar kamu tidak kecewa saat paket tiba, tim Bawabawa menerapkan aturan kurasi berikut:

1. **Aman Semua Jalur (Termasuk Kloter Samarinda & Kaltim):**
   * **Roti Macan, Bolu Pisang Tjilaki 9, Roti Merak, Studio Bolen, Kue Marmer Warisan, Prima Rasa** (dibeli *fresh* pagi hari di hari keberangkatan kloter, tahan 3–5 hari suhu ruang).
   * **Batagor Kingsley / Riri Vacuum Pack** (dikemas vakum kedap udara + *ice gel*).
   * **Basreng Sultan Daun Jeruk & Keripik Mang Odod** (tahan hingga 3 bulan).
   * **In Parfume Bandung, Tas Exsport/Torch, Apparel Braga** (aman 100%).

2. **Khusus Jalur Bandung Instant & Shuttle Travel Jawa Barat/Jakarta (Sameday):**
   * **Kopi Susu Makmur Jaya ("Makjay") 1 Liter**
   * **Sapporo Soes & Seroja Bake**
   * **Tiramisusu by Chocomory**
   Karena wajib dingin dan harus tiba di hari yang sama (maksimal 6–8 jam perjalanan darat menggunakan *insulated thermal bag* + *ice gel*).`,
  },
  {
    slug: "in-parfume-bandung-dan-brand-fashion-lokal-paling-dicari",
    title: "Bukan Cuma Makanan! Ini Rekomendasi Jastip In Parfume Bandung, Exsport & Distro Braga",
    excerpt:
      "Antrean In Parfume Banceuy selalu penuh berjam-jam! Simak daftar aroma best seller In Parfume dan barang fashion Bandung yang paling sering dititip.",
    category: "Fashion & Lifestyle",
    readingMinutes: 4,
    publishedAt: "2026-03-22T08:00:00Z",
    authorName: "Tim Shopper Bawabawa Bandung",
    bodyMd: `## Jastip Non-Kuliner Bandung yang Paling Hits

Selain kuliner Cihapit dan Buah Batu, 30% pesanan Bawabawa.id berasal dari produk parfum dan fashion lokal Bandung yang hanya tersedia atau lebih lengkap di *flagship store* Bandung:

### 1. In Parfume Fragrance (Jl. Banceuy & Tamblong)
Siapa yang tidak kenal **In Parfume Bandung**? Kalau datang langsung di akhir pekan, antreannya bisa mencapai 1–2 jam. Lewat Bawabawa.id (bahkan tersedia *Ready Stock* aroma favorit di **Hub Samarinda**!), kamu tinggal sebutkan aroma favoritmu dalam ukuran 35ml, 60ml, atau 100ml *Extrait de Parfum*.

### 2. Exsport Space & Torch Bandung
Koleksi tas *sling bag* dan *backpack* warna pastel dari Exsport Space Bandung sering memiliki edisi dan *bag charm* eksklusif toko offline.

### 3. Merchandise Tahilalats Braga & Distro Trunojoyo
Mulai dari kaos kolaborasi di Toko Tahilalats Braga hingga rilisan terbatas di Jl. Trunojoyo & Sultan Agung bisa kamu titip kapan saja.`,
  },
  {
    slug: "mengenal-hub-bawabawa-samarinda-pickup-point-dan-ready-stock",
    title: "Mengenal Hub Bawabawa Samarinda: Pickup Point, Ready Stock & Pengiriman Se-Kaltim",
    excerpt:
      "Warga Samarinda, Balikpapan, dan Tenggarong kini lebih tenang! Semua barang kloter Bandung dicek di Hub Samarinda dan tersedia juga stok langsung tanpa PO.",
    category: "Hub Samarinda",
    readingMinutes: 3,
    publishedAt: "2026-03-25T08:00:00Z",
    authorName: "Partner Hub Bawabawa Samarinda",
    bodyMd: `## Kenapa Belanja Bandung ke Kaltim Lebih Aman Lewat Hub Samarinda?

Berbeda dengan ekspedisi biasa yang melempar paket berkali-kali di gudang transit, Bawabawa.id dijalankan bersama **Partner Hub Resmi kami di Samarinda**:

1. **Konsolidasi Kloter Lebih Hemat:** Barang dari berbagai toko di Bandung (misal kamu pesan Roti Macan + Bolu Tjilaki 9 + In Parfume sekaligus) dikumpulkan dalam satu paket kloter.
2. **Quality Control di Samarinda:** Saat kloter mendarat, Partner Hub Samarinda kami mengecek kondisi setiap box sebelum diserahkan ke pembeli.
3. **Bisa Ambil Sendiri (Pickup) atau Kurir Lokal:** Mau hemat ongkir dalam kota? Ambil langsung di Pickup Point Hub Samarinda, atau minta diantar kurir lokal ke rumah/kantor.
4. **Tersedia Ready Stock di Samarinda:** Lagi pengen *Basreng Sultan Daun Jeruk* atau *In Parfume Bandung* hari ini juga tanpa nunggu jadwal kloter? Cek label **"Ready di Hub Samarinda"** di katalog kami!`,
  },
  {
    slug: "transparansi-harga-dan-pembayaran-qris-transfer-whatsapp-bawabawa",
    title: "Transparan Tanpa Biaya Tersembunyi: Cara Hitung Jastip Fee, Transfer Bank/QRIS & Konfirmasi WA",
    excerpt:
      "Di Bawabawa.id kamu tidak perlu daftar akun ribet. Cek rincian harga asli toko Bandung, pilih opsi jika stok habis, lalu bayar mudah via BCA/Mandiri/QRIS setelah dicek admin.",
    category: "Panduan Jastip",
    readingMinutes: 3,
    publishedAt: "2026-03-28T08:00:00Z",
    authorName: "Tim Bawabawa.id",
    bodyMd: `## Belanja Jastip Semudah Chatting dengan Teman Sendiri

Kami merancang sistem Bawabawa.id agar **cepat, transparan, dan manusiawi**:

* **Harga Toko Apa Adanya:** Harga produk di katalog adalah harga toko Bandung. Jasa titip (*Jastip Fee*) dihitung terpisah secara transparan (mulai Rp15.000 untuk Bandung Instant, Rp20.000 untuk Travel Jabar, dan Rp25.000 untuk Kloter Samarinda).
* **Pilih Opsi Saat Barang Viral Habis:** Karena kuliner viral seperti Roti Macan sering cepat habis, di form pesanan kamu bisa memilih di awal: *"Ganti varian lain"*, *"Ikut kloter besok"*, atau *"Refund 100% utuh"*.
* **Pembayaran Mudah (Transfer Bank & QRIS):** Tanpa biaya admin *payment gateway* tambahan! Cukup transfer ke rekening resmi **BCA / Mandiri / SeaBank** atau scan **QRIS Bawabawa.id**, lalu klik tombol **Konfirmasi WhatsApp 1-Klik**.`,
  },
];

export type PartnerSplitRule = {
  zoneId: string;
  zoneName: string;
  description: string;
  kasBisnisPct: number;
  ownerBandungPct: number;
  coOwnerBandungPct: number;
  hubSamarindaPct: number;
};

export const DEFAULT_PROFIT_SHARING_3P: {
  partnerNames: {
    kasBisnis: string;
    ownerBandung: string;
    coOwnerBandung: string;
    hubSamarinda: string;
  };
  rules: PartnerSplitRule[];
} = {
  partnerNames: {
    kasBisnis: "Kas Operasional & Packing Bawabawa",
    ownerBandung: "Partner 1 — Owner Bandung (Anda)",
    coOwnerBandung: "Partner 2 — Co-Owner & Belanja Bandung (Pacar)",
    hubSamarinda: "Partner 3 — Hub & Promosi Samarinda (Teman)",
  },
  rules: [
    {
      zoneId: "bandung_jabar",
      zoneName: "Jalur 1 (Bandung Instant) & Jalur 2 (Travel Jawa Barat / Jakarta)",
      description:
        "100% operasional dikerjakan di Bandung (belanja toko, packing, drop travel/kurir) tanpa melewati Hub Samarinda.",
      kasBisnisPct: 10,
      ownerBandungPct: 45,
      coOwnerBandungPct: 45,
      hubSamarindaPct: 0,
    },
    {
      zoneId: "samarinda_regular",
      zoneName: "Jalur 3 — Pesanan Samarinda & Kaltim (Order via Web / Umum)",
      description:
        "Tim Bandung belanja & kirim kloter, Partner Samarinda menerima barang di Hub, QC, koordinasi pickup/kurir lokal Samarinda.",
      kasBisnisPct: 10,
      ownerBandungPct: 35,
      coOwnerBandungPct: 35,
      hubSamarindaPct: 20,
    },
    {
      zoneId: "samarinda_referral",
      zoneName: "Jalur 3 — Pesanan Samarinda via Promosi / Input Teman Samarinda (Kode BAWASMD)",
      description:
        "Pelanggan dibawa/diinput langsung oleh Partner Samarinda atau memakai kode voucher BAWASMD. Komisi Partner Samarinda naik menjadi 30%.",
      kasBisnisPct: 10,
      ownerBandungPct: 30,
      coOwnerBandungPct: 30,
      hubSamarindaPct: 30,
    },
  ],
};

export function computeZoneEstimate(params: {
  zoneId: DeliveryZoneKey;
  itemSubtotalRp: number;
  weightKg: number;
  voucherCode?: string;
  zones?: ZoneRateConfig[];
}) {
  const zones = params.zones?.length ? params.zones : DEFAULT_ZONE_RATES;
  const zone = zones.find((z) => z.id === params.zoneId) ?? zones[0];
  const billableKg = Math.max(1, Math.ceil(params.weightKg || 1));
  const extraKg = Math.max(0, billableKg - zone.freeKgIncluded);
  const shippingRp = zone.baseShippingRp + extraKg * zone.perKgRp;
  const rawFee = Math.round(params.itemSubtotalRp * zone.jastipFeeRate);
  const jastipFeeRp = params.itemSubtotalRp > 0 ? Math.max(zone.jastipFeeMinRp, rawFee) : zone.jastipFeeMinRp;

  const code = (params.voucherCode ?? "").trim().toUpperCase();
  let discountRp = 0;
  if (code === "BAWASMD") {
    discountRp = 15000;
  } else if (code === "KANGENBDG") {
    discountRp = Math.min(25000, Math.round(jastipFeeRp * 0.5));
  }

  const totalRp = Math.max(0, params.itemSubtotalRp + jastipFeeRp + shippingRp - discountRp);

  return {
    zone,
    billableKg,
    itemSubtotalRp: params.itemSubtotalRp,
    jastipFeeRp,
    shippingRp,
    discountRp,
    totalRp,
    isSamarindaReferral: code === "BAWASMD",
  };
}
