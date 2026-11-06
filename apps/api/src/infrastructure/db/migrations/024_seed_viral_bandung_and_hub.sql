-- =============================================================================
-- 024: Seed Viral Bandung Products, Stores, Blog Posts, 3-Zone Trips,
--      3-Partner Profit Share Rules, Payment/QRIS Info, & Testimonials.
--      All rows are stored in the database and 100% editable from /admin.
--      Uses ON CONFLICT DO NOTHING / idempotent checks so re-running is safe.
-- =============================================================================

-- 1. Seed dynamic CMS settings for 3-Zone Delivery, Live Shopper Status,
--    Payment/QRIS Info, 3-Partner Profit Sharing, and Hub Samarinda Ready Stock.
INSERT INTO site_settings (setting_key, value, description)
VALUES
  ('live_status', $$
    {
      "isActive": true,
      "badge": "LIVE BELANJA HARI INI",
      "text": "Tim Bawabawa sedang keliling area Buah Batu, Cihapit, Riau & Banceuy (Roti Macan, Tjilaki 9, Seroja Bake, Rochi, Studio Bolen & In Parfume)!",
      "subtext": "Order sebelum 14.00 WIB ikut pengantaran Bandung Instant & Travel Jawa Barat sore ini · Kloter Hub Samarinda buka!"
    }
  $$::jsonb, 'Bar status belanja live di bagian paling atas website.'),
  ('payment_info', $$
    {
      "bankName": "BCA",
      "accountNumber": "7772819201",
      "accountHolder": "Bawabawa Indonesia (Tim Bandung)",
      "secondaryBankName": "Mandiri",
      "secondaryAccountNumber": "1300028918271",
      "secondaryAccountHolder": "Bawabawa Indonesia",
      "qrisMerchantName": "BAWABAWA.ID JASTIP BANDUNG",
      "qrisImageUrl": null,
      "instructions": "Transfer sesuai nominal tagihan atau scan QRIS, lalu klik tombol Konfirmasi WhatsApp agar langsung masuk daftar belanja tim Bandung."
    }
  $$::jsonb, 'Informasi rekening bank & QRIS untuk pembayaran manual.'),
  ('zone_rates', $$
    {
      "bandung": {
        "label": "Bandung Raya Instant",
        "coverage": "Kota Bandung, Cimahi, Lembang, Kab. Bandung, Jatinangor (Rumah/Kos/Hotel/Stasiun)",
        "eta": "Sampai Hari Ini (2–4 Jam)",
        "baseShippingFee": 18000,
        "jastipFeeRate": 8,
        "minJastipFee": 15000
      },
      "jabar": {
        "label": "Jawa Barat & Jabodetabek (Via Travel)",
        "coverage": "Garut, Tasikmalaya, Sumedang, Purwakarta, Subang, Karawang, Cianjur, Sukabumi, Cirebon, Majalengka, Bogor, Depok, Bekasi, Tangerang, Jakarta",
        "eta": "Sameday / 3–5 Jam via Shuttle Travel (Cititrans, DayTrans, Arnes, Pasteur Trans, Bhinneka)",
        "baseShippingFee": 35000,
        "perKgFee": 15000,
        "jastipFeeRate": 8,
        "minJastipFee": 20000
      },
      "samarinda": {
        "label": "Samarinda & Kaltim (Via Kloter & Hub Samarinda)",
        "coverage": "Samarinda (Pickup Hub / Kurir Lokal), Balikpapan, Tenggarong, Bontang",
        "eta": "1–2 Hari (Kloter Udara) / Reguler Terjadwal",
        "perKgFee": 43000,
        "cargoFlatFee": 200000,
        "jastipFeeRate": 8,
        "minJastipFee": 20000,
        "hubPickupAddress": "Hub Bawabawa Samarinda (Dikelola Partner Samarinda — Shareloc dikirim otomatis via WA)"
      }
    }
  $$::jsonb, 'Tarif pengiriman dan jastip untuk 3 jalur (Bandung, Jawa Barat Travel, Hub Samarinda).'),
  ('profit_sharing', $$
    {
      "reservePercentage": 10,
      "partners": {
        "ownerBandungName": "Owner 1 (Anda - Bandung)",
        "coOwnerBandungName": "Owner 2 (Pacar - Bandung)",
        "hubSamarindaName": "Partner 3 (Hub Samarinda)",
        "hubSamarindaReferralCode": "BAWASMD"
      },
      "splits": {
        "bandung_jabar": {
          "reservePct": 10,
          "ownerBandungPct": 45,
          "coOwnerBandungPct": 45,
          "hubSamarindaPct": 0
        },
        "samarinda_regular": {
          "reservePct": 10,
          "ownerBandungPct": 35,
          "coOwnerBandungPct": 35,
          "hubSamarindaPct": 20
        },
        "samarinda_referral": {
          "reservePct": 10,
          "ownerBandungPct": 30,
          "coOwnerBandungPct": 30,
          "hubSamarindaPct": 30
        }
      },
      "settlements": [],
      "rules": [
        { "role": "owner", "label": "Owner 1 (Anda - Bandung)", "percentage": 35 },
        { "role": "operations", "label": "Owner 2 (Pacar - Bandung)", "percentage": 35 },
        { "role": "hub_samarinda", "label": "Partner 3 (Hub Samarinda)", "percentage": 20 }
      ]
    }
  $$::jsonb, 'Aturan bagi hasil 3 partner berdasarkan jalur pengiriman & referral.'),
  ('hub_samarinda_stock', $$
    {
      "items": [
        {
          "id": "ready-smd-1",
          "name": "Basreng Sultan Daun Jeruk Bandung 500gr (No Atos)",
          "originStore": "Sentra Basreng Bandung",
          "price": 65000,
          "stockQty": 12,
          "notes": "Ready di Hub Samarinda — Bisa langsung diambil atau diantar kurir lokal Samarinda hari ini!"
        },
        {
          "id": "ready-smd-2",
          "name": "Batagor Kingsley Vacuum Pack Isi 10 + Bumbu Kacang",
          "originStore": "Batagor Kingsley Veteran",
          "price": 165000,
          "stockQty": 6,
          "notes": "Frozen ready di freezer Hub Samarinda — Siap goreng!"
        },
        {
          "id": "ready-smd-3",
          "name": "In Parfume Fragrance Bandung 35ml (Best Seller Aroma)",
          "originStore": "In Parfume Banceuy Bandung",
          "price": 105000,
          "stockQty": 8,
          "notes": "Aroma Baccarat, English Pear & Black Opium ready di Hub Samarinda!"
        },
        {
          "id": "ready-smd-4",
          "name": "Keripik Pedas Mang Odod & Seblak Instan Bandung",
          "originStore": "Mang Odod Cimahi",
          "price": 55000,
          "stockQty": 10,
          "notes": "Ready di Hub Samarinda — Tanpa tunggu kloter pesawat!"
        }
      ]
    }
  $$::jsonb, 'Daftar barang Bandung yang ready stock di Hub Samarinda.')
