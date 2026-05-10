export const revenueLast14Days = [
  { day: "26", value: 5_400_000 },
  { day: "27", value: 6_100_000 },
  { day: "28", value: 7_320_000 },
  { day: "29", value: 6_800_000 },
  { day: "30", value: 8_120_000 },
  { day: "1", value: 9_280_000 },
  { day: "2", value: 9_900_000 },
  { day: "3", value: 11_240_000 },
  { day: "4", value: 10_500_000 },
  { day: "5", value: 12_840_000 },
  { day: "6", value: 13_120_000 },
  { day: "7", value: 11_980_000 },
  { day: "8", value: 14_260_000 },
  { day: "9", value: 15_840_000 },
];

export const ordersByCategory = [
  { name: "Fashion", value: 38 },
  { name: "Skincare", value: 22 },
  { name: "Snack", value: 14 },
  { name: "Hijab", value: 12 },
  { name: "Tas/Sepatu", value: 9 },
  { name: "Lainnya", value: 5 },
];

export const liveActivity = [
  { id: "a-1", text: "Aulia P. baru saja membuat request — 2 item", at: "baru saja" },
  { id: "a-2", text: "Trip BDG-SMD-241 menambah 3 slot kapasitas", at: "1m" },
  { id: "a-3", text: "Reza H. menyelesaikan pembayaran QRIS", at: "2m" },
  { id: "a-4", text: "Personal Shopper Rani sedang belanja di Pasar Baru", at: "4m" },
  { id: "a-5", text: "Maya L. menambah item ke wishlist", at: "6m" },
  { id: "a-6", text: "Bayu S. memberi rating 5★ untuk trip BDG-SMD-238", at: "8m" },
];

export const topShoppers = [
  { name: "Citra Ayu", trips: 211, rating: 4.99 },
  { name: "Rani Maharani", trips: 124, rating: 4.95 },
  { name: "Dimas Pratama", trips: 98, rating: 4.88 },
  { name: "Bagas Ramadhan", trips: 67, rating: 4.92 },
];

export const erpSyncEvents = [
  { id: "s-1", at: "12s lalu", type: "order.created", entity: "BWB-QQ77N9", status: "ok" },
  { id: "s-2", at: "27s lalu", type: "invoice.posted", entity: "INV-2025-0044", status: "ok" },
  { id: "s-3", at: "1m lalu", type: "shipment.update", entity: "BWB-AX42K1", status: "ok" },
  { id: "s-4", at: "3m lalu", type: "payment.reconcile", entity: "INV-2025-0043", status: "ok" },
  { id: "s-5", at: "6m lalu", type: "trip.update", entity: "BDG-SMD-241", status: "ok" },
  { id: "s-6", at: "9m lalu", type: "customer.upsert", entity: "c-3", status: "retry" },
];

export const adminUsers = [
  { id: "u-1", name: "Indra Permana", email: "indra@bawabawa.id", role: "owner", lastActive: "online" },
  { id: "u-2", name: "Salsa Aprilia", email: "salsa@bawabawa.id", role: "operations", lastActive: "5m" },
  { id: "u-3", name: "Yoga Mahendra", email: "yoga@bawabawa.id", role: "finance", lastActive: "12m" },
  { id: "u-4", name: "Tika Wahyuni", email: "tika@bawabawa.id", role: "support", lastActive: "1h" },
  { id: "u-5", name: "Rani Maharani", email: "rani@bawabawa.id", role: "shopper", lastActive: "online" },
];
