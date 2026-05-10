import type { Trip } from "@/lib/types";

const day = (offset: number, hour = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const trips: Trip[] = [
  {
    id: "t-1",
    code: "BDG-SMD-241",
    origin: "Bandung",
    destination: "Samarinda",
    departAt: day(2, 8),
    arriveEstimateAt: day(5, 19),
    capacityKg: 80,
    bookedKg: 32,
    status: "scheduled",
    popularCategories: ["Fashion", "Skincare", "Snack Bandung"],
    shopper: { name: "Rani Maharani", rating: 4.95, trips: 124 },
    baseFee: 25000,
    perKgFee: 18000,
  },
  {
    id: "t-2",
    code: "BDG-SMD-242",
    origin: "Bandung",
    destination: "Samarinda",
    departAt: day(5, 9),
    arriveEstimateAt: day(8, 20),
    capacityKg: 120,
    bookedKg: 118,
    status: "scheduled",
    popularCategories: ["Sepatu", "Tas", "Kosmetik"],
    shopper: { name: "Dimas Pratama", rating: 4.88, trips: 98 },
    baseFee: 25000,
    perKgFee: 18000,
  },
  {
    id: "t-3",
    code: "BDG-SMD-243",
    origin: "Bandung",
    destination: "Samarinda",
    departAt: day(7, 7),
    arriveEstimateAt: day(10, 18),
    capacityKg: 100,
    bookedKg: 100,
    status: "fullbooked",
    popularCategories: ["Hijab", "Outfit Anak", "Sepatu Brand"],
    shopper: { name: "Citra Ayu", rating: 4.99, trips: 211 },
    baseFee: 25000,
    perKgFee: 18000,
  },
  {
    id: "t-4",
    code: "BDG-SMD-244",
    origin: "Bandung",
    destination: "Samarinda",
    departAt: day(10, 8),
    arriveEstimateAt: day(13, 19),
    capacityKg: 150,
    bookedKg: 24,
    status: "scheduled",
    popularCategories: ["Elektronik", "Fashion", "Buku"],
    shopper: { name: "Bagas Ramadhan", rating: 4.92, trips: 67 },
    baseFee: 25000,
    perKgFee: 18000,
  },
  {
    id: "t-5",
    code: "BDG-SMD-240",
    origin: "Bandung",
    destination: "Samarinda",
    departAt: day(-2, 8),
    arriveEstimateAt: day(1, 19),
    capacityKg: 100,
    bookedKg: 92,
    status: "in_transit",
    popularCategories: ["Skincare", "Outfit", "Snack"],
    shopper: { name: "Rani Maharani", rating: 4.95, trips: 124 },
    baseFee: 25000,
    perKgFee: 18000,
  },
];

export function findTrip(id: string) {
  return trips.find((t) => t.id === id);
}