ON CONFLICT (setting_key) DO NOTHING;

-- Update homepage & faq settings if not yet customized
INSERT INTO site_settings (setting_key, value, description)
VALUES
  ('homepage', $$
    {
      "heroWords": ["Roti Macan", "Tjilaki 9", "Seroja Bake", "In Parfume", "Studio Bolen"],
      "heroSubtitle": "Jastip kuliner, bakery antre, basreng & barang viral Bandung. Diantar langsung di Bandung, dikirim Sameday via Travel ke Jawa Barat & Jakarta, atau terbang ke Hub Samarinda!"
    }
  $$::jsonb, 'Teks utama beranda.'),
  ('faq', $$
    {
      "items": [
        {
          "q": "Apakah Bawabawa.id melayani pengiriman ke Bandung, Jawa Barat, dan Samarinda?",
          "a": "Ya! Kami punya 3 jalur pengiriman dari Bandung: (1) Bandung Raya Instant diantar di hari yang sama ke rumah/kos/hotel/stasiun, (2) Jawa Barat & Jabodetabek (Garut, Tasik, Sumedang, Purwakarta, Subang, Karawang, Cianjur, Cirebon, Bogor, Depok, Bekasi, Jakarta) via Shuttle Travel Sameday 2–4 jam sampai, dan (3) Samarinda & Kaltim via Kloter Pesawat/Kargo menuju Hub Partner Bawabawa di Samarinda."
        },
        {
          "q": "Makanan viral seperti Roti Macan, Roti Merak, Bolu Pisang Tjilaki 9, Seroja Bake, dan Studio Bolen apakah dibeli fresh?",
          "a": "100% dibeli fresh di hari pengiriman! Tim kami di Bandung berangkat antre langsung ke toko resminya (Buah Batu, Cihapit, Riau, Sadang Serang, Trunojoyo). Untuk pengiriman luar kota & Samarinda, roti seperti Roti Macan bisa di-vacuum agar tetap empuk dan tahan perjalanan."
        },
        {
          "q": "Bagaimana cara pembayarannya? Apakah harus pakai aplikasi ribet?",
          "a": "Sangat mudah! Tidak perlu daftar akun atau payment gateway ribet. Cukup pilih barang di Katalog atau isi Form Titip, lalu bayar via Transfer Bank (BCA/Mandiri) atau Scan QRIS Bawabawa.id, dan klik tombol Konfirmasi langsung ke WhatsApp Admin."
        },
        {
          "q": "Bagaimana kalau varian roti/barang yang saya pesan habis saat di toko Bandung?",
          "a": "Saat mengisi pesanan, kamu bisa memilih opsi: (1) Ganti ke varian cadangan yang kamu tulis, (2) Belikan yang ada saja dan sisanya kami refund penuh 100%, atau (3) Tim kami hubungi WhatsApp kamu langsung dari kasir toko."
        },
        {
          "q": "Untuk pesanan ke Samarinda, apakah bisa diambil di Hub Samarinda?",
          "a": "Bisa banget! Paket kloter Samarinda diterima oleh Partner Hub Bawabawa di Samarinda. Kamu bisa ambil langsung (Pickup gratis ongkir lokal) atau minta diantar kurir lokal Samarinda / travel ke Balikpapan, Tenggarong, dan Bontang."
        }
      ]
    }
  $$::jsonb, 'Daftar FAQ di halaman utama.')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Seed 20 Viral Bandung Catalog Products (only if no catalog products exist yet)
