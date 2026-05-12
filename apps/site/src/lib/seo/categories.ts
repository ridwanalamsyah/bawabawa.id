/**
 * Shared metadata for SEO category landing pages. Each entry produces:
 *   - A dedicated /{slug} route with localised hero + FAQ
 *   - A sitemap.xml entry with weekly change frequency
 *   - Schema.org `Service` + `BreadcrumbList` JSON-LD
 */

export type CategoryPage = {
  slug: string;
  title: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroDescription: string;
  examples: string[];
  faq: { q: string; a: string }[];
  metaTitle: string;
  metaDescription: string;
};

export const CATEGORY_PAGES: Record<string, CategoryPage> = {
  "jastip-sepatu": {
    slug: "jastip-sepatu",
    title: "Sepatu",
    heroEyebrow: "Jastip sepatu Bandung",
    heroHeadline: "Jastip sepatu original Bandung → Samarinda",
    heroDescription:
      "Nike, Adidas, Vans, Converse, Compass, Brodo, Aerostreet — kami beli langsung dari outlet resmi di Pasar Baru, Cihampelas, dan Trans Studio Mall Bandung. Foto detail sebelum bayar, jaminan original.",
    examples: ["Nike Air Force 1", "Adidas Samba", "Compass Gazelle", "Brodo Signore", "Vans Old Skool", "Converse Run Star"],
    faq: [
      {
        q: "Apakah dijamin original?",
        a: "Ya. Personal shopper kami hanya beli di outlet resmi & official store. Sertifikat & box asli dikirim utuh, plus foto di lokasi pembelian.",
      },
      {
        q: "Bagaimana cara cek ukuran kalau toko fisik?",
        a: "Kasih spesifikasi (US/EU/UK + insole panjang dalam cm) di form request. Shopper bisa kirim foto ukuran di toko sebelum bayar.",
      },
    ],
    metaTitle: "Jastip Sepatu Bandung ke Samarinda — Original 100% | Bawabawa.id",
    metaDescription:
      "Jastip sepatu original dari Bandung (Nike, Adidas, Vans, Compass, Brodo) ke Samarinda. Foto detail sebelum bayar, garansi original, pengiriman 3–4 hari.",
  },
  "jastip-skincare": {
    slug: "jastip-skincare",
    title: "Skincare & Beauty",
    heroEyebrow: "Jastip skincare Bandung",
    heroHeadline: "Skincare & beauty Bandung → Samarinda",
    heroDescription:
      "Somethinc, Skintific, Wardah, Emina, Avoskin, Whitelab, Scarlett — semua diambil langsung dari Watsons, Guardian, atau official store di Paris Van Java & TSM Bandung.",
    examples: ["Somethinc Niacinamide", "Skintific MSH", "Avoskin Miraculous", "Whitelab Acne", "Wardah Crystal"],
    faq: [
      {
        q: "Apakah expired date masih lama?",
        a: "Shopper akan cek expired date di toko dan kirim foto sebelum bayar. Kami tidak terima produk dengan masa simpan < 6 bulan.",
      },
      {
        q: "Bisa request batch tertentu?",
        a: "Bisa. Tulis batch / production date di catatan request. Kalau di toko stock lain, shopper akan konfirmasi dulu.",
      },
    ],
    metaTitle: "Jastip Skincare Bandung ke Samarinda — Somethinc, Skintific, Wardah | Bawabawa.id",
    metaDescription:
      "Jastip skincare & beauty dari Bandung ke Samarinda. Cek expired date sebelum bayar, foto detail produk, garansi original 100%.",
  },
  "jastip-fashion": {
    slug: "jastip-fashion",
    title: "Fashion",
    heroEyebrow: "Jastip fashion Bandung",
    heroHeadline: "Fashion Bandung → Samarinda",
    heroDescription:
      "Pasar Baru Bandung punya distro lokal terbaik: Eiger, Erigo, 3Second, Cardinal, Greenlight, Wakai, Cotton On. Kami jastip-kan dengan ukuran detail, foto pas, pengiriman aman.",
    examples: ["Erigo Outerwear", "Eiger Backpack", "3Second Tee", "Cardinal Polo", "Greenlight Hoodie"],
    faq: [
      {
        q: "Bisa tukar ukuran kalau salah?",
        a: "Tukar ukuran tergantung kebijakan toko (biasanya 3–7 hari setelah pembelian). Kami bantu fasilitasi tapi ongkir tukar di-cover customer.",
      },
    ],
    metaTitle: "Jastip Fashion Bandung ke Samarinda — Erigo, Eiger, 3Second | Bawabawa.id",
    metaDescription:
      "Jastip baju & fashion Bandung (Erigo, Eiger, 3Second, Cardinal) ke Samarinda. Foto fitting di toko, ukuran detail, pengiriman aman.",
  },
  "jastip-makanan": {
    slug: "jastip-makanan",
    title: "Makanan & Oleh-oleh",
    heroEyebrow: "Jastip oleh-oleh Bandung",
    heroHeadline: "Oleh-oleh Bandung legendaris → Samarinda",
    heroDescription:
      "Kartika Sari, Amanda Brownies, Bolu Susu Lembang, Pia Bandung, Strudel Bandung, Brownies Kukus Amanda — semuanya fresh dari outlet resmi, dikirim dengan packing cooler insulated.",
    examples: ["Kartika Sari Pisang Bollen", "Amanda Brownies Kukus", "Bolu Susu Lembang", "Pia Bandung", "Strudel Bandung"],
    faq: [
      {
        q: "Aman makanan basah di-jastip?",
        a: "Aman untuk daya tahan ≥3 hari di suhu ruang. Kami pakai packing cooler + ice gel untuk pengiriman cepat. Untuk makanan basah <1 hari, tidak kami layani.",
      },
    ],
    metaTitle: "Jastip Oleh-oleh Bandung ke Samarinda — Kartika Sari, Amanda | Bawabawa.id",
    metaDescription:
      "Jastip oleh-oleh khas Bandung (Kartika Sari, Amanda Brownies, Bolu Lembang) ke Samarinda. Packing cooler, fresh sampai tujuan, 3–4 hari.",
  },
  "jastip-elektronik": {
    slug: "jastip-elektronik",
    title: "Elektronik & Gadget",
    heroEyebrow: "Jastip elektronik Bandung",
    heroHeadline: "Elektronik & gadget Bandung → Samarinda",
    heroDescription:
      "BEC Mall Bandung & toko-toko resmi: iPhone, Samsung, Xiaomi, laptop, headset, smartwatch. Kami bantu verifikasi serial number, foto di toko, garansi resmi terdaftar.",
    examples: ["iPhone 15 Pro iBox", "Samsung Galaxy S24", "Xiaomi Redmi Note 13", "MacBook Air M3", "Apple Watch SE"],
    faq: [
      {
        q: "Garansi resmi tetap dapat?",
        a: "Iya, asal beli di toko resmi (iBox, Erafone, Samsung Center, etc). Kartu garansi diaktifkan atas nama customer, dikirim utuh.",
      },
      {
        q: "Asuransi untuk gadget mahal?",
        a: "Untuk barang ≥Rp 10jt, opsional asuransi 2% dari nilai barang. Klaim 100% kalau hilang/rusak selama perjalanan.",
      },
    ],
    metaTitle: "Jastip iPhone, Samsung, Laptop Bandung ke Samarinda | Bawabawa.id",
    metaDescription:
      "Jastip elektronik & gadget Bandung (iPhone iBox, Samsung, MacBook) ke Samarinda. Garansi resmi, asuransi opsional, foto verifikasi.",
  },
  "jastip-buku": {
    slug: "jastip-buku",
    title: "Buku & Stationery",
    heroEyebrow: "Jastip buku Bandung",
    heroHeadline: "Buku & stationery Bandung → Samarinda",
    heroDescription:
      "Gramedia, Periplus, Toga Mas, Palasari book street, dan import dari Aksaramaya. Buku langka, manga import, light novel — kami beli dan kirim aman.",
    examples: ["Buku import Aksaramaya", "Manga Tokopedia BL", "Light novel Comic House", "Stationery Gramedia"],
    faq: [
      {
        q: "Aman untuk buku import?",
        a: "Kami pakai box hardcover + bubble wrap. Sampul plastik orisinil dipertahankan. Klaim ganti 100% kalau ada kerusakan transit.",
      },
    ],
    metaTitle: "Jastip Buku Bandung ke Samarinda — Gramedia, Palasari, Import | Bawabawa.id",
    metaDescription:
      "Jastip buku & stationery dari Bandung (Gramedia, Periplus, Palasari) ke Samarinda. Buku langka & import aman, garansi packing hardcover.",
  },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_PAGES);
