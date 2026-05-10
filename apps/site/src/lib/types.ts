export type TripStatus = "scheduled" | "boarding" | "in_transit" | "delivered" | "fullbooked" | "closed";

export type Trip = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  departAt: string; // ISO
  arriveEstimateAt: string; // ISO
  capacityKg: number;
  bookedKg: number;
  status: TripStatus;
  popularCategories: string[];
  shopper: {
    name: string;
    avatar?: string;
    rating: number;
    trips: number;
  };
  baseFee: number;
  perKgFee: number;
};

export type OrderStatus =
  | "request_received"
  | "shopper_assigned"
  | "purchasing"
  | "packed"
  | "departed_origin"
  | "in_transit"
  | "arrived_destination"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  category: string;
  link?: string;
  imageUrl?: string;
  qty: number;
  estPriceMin: number;
  estPriceMax: number;
  notes?: string;
};

export type Order = {
  id: string;
  code: string;
  customer: {
    id: string;
    name: string;
    avatar?: string;
    city: string;
  };
  tripId?: string;
  items: OrderItem[];
  itemsTotalEst: number;
  jastipFee: number;
  localShipping: number;
  paymentMethod?: "qris" | "transfer" | "ewallet" | "cod";
  total: number;
  status: OrderStatus;
  createdAt: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
  destAddress: {
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    postal: string;
  };
  paid: boolean;
  invoiceId?: string;
};

export type Customer = {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  city: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "vip" | "inactive";
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  type: "order" | "trip" | "promo" | "system";
};

export type AdminRole = "owner" | "operations" | "finance" | "support" | "shopper";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  lastActive: string;
};