DO $seed_viral_catalog$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE is_catalog = TRUE) THEN
    INSERT INTO products (
      id, sku, name, description, image_url, origin_store, unit_price, current_stock,
      weight_kg, catalog_category, variants, is_catalog, catalog_sort
    ) VALUES
      (
        '11111111-1111-4111-8111-000000000001',
        'CAT-ROTIMACAN',
        'Roti Macan Sourdough Artisan Bandung (Fresh / Free Vacuum)',
        'Sourdough artisan paling viral di Bandung yang antreannya mengular sejak pagi! Tekstur roti super lembut dengan isian melimpah. Bisa request kemasan vacuum gratis agar aman dikirim via Travel Jawa Barat maupun Kloter Pesawat Samarinda. Tahan 3-4 hari suhu ruang (7 hari di kulkas).',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
        'Roti Macan & TTKR (Jl. Buah Batu 129)',
        55000,
        50,
        0.35,
        'Bakery & Roti Viral',
        '["Cranberry Cheese (Best Seller)", "Double Chocolate", "Parmigiano Chocolate", "Roti Abon Pedas w/ Cream Yogurt", "Salt Bread (Shio Pan)"]'::jsonb,
        TRUE,
        100
      ),
      (
        '11111111-1111-4111-8111-000000000002',
        'CAT-ROTIMACAN-BUNDLE',
        'Paket Bundling 4 Pcs Roti Macan Bandung (Siap Kirim Luar Kota)',
        'Paket hemat langsung 4 pcs Roti Macan Sourdough pilihanmu lengkap dengan box khusus & opsi vacuum seal untuk pengiriman Travel Jawa Barat/Jakarta maupun terbang ke Hub Samarinda.',
        'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=900&q=80',
        'Roti Macan & TTKR (Jl. Buah Batu 129)',
        215000,
        30,
        1.20,
        'Paket Bundling',
        '["Paket Mix 4 Rasa Favorit (Vacuum)", "Paket 2 Cranberry Cheese + 2 Double Choco", "Paket 4 Cranberry Cheese"]'::jsonb,
        TRUE,
        98
      ),
      (
        '11111111-1111-4111-8111-000000000003',
        'CAT-TJILAKI9',
        'Bolu Pisang Tjilaki 9 Bandung (+ Spesial Cold Butter)',
        'Bolu pisang legendaris kekinian dari kawasan Cihapit yang selalu sold out! Harum pisang asli dengan tekstur moist & disajikan bersama potongan cold butter gurih. Tahan 3-4 hari suhu ruang.',
        'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80',
        'Tjilaki 9 (Jl. Cilaki No. 9 Cihapit)',
        195000,
        40,
        0.85,
        'Bakery & Roti Viral',
        '["1 Loyang Utuh Original + Cold Butter", "1 Loyang Utuh Keju", "Paket 2 Slice Bolu Potong + Cold Butter"]'::jsonb,
        TRUE,
        96
      ),
      (
        '11111111-1111-4111-8111-000000000004',
        'CAT-ROTIMERAK',
        'Roti Merak Sourdough Keju & Cokelat Viral Bandung',
        'Roti sourdough lembut dari Jl. Merak Sadang Serang yang hanya buka pagi sampai siang. Dibeli langsung fresh dari oven hari pengiriman + packing dus & bubble wrap. Tahan 3 hari suhu ruang.',
        'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=900&q=80',
        'Toko Roti Merak (Jl. Merak No. 4)',
        68000,
        35,
        0.50,
        'Bakery & Roti Viral',
        '["Paket Mix 3 Pcs (Keju & Cokelat)", "Sourdough Keju Spesial", "Sourdough Cokelat Lumer", "Mix 3 Pcs + Extra Dip Cream"]'::jsonb,
        TRUE,
        94
      ),
      (
        '11111111-1111-4111-8111-000000000005',
        'CAT-ROCHI',
        'Rochi Bandung — Roti Mochi Mulur Viral (Box Isi 6 Pcs)',
        'Perpaduan roti lembut khas Bandung dengan isian mochi kenyal mulur di dalamnya! Lokasi di Jl. Riau 61 dan selalu jadi incaran jastip. Tahan 3 hari suhu ruang.',
        'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80',
        'Rochi Bandung (Jl. R.E. Martadinata No. 61)',
        165000,
        40,
        0.65,
        'Bakery & Roti Viral',
        '["Box Mix 6 Rasa Best Seller", "Box Dominan Cokelat & Keju", "Box Matcha, Taro & Red Bean"]'::jsonb,
        TRUE,
        92
      ),
      (
        '11111111-1111-4111-8111-000000000006',
        'CAT-STUDIOBOLEN',
        'Studio Bolen — Bolen Pisang Nipah Gula Aren & Keju',
        'Saudara kandung Seroja Bake dengan konsep futuristik di Exsport Space Trunojoyo! Wajib coba varian Bolen Pisang Nipah dengan manis alami gula aren khas Nusantara dan Bolen Keju.',
        'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80',
        'Studio Bolen (Jl. Trunojoyo / Exsport Space)',
        95000,
        35,
        0.60,
        'Bakery & Roti Viral',
        '["Box Bolen Pisang Nipah (Gula Aren)", "Box Bolen Pisang Keju Klasik", "Box Mix Nipah & Keju"]'::jsonb,
        TRUE,
        90
      ),
      (
        '11111111-1111-4111-8111-000000000007',
        'CAT-SEROJABAKE',
        'Seroja Bake Cihapit — Tart Singkong, Peuyeum & Cheesecake',
        'Bakery lokal paling hits di Pasar Cihapit & Ganesha! Mengolah bahan lokal Indonesia menjadi pastry kelas atas. Sangat direkomendasikan untuk pengantaran Bandung Instant & Travel Jawa Barat/Jakarta.',
        'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=80',
        'Seroja Bake (Cihapit & Jl. Ganesha 4)',
        145000,
        25,
        0.55,
        'Bakery & Roti Viral',
        '["Paket 3 Slice Best Seller (Tart Singkong + Peuyeum + Beri Kenari)", "Cheesecake Pandan & Stroberi Kapulaga", "Paket Jajanan Pasar Fusion Seroja"]'::jsonb,
        TRUE,
        88
      ),
      (
        '11111111-1111-4111-8111-000000000008',
        'CAT-SAPPOROSOES',
        'Sapporo Soes Bandung — Kue Soes Isian Milky Ice Cream',
        'Kue soes Jepang viral di Bandung dengan isian milky cream lembut seperti es krim (bukan vla biasa!). Paling nikmat disajikan dingin. Cocok untuk Bandung Instant & Travel Jabar (Cooler Pack).',
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80',
        'Sapporo Soes / Todays Donut (Margacinta & Antapani)',
        72000,
        40,
        0.50,
        'Bakery & Roti Viral',
        '["Box Isi 6 Mix (Ori Milky & Rich Choco)", "Box Isi 6 Ori Milky Cream", "Box Isi 6 Rich Chocolate", "Box Besar Isi 12 Mix"]'::jsonb,
        TRUE,
        86
      ),
      (
        '11111111-1111-4111-8111-000000000009',
        'CAT-PULN',
        'Puln Bakehouse — Shio Pan (Salt Bread) & Artisan Pastry Box',
        'Pastry dan Shio Pan (Korean/Japanese Salt Bread) renyah di luar, buttery lembut di dalam yang lagi hits di kalangan anak muda Bandung.',
        'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80',
        'Puln Bakehouse Bandung',
        115000,
        30,
        0.50,
        'Bakery & Roti Viral',
        '["Box 4 Pcs Shio Pan (Salt Bread Original & Cheese)", "Box Mix Croissant, Pain au Chocolat & Danish", "Garlic Cream Cheese & Truffle Salt Bread"]'::jsonb,
        TRUE,
        84
      ),
      (
        '11111111-1111-4111-8111-000000000010',
        'CAT-WARISAN',
        'Kue Marmer Warisan Bandung (Classic Wijsman Butter)',
        'Marmer cake klasik premium khas Bandung dengan aroma full Wijsman butter yang semerbak dan tekstur padat lembut. Tahan 5-6 hari suhu ruang sehingga SANGAT AMAN dikirim ke Samarinda maupun seluruh Jawa Barat!',
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
        'Marmer Cake Warisan Bandung',
        185000,
        35,
        0.90,
        'Bakery & Roti Viral',
        '["1 Loyang Utuh Marmer Cake Warisan", "Marmer Cake Spesial Extra Butter"]'::jsonb,
        TRUE,
        82
      ),
      (
        '11111111-1111-4111-8111-000000000011',
        'CAT-MAKJAY',
        'Kopi Susu Makmur Jaya ("Makjay") Botol 1 Liter + Kudapan',
        'Kopi susu legendaris favorit anak Bandung! Kemasan botol 1 Liter segel rapat lengkap dengan ice gel/cooler pouch untuk pengiriman Bandung Instant, Travel Jawa Barat/Jakarta, atau Handcarry Pesawat.',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
        'Kopi Makmur Jaya (Lengkong Besar & Dago)',
        185000,
        40,
        1.10,
        'Kopi & Jajanan Gurih',
        '["Kopi Susu Makmur Jaya 1 Liter (Normal Sugar)", "Kopi Susu Makmur Jaya 1 Liter (Less Sugar)", "Bundling Kopi 1 Liter + Roti Bakar Kaya"]'::jsonb,
        TRUE,
        80
      ),
      (
        '11111111-1111-4111-8111-000000000012',
        'CAT-BASRENG-SULTAN',
        'Basreng Viral Bandung Daun Jeruk (Renyah No Atos! 500gr / 1Kg)',
        'Basreng khas Bandung dengan irisan tipis/stik renyah (dijamin tidak keras/no atos) dan taburan bumbu cabai asli + daun jeruk melimpah. Tahan 2 bulan! Best-seller untuk Kloter Samarinda & Travel Jabar.',
        'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80',
        'Sentra Basreng Sultan Bandung',
        55000,
        100,
        0.55,
        'Basreng & Snack Pedas',
        '["Pedas Daun Jeruk 500gr", "Original Asin Daun Jeruk 500gr", "Extra Pedas Nampol 500gr", "Kemasan Puas 1 Kg Mix (2x500gr)"]'::jsonb,
        TRUE,
        78
      ),
      (
        '11111111-1111-4111-8111-000000000013',
        'CAT-MANGODOD',
        'Keripik Pedas Mang Odod Cimahi & Seblak Coet Instan Bandung',
        'Cemilan pedas legendaris Mang Odod yang selalu antre di Cimahi/Bandung dipadukan dengan paket Seblak Coet Instan ala Rafael yang mudah dimasak di rumah. Tahan 2 bulan!',
        'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=900&q=80',
        'Keripik Mang Odod & Sentra Snack Bandung',
        48000,
        80,
        0.45,
        'Basreng & Snack Pedas',
        '["Keripik Singkong Pedas Daun Jeruk", "Basreng Bulat Mang Odod", "Paket 3 Bungkus Seblak Coet & Baso Aci Instan"]'::jsonb,
        TRUE,
        76
      ),
      (
        '11111111-1111-4111-8111-000000000014',
        'CAT-KINGSLEY-VACUUM',
        'Batagor Kingsley & Batagor Burangrang Vacuum Pack (Isi 10)',
        'Batagor ikan tenggiri asli paling ikonik di Bandung dalam kemasan Vacuum Frozen resmi lengkap dengan bumbu kacang kental, kecap, dan jeruk limau. Aman dikirim ke Jawa Barat maupun terbang ke Samarinda!',
        'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=900&q=80',
        'Batagor Kingsley (Jl. Veteran No. 25)',
        155000,
        50,
        0.95,
        'Kopi & Jajanan Gurih',
        '["Kingsley Vacuum Isi 10 (Campur Batagor & Siomay)", "Kingsley Vacuum Isi 10 (Full Batagor Goreng)", "Batagor Burangrang Vacuum Pack Spesial"]'::jsonb,
        TRUE,
        74
      ),
      (
        '11111111-1111-4111-8111-000000000015',
        'CAT-TIRAMISUSU',
        'Tiramisusu by Chocomory Bandung (Original / Cookies & Cream)',
        'Dessert box 6 lapisan lumer kebanggaan Bandung yang selalu antre di Jl. Anggrek/Riau. Dikemas dengan thermal cooler bag.',
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80',
        'Tiramisusu by Chocomory (Jl. Anggrek)',
        128000,
        45,
        0.60,
        'Bakery & Roti Viral',
        '["Original Reguler Box", "Cookies & Cream Reguler Box", "Mix Duo Box"]'::jsonb,
        TRUE,
        72
      ),
      (
        '11111111-1111-4111-8111-000000000016',
        'CAT-INPARFUME',
        'Jastip Antre In Parfume Fragrance Bandung (100% Original Store)',
        'Gak perlu antre berjam-jam di Jl. Banceuy/Tamblong! Tim kami antrekan langsung parfum inspired paling tahan lama (24 jam+) di Bandung. Tulis aroma favoritmu (Baccarat, Jo Malone, YSL, Dior, Creed, dll.) di catatan pesanan!',
        'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
        'In Parfume Fragrance (Jl. Banceuy / Tamblong)',
        95000,
        100,
        0.25,
        'Parfum & Barang Hits',
        '["Botol 35ml (Tulis Aroma di Catatan)", "Botol 60ml (Best Value)", "Botol 100ml (Ukuran Besar)", "Paket 2 Botol 35ml Bebas Pilih Aroma"]'::jsonb,
        TRUE,
        95
      ),
      (
        '11111111-1111-4111-8111-000000000017',
        'CAT-EXSPORT-BANDUNG',
        'Tas Exsport Space & Torch Bandung (Koleksi Offline Store)',
        'Titip tas ransel, totebag puffy, atau slingbag warna pastel eksklusif langsung dari Exsport Space Jl. Trunojoyo & store Torch Bandung.',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
        'Exsport Space (Jl. Trunojoyo Bandung)',
        245000,
        30,
        0.50,
        'Fashion & Brand Lokal',
        '["Puffy Totebag Pastel Series", "Everyday Slingbag", "Classic Backpack Bandung Edition"]'::jsonb,
        TRUE,
        70
      ),
      (
        '11111111-1111-4111-8111-000000000018',
        'CAT-DISTRO-BRAGA',
        'Apparel & Merchandise Bandung (Toko Tahilalats Braga / Distro Trunojoyo)',
        'Kaos oversize, hoodie, dan merchandise kolaborasi eksklusif yang hanya rilis di offline store Jalan Braga & Jalan Trunojoyo Bandung.',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        'Jl. Braga & Distro Trunojoyo Bandung',
        215000,
        30,
        0.40,
        'Fashion & Brand Lokal',
        '["Oversize T-Shirt Size M", "Oversize T-Shirt Size L", "Oversize T-Shirt Size XL", "Tote & Merch Pack Braga"]'::jsonb,
        TRUE,
        68
      ),
      (
        '11111111-1111-4111-8111-000000000019',
        'CAT-PRIMARASA',
        'Brownies Panggang & Pisang Bollen Prima Rasa Kemuning',
        'Oleh-oleh klasik kebanggaan Bandung yang selalu dicari keluarga. Dibeli fresh pagi hari langsung dari toko pusat Prima Rasa Jl. Kemuning.',
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
        'Prima Rasa Pusat (Jl. Kemuning No. 20)',
        115000,
        60,
        0.75,
        'Oleh-Oleh Klasik',
        '["Brownies Panggang Choco Chip", "Brownies Panggang Keju", "Pisang Bollen Cokelat Keju", "Bollen Peuyeum / Durian"]'::jsonb,
        TRUE,
        66
      ),
      (
        '11111111-1111-4111-8111-000000000020',
        'CAT-PAKET-KANGEN',
        'Paket Hampers "Kangen Bandung Viral" (Roti Macan + Tjilaki 9 + Basreng)',
        'Bingung pilih yang mana? Paket komplit berisi 2 pcs Roti Macan Sourdough + 1 Box Bolu Pisang Tjilaki 9 + 1 Pack Basreng Daun Jeruk 500gr. Lebih hemat & langsung puas!',
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
        'Kurasi Tim Bawabawa Bandung',
        285000,
        25,
        1.50,
        'Paket Bundling',
        '["Paket Kangen Viral A (Manis & Gurih)", "Paket Oleh-Oleh Terbang Samarinda (Full Vacuum)"]'::jsonb,
        TRUE,
        99
      );
  END IF;
