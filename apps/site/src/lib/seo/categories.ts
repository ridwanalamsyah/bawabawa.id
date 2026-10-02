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
      "Nike, Adidas, Vans, Converse, Compass, Brodo, Aerostreet — kami belikan di toko yang kamu pilih di Bandung. Minta foto barang di toko sebelum kamu setuju dan bayar.",
    examples: ["Nike Air Force 1", "Adidas Samba", "Compass Gazelle", "Brodo Signore", "Vans Old Skool", "Converse Run Star"],
    faq: [
      {
        q: "Apakah dijamin original?",
        a: "Kami membelikan di toko yang kamu sebutkan (sebaiknya outlet resmi atau official store) dan mengirim box serta nota aslinya. Kamu bisa minta foto barang dan nota di toko sebelum setuju.",
      },
      {
        q: "Bagaimana cara cek ukuran kalau toko fisik?",
        a: "Tulis ukuran (US/EU/UK, atau panjang insole dalam cm) di kolom varian. Kalau perlu, minta foto label ukuran di toko lewat WhatsApp sebelum setuju.",
      },
    ],
    metaTitle: "Jastip Sepatu Bandung ke Samarinda | Bawabawa.id",
    metaDescription:
      "Jastip sepatu original dari Bandung (Nike, Adidas, Vans, Compass, Brodo) ke Samarinda. Cek harga dulu, bayar setelah setuju, Reguler 3–4 hari kerja.",
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
        a: "Kami cek tanggal kedaluwarsa di toko dan mencantumkannya di penawaran harga. Kalau masa simpannya terlalu pendek, kami tanya kamu dulu.",
      },
      {
        q: "Bisa request batch tertentu?",
        a: "Bisa. Tulis batch / production date di catatan request. Kalau di toko stock lain, shopper akan konfirmasi dulu.",
      },
    ],
    metaTitle: "Jastip Skincare Bandung ke Samarinda — Somethinc, Skintific, Wardah | Bawabawa.id",
    metaDescription:
      "Jastip skincare & beauty dari Bandung ke Samarinda. Cek tanggal kedaluwarsa sebelum kamu setuju, bayar setelah harga final.",
  },
  "jastip-fashion": {
    slug: "jastip-fashion",
    title: "Fashion",
    heroEyebrow: "Jastip fashion Bandung",
    heroHeadline: "Fashion Bandung → Samarinda",
    heroDescription:
      "Pasar Baru Bandung punya distro lokal terbaik: Eiger, Erigo, 3Second, Cardinal, Greenlight, Wakai, Cotton On. Tulis ukuran & warna yang kamu mau; kami belikan setelah kamu setuju harganya.",
    examples: ["Erigo Outerwear", "Eiger Backpack", "3Second Tee", "Cardinal Polo", "Greenlight Hoodie"],
    faq: [
      {
        q: "Bisa tukar ukuran kalau salah?",
        a: "Tukar ukuran tergantung kebijakan toko (biasanya 3–7 hari setelah pembelian). Kami bantu fasilitasi tapi ongkir tukar di-cover customer.",
      },
    ],
    metaTitle: "Jastip Fashion Bandung ke Samarinda — Erigo, Eiger, 3Second | Bawabawa.id",
    metaDescription:
      "Jastip baju & fashion Bandung (Erigo, Eiger, 3Second, Cardinal) ke Samarinda. Ukuran sesuai pesananmu, bayar setelah harga disetujui.",
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
      "BEC Mall Bandung & toko-toko resmi: iPhone, Samsung, Xiaomi, laptop, headset, smartwatch. Beli di toko resmi pilihanmu, nota & kartu garansi dikirim bersama barang.",
    examples: ["iPhone 15 Pro iBox", "Samsung Galaxy S24", "Xiaomi Redmi Note 13", "MacBook Air M3", "Apple Watch SE"],
    faq: [
      {
        q: "Garansi resmi tetap dapat?",
        a: "Garansi mengikuti kebijakan toko resmi tempat membeli (mis. iBox, Erafone, Samsung Store). Nota dan kartu garansi kami kirim utuh bersama barang.",
      },
      {
        q: "Bagaimana dengan gadget mahal?",
        a: "Untuk barang bernilai tinggi, diskusikan dulu lewat WhatsApp soal pengemasan dan opsi asuransi pengiriman dari ekspedisi sebelum kamu menyetujui penawaran.",
      },
    ],
    metaTitle: "Jastip iPhone, Samsung, Laptop Bandung ke Samarinda | Bawabawa.id",
    metaDescription:
      "Jastip elektronik & gadget Bandung (iPhone iBox, Samsung, MacBook) ke Samarinda. Beli di toko resmi, nota & kartu garansi ikut dikirim.",
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
        a: "Buku dikemas dengan kardus dan bubble wrap, sampul plastik asli dipertahankan. Kalau ada kerusakan saat pengiriman, hubungi kami lewat WhatsApp — ketentuannya ada di halaman Refund.",
      },
    ],
    metaTitle: "Jastip Buku Bandung ke Samarinda — Gramedia, Palasari, Import | Bawabawa.id",
    metaDescription:
      "Jastip buku & stationery dari Bandung (Gramedia, Periplus, Palasari) ke Samarinda. Dikemas rapi, bayar setelah harga disetujui.",
  },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_PAGES);