END
$seed_viral_catalog$;

-- 3. Seed 6 Viral Bandung Blog Articles into blog_posts
INSERT INTO blog_posts (
  id, slug, title, excerpt, content_md, category, read_time, hero_image_url, is_published, published_at
) VALUES
  (
    '22222222-2222-4222-8222-000000000001',
    '10-roti-bakery-paling-viral-bandung-roti-macan-merak-tjilaki',
    '10 Roti & Bakery Paling Viral di Bandung: Dari Roti Macan, Roti Merak, sampai Bolu Pisang Tjilaki 9!',
    'Lupakan oleh-oleh yang itu-itu saja! Ini daftar bakery artisan dan bolu paling hits di Bandung yang antreannya mengular sejak pagi — dan cara titipnya tanpa antre.',
    $$## Tren Oleh-Oleh Bandung Sudah Berubah!

Kalau dulu orang ke Bandung hanya mencari brownies atau bolen klasik, sekarang peta kuliner Bandung diramaikan oleh **bakery artisan lokal, roti sourdough, dan bolu klasik berbahan butter premium** yang tersebar di kawasan Buah Batu, Cihapit, Sadang Serang, hingga Jalan Riau.

Masalahnya? Hampir semuanya memakai sistem **antre pagi atau kuota harian terbatas** yang habis dalam hitungan jam!

### 1. Roti Macan (& TTKR Specialty Coffee — Jl. Buah Batu 129)
Roti sourdough lembut dengan isian **Cranberry Cheese**, **Double Chocolate**, dan **Parmigiano Chocolate** ini selalu dipenuhi antrean. Kabar baiknya, Roti Macan menyediakan kemasan *vacuum* sehingga sangat aman dikirim keluar kota (Jawa Barat, Jakarta, hingga terbang ke Samarinda).

### 2. Bolu Pisang Tjilaki 9 (Jl. Cilaki No. 9, Cihapit)
Bolu pisang padat nan *moist* yang disajikan dengan potongan **Cold Butter** gurih. Kemasannya yang estetik bergaya vintage menjadikannya buah tangan nomor satu dari kawasan Cihapit.

### 3. Toko Roti Merak (Jl. Merak No. 4, Sadang Serang)
Buka dari jam 08.00 pagi hingga 15.00 sore, sourdough keju dan cokelat dari Roti Merak punya tekstur empuk yang tahan 3 hari di suhu ruang.

### 4. Rochi Bandung (Roti Mochi — Jl. R.E. Martadinata No. 61)
Kombinasi roti lembut dengan isian mochi mulur di dalamnya. Tersedia rasa Cokelat, Keju, Matcha, Taro, hingga Ogura.

### 5. Studio Bolen & Seroja Bake (Trunojoyo & Cihapit)
Dua bersaudara yang mengangkat bahan pangan lokal Nusantara! Di **Studio Bolen**, kamu wajib mencoba *Bolen Pisang Nipah (Gula Aren)*, sedangkan di **Seroja Bake** ada *Tart Singkong Cokelat* dan *Tart Vanila Peuyeum*.

### 6. Sapporo Soes, Puln Bakehouse & Kue Marmer Warisan
Mulai dari soes krim es krim lumer **Sapporo Soes**, *Shio Pan (Salt Bread)* dari **Puln**, hingga harumnya Wijsman butter pada **Kue Marmer Warisan** yang tahan 6 hari perjalanan jauh.

---

### Malas Antre atau Lagi di Luar Bandung?
Tim **Bawabawa.id** setiap pagi keliling langsung ke toko-toko di atas! Pilih jalur pengirimanmu:
- **Bandung Raya Instant:** Diantar hari itu juga ke rumah, kos, atau hotelmu di Bandung.
- **Jawa Barat & Jabodetabek via Travel:** Dikirim sore via Cititrans/DayTrans/Arnes, malam sudah sampai!
- **Kloter Hub Samarinda:** Terbang terjadwal dan diterima langsung di Hub Bawabawa Samarinda.$$,
    'Kuliner Viral',
    '6 min',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80',
    TRUE,
    NOW() - INTERVAL '1 day'
  ),
  (
    '22222222-2222-4222-8222-000000000002',
    'kenapa-in-parfume-bandung-selalu-antre-rekomendasi-aroma',
    'Kenapa In Parfume Bandung Selalu Antre Panjang? Ini Daftar Aroma Best-Seller & Cara Titipnya!',
    'Setiap lewat Jalan Banceuy atau Tamblong Bandung, antrean In Parfume selalu membludak. Simak rahasia ketahanan wanginya dan cara titip kirim ke kotamu.',
    $$## Fenomena Jastip In Parfume Fragrance Bandung

Siapa pun yang pernah melewati kawasan **Jalan Banceuy** atau **Tamblong** di Bandung pasti pernah melihat kerumunan orang yang memegang nomor antrean. Itulah **In Parfume Fragrance**, toko parfum *inspired* paling legendaris di Bandung.

### Kenapa Semua Orang Rela Antre?
1. **Ketahanan Wangi 24 Jam+:** Racikan konsentratnya terkenal sangat awet di baju maupun kulit.
2. **Ratusan Pilihan Aroma:** Mulai dari *Baccarat Rouge 540*, *Jo Malone English Pear & Freesia*, *YSL Libre*, *Black Opium*, *Dior Sauvage*, hingga *Creed Aventus*.
3. **Harga Terjangkau:** Tersedia ukuran **35ml**, **60ml**, hingga **100ml**.

### Cara Titip In Parfume di Bawabawa.id Tanpa Antre
Kamu tidak perlu berdiri 2 jam di Banceuy! Cukup buka menu **Katalog** di Bawabawa.id, pilih produk **In Parfume Fragrance Bandung**, pilih ukuran botol, dan **tulis aroma yang kamu inginkan di kolom catatan**. Bisa dikirim ke seluruh Jawa Barat maupun ikut Kloter Hub Samarinda!$$,
    'Barang & Lifestyle',
    '5 min',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=80',
    TRUE,
    NOW() - INTERVAL '2 days'
  ),
  (
    '22222222-2222-4222-8222-000000000003',
    'kuliner-cihapit-trunojoyo-bandung-seroja-bake-studio-bolen-makjay',
    'Tur Kuliner Hits Cihapit, Trunojoyo & Lengkong: Seroja Bake, Studio Bolen, hingga Kopi Makjay 1 Liter',
    'Panduan lengkap berburu jajanan anak muda Bandung paling skena tahun ini — dari tart singkong Cihapit sampai es kopi susu botol 1 liter Makmur Jaya.',
    $$## Kawasan Skena Kuliner Baru di Bandung

Bandung tidak pernah kehabisan ide kreatif. Saat ini, tiga titik yang paling ramai diburu penikmat kuliner adalah **Pasar Cihapit**, **Jalan Trunojoyo**, dan **Lengkong Besar**.

### 1. Seroja Bake (Cihapit & Ganesha)
Mengubah bahan tradisional seperti singkong, peuyeum, kenari, dan kapulaga menjadi *tart* serta *cheesecake* berkelas.

### 2. Studio Bolen (Jl. Trunojoyo — Exsport Space)
Menyajikan **Bolen Pisang Nipah** dengan gula aren asli di dalam ruang bertema futuristik. Sekalian mampir, kamu juga bisa titip tas pastel lucu dari **Exsport Space**!

### 3. Kopi Susu Makmur Jaya ("Makjay") Botol 1 Liter
Kopi susu *creamy* favorit warga Bandung yang tersedia dalam kemasan botol 1 Liter. Sangat cocok dijadikan stok ngopi di kulkas rumah atau kantor!$$,
    'Rekomendasi Bandung',
    '5 min',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
    TRUE,
    NOW() - INTERVAL '3 days'
  ),
  (
    '22222222-2222-4222-8222-000000000004',
    'jastip-bandung-ke-jawa-barat-jakarta-sameday-via-travel',
    'Jastip Bandung ke Jawa Barat & Jakarta Sameday via Travel: Pesan Siang, Malam Sudah Sampai!',
    'Tinggal di Garut, Tasik, Sumedang, Purwakarta, Cirebon, Bekasi, atau Jakarta? Sekarang kamu bisa menikmati roti dan kuliner segar Bandung di hari yang sama.',
    $$## Solusi Buat Kamu yang Tinggal 1–4 Jam dari Bandung

Banyak makanan viral Bandung seperti **Sapporo Soes**, **Seroja Bake**, **Roti Macan**, dan **Kopi Makjay** yang paling nikmat disantap selagi *fresh*. Kalau dikirim pakai ekspedisi reguler 3 hari, rasanya tentu berkurang.

Karena itulah **Bawabawa.id** membuka **Jalur 2: Pengiriman Cepat Jawa Barat & Jabodetabek via Shuttle Travel**!

### Kota Mana Saja yang Dilayani?
- **Priangan Timur:** Sumedang, Garut, Tasikmalaya, Ciamis.
- **Jabar Utara & Timur:** Purwakarta, Subang, Karawang, Cirebon, Majalengka, Indramayu.
- **Jabar Barat & Jabodetabek:** Cianjur, Sukabumi, Bogor, Depok, Bekasi, Tangerang, dan DKI Jakarta.

Tim kami membelikan pesananmu di Bandung pada pagi/siang hari, mengemasnya dengan aman, lalu menitipkannya ke armada Shuttle Travel (*Cititrans, DayTrans, Arnes, Pasteur Trans, Bhinneka, Primajasa*). Sore berangkat dari Bandung, malam hari sudah tiba di kotamu!$$,
    'Panduan Pengiriman',
    '4 min',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=80',
    TRUE,
    NOW() - INTERVAL '4 days'
  ),
  (
    '22222222-2222-4222-8222-000000000005',
    'cara-kerja-open-trip-jastip-bandung-hub-samarinda-kaltim',
    'Jadwal & Cara Kerja Open Trip Jastip Bandung → Hub Samarinda: Aman untuk Makanan & Barang!',
    'Kangen jajanan Bandung di Samarinda, Balikpapan, atau Tenggarong? Kenali sistem Hub Samarinda Bawabawa.id yang bikin ongkir hemat dan barang terjamin.',
    $$## Menghubungkan Bandung & Samarinda Lebih Dekat

Buat warga **Samarinda, Balikpapan, Tenggarong, dan Bontang**, mencari kuliner atau barang asli Bandung kini tidak perlu lagi bingung soal ongkir mahal atau barang rusak di jalan.

### Keunggulan Sistem Hub Samarinda Bawabawa.id:
1. **Dibelikan Langsung oleh Tim Bandung:** Kami yang keliling dan antre di toko-toko Bandung, memilihkan tanggal produksi paling baru, serta melakukan *vacuum pack* untuk makanan.
2. **Diterima oleh Partner Hub Samarinda:** Setibanya kloter pesawat/kargo di Samarinda, paketmu disortir dan dijaga di **Hub Bawabawa Samarinda**.
3. **Bisa Ambil di Hub (Gratis Ongkir Lokal) atau Diantar Kurir Samarinda:** Partner kami di Samarinda akan menghubungi WhatsApp kamu begitu paket mendarat. Kamu juga bisa membeli produk **Ready Stock di Hub Samarinda** tanpa menunggu jadwal kloter!$$,
    'Open Trip Samarinda',
    '5 min',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1000&q=80',
    TRUE,
    NOW() - INTERVAL '5 days'
  ),
  (
    '22222222-2222-4222-8222-000000000006',
    '5-cemilan-pedas-gurih-bandung-tahan-lama-basreng-mang-odod-batagor',
    '5 Cemilan Pedas & Gurih Khas Bandung yang Tahan Lama Buat Stok di Rumah (Basreng Daun Jeruk hingga Batagor Vacuum)',
    'Tim pencinta pedas dan gurih wajib merapat! Ini daftar cemilan Bandung yang awet berminggu-minggu dan aman dikirim ke seluruh Indonesia.',
    $$## Cemilan Bandung yang Awet & Bikin Nagih

Kalau kamu mencari titipan Bandung yang tahan lama untuk stok di kos, kantor, atau dikirim jauh ke Kalimantan Timur, 5 kuliner gurih ini adalah jawabannya:

1. **Basreng Sultan Daun Jeruk (No Atos):** Renyah, tidak keras sama sekali, dengan wangi daun jeruk segar dan cabai asli.
2. **Keripik Pedas Mang Odod Cimahi:** Keripik singkong bumbu basah/kering yang pedasnya bikin susah berhenti ngunyah.
3. **Batagor Kingsley & Burangrang Vacuum Frozen:** Sudah lengkap dengan bumbu kacang legendaris, tinggal goreng 5 menit di rumah.
4. **Seblak Coet & Baso Aci Instan Bandung:** Bumbu kencur dan cabai asli Bandung dalam kemasan praktis.
5. **Kue Marmer Warisan & Bagelen Kartika Sari:** Teman minum teh dan kopi yang awet di suhu ruang.$$,
    'Kuliner Viral',
    '4 min',
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    TRUE,
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT (slug) DO NOTHING;

-- 4. Seed Active Trips (Kloter Samarinda & Travel Jawa Barat) if none exist
DO $seed_trips$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM trips) THEN
    INSERT INTO trips (
      id, code, origin, destination, depart_at, arrive_estimate_at, po_closes_at,
      capacity_kg, booked_kg, base_fee, per_kg_fee, status, popular_categories, notes, is_published
    ) VALUES
      (
        '33333333-3333-4333-8333-000000000001',
        'BDO-SMD-KLOTER1',
        'Bandung',
        'Hub Samarinda (Kaltim)',
        NOW() + INTERVAL '4 days',
        NOW() + INTERVAL '5 days',
        NOW() + INTERVAL '3 days',
        60,
        24,
        20000,
        43000,
        'open',
        '["Roti Macan (Vacuum)", "Bolu Tjilaki 9", "Marmer Warisan", "Basreng Daun Jeruk", "In Parfume", "Batagor Vacuum"]'::jsonb,
        'Kloter rutin Bandung → Hub Samarinda. Bisa ambil di Hub Samarinda (Partner kami) atau diantar kurir lokal Samarinda/Balikpapan/Tenggarong.',
        TRUE
      ),
      (
        '33333333-3333-4333-8333-000000000002',
        'BDO-JABAR-TRAVEL',
        'Bandung',
        'Jawa Barat & Jabodetabek (Travel Sameday)',
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '18 hours',
        100,
        35,
        20000,
        15000,
        'open',
        '["Seroja Bake", "Sapporo Soes", "Roti Macan", "Roti Merak", "Studio Bolen", "Kopi Makjay 1L", "Rochi Mochi"]'::jsonb,
        'Pengiriman setiap sore via Shuttle Travel (Cititrans, DayTrans, Arnes, Pasteur Trans, Bhinneka) ke Garut, Tasik, Sumedang, Purwakarta, Cirebon, Bekasi & Jakarta.',
        TRUE
      ),
      (
        '33333333-3333-4333-8333-000000000003',
        'BDO-INSTANT-DAILY',
        'Bandung (Toko Viral)',
        'Bandung Raya Instant (Rumah/Hotel/Stasiun)',
        NOW() + INTERVAL '8 hours',
        NOW() + INTERVAL '10 hours',
        NOW() + INTERVAL '6 hours',
        50,
        15,
        15000,
        18000,
        'open',
        '["Semua Kuliner Fresh", "Jasa Antre Pagi", "Antar ke Hotel / Stasiun Whoosh"]'::jsonb,
        'Jasa antre & pengantaran instan hari yang sama khusus area Kota Bandung, Cimahi, Lembang, dan Jatinangor.',
        TRUE
      );
  END IF;
END
$seed_trips$;

-- 5. Seed Vouchers (including Partner Samarinda Referral Code BAWASMD)
DO $seed_vouchers$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vouchers') THEN
    INSERT INTO vouchers (
      id, code, discount_type, discount_value, max_discount_amount, min_order_amount,
      usage_limit, used_count, valid_from, valid_until, is_active, show_in_banner, banner_title
    ) VALUES
      (
        '44444444-4444-4444-8444-000000000001',
        'BAWASMD',
        'fixed',
        15000,
        15000,
        100000,
        500,
        12,
        NOW() - INTERVAL '7 days',
        NOW() + INTERVAL '180 days',
        TRUE,
        TRUE,
        'Kode Referral Hub Samarinda: Pakai kode BAWASMD hemat Rp 15.000 biaya jastip!'
      ),
      (
        '44444444-4444-4444-8444-000000000002',
        'KANGENBDG',
        'percentage',
        15,
        25000,
        150000,
        500,
        18,
        NOW() - INTERVAL '7 days',
        NOW() + INTERVAL '180 days',
        TRUE,
        FALSE,
        'Diskon 15% Jasa Titip untuk pesanan kuliner viral Bandung'
      )
    ON CONFLICT (code) DO NOTHING;
  END IF;
END
$seed_vouchers$;

-- 6. Seed Published Testimonials
DO $seed_testimonials$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM testimonials WHERE is_published = TRUE) THEN
    INSERT INTO testimonials (
      id, customer_name, city, rating, body, is_verified, is_published, published_at
    ) VALUES
      (
        '55555555-5555-4555-8555-000000000001',
        'Nadia Kusuma',
        'Samarinda',
        5,
        'Akhirnya kesampaian nyobain Roti Macan Cranberry Cheese & Bolu Pisang Tjilaki 9 di Samarinda! Di-vacuum rapi dari Bandung dan pas mendarat di Hub Samarinda langsung dikabarin admin buat diambil. Masih empuk banget!',
        TRUE,
        TRUE,
        NOW() - INTERVAL '2 days'
      ),
      (
        '55555555-5555-4555-8555-000000000002',
        'Reza Mahendra',
        'Garut (Via Travel)',
        5,
        'Titip Sapporo Soes, Rochi Roti Mochi, sama Kopi Makjay 1 Liter siang hari, sorenya langsung dikirim pakai travel ke Garut. Malam udah bisa dimakan bareng keluarga dalam keadaan dingin!',
        TRUE,
        TRUE,
        NOW() - INTERVAL '4 days'
      ),
      (
        '55555555-5555-4555-8555-000000000003',
        'Putri Maharani',
        'Samarinda',
        5,
        'Langganan nitip In Parfume Bandung sama Basreng Daun Jeruk lewat Bawabawa.id. Nggak perlu capek antre di Banceuy, tinggal tulis aroma di catatan dan bayar pakai QRIS langsung diproses.',
        TRUE,
        TRUE,
        NOW() - INTERVAL '6 days'
      ),
      (
        '55555555-5555-4555-8555-000000000004',
        'Dimas Aditya',
        'Bandung (Tamu Hotel)',
        5,
        'Menginap di hotel daerah Dago tapi malas antre pagi di Roti Merak dan Seroja Bake Cihapit. Untung ada layanan Bandung Instant Bawabawa, jam 11 siang udah diantar sampai lobi hotel!',
        TRUE,
        TRUE,
        NOW() - INTERVAL '8 days'
      );
  END IF;
END
$seed_testimonials$;
