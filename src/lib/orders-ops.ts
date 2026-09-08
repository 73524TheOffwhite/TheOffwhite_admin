export type OrderStatus = "preparing" | "ready" | "served" | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  note?: string;
};

export type CafeOrder = {
  id: string;
  tableNumber: number;
  guestName: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  placedAt: string;
  server?: string;
};

const STORAGE_KEY = "offwhite-ops-orders";

export function buildOpsSeedOrders(): CafeOrder[] {
  const now = Date.now();
  return [
    {
      id: "ord-1",
      tableNumber: 4,
      guestName: "Priya Mehta",
      status: "preparing",
      total: 1840,
      placedAt: new Date(now - 1000 * 60 * 8).toISOString(),
      server: "Ananya",
      items: [
        { id: "i1", name: "Flat White", qty: 2 },
        { id: "i2", name: "Avocado Toast", qty: 1, note: "No chili" },
        { id: "i3", name: "Seasonal Salad", qty: 1 },
      ],
    },
    {
      id: "ord-2",
      tableNumber: 4,
      guestName: "Priya Mehta",
      status: "ready",
      total: 420,
      placedAt: new Date(now - 1000 * 60 * 22).toISOString(),
      server: "Ananya",
      items: [{ id: "i4", name: "Tiramisu", qty: 2 }],
    },
    {
      id: "ord-3",
      tableNumber: 12,
      guestName: "Arjun Kapoor",
      status: "preparing",
      total: 3260,
      placedAt: new Date(now - 1000 * 60 * 5).toISOString(),
      server: "Dev",
      items: [
        { id: "i5", name: "Espresso Martini", qty: 3 },
        { id: "i6", name: "Truffle Fries", qty: 2 },
        { id: "i7", name: "Grilled Seabass", qty: 2 },
      ],
    },
    {
      id: "ord-4",
      tableNumber: 7,
      guestName: "Neha D'Souza",
      status: "served",
      total: 980,
      placedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      server: "Maya",
      items: [
        { id: "i8", name: "Matcha Latte", qty: 2 },
        { id: "i9", name: "Croissant", qty: 2 },
      ],
    },
    {
      id: "ord-5",
      tableNumber: 1,
      guestName: "Rohan Shah",
      status: "preparing",
      total: 1540,
      placedAt: new Date(now - 1000 * 60 * 3).toISOString(),
      server: "Dev",
      items: [
        { id: "i10", name: "Cappuccino", qty: 1 },
        { id: "i11", name: "Mushroom Risotto", qty: 1 },
        { id: "i12", name: "Sparkling Water", qty: 1 },
      ],
    },
    {
      id: "ord-6",
      tableNumber: 12,
      guestName: "Sara Khan",
      status: "ready",
      total: 760,
      placedAt: new Date(now - 1000 * 60 * 14).toISOString(),
      server: "Dev",
      items: [
        { id: "i13", name: "Affogato", qty: 2 },
        { id: "i14", name: "Chocolate Fondant", qty: 1 },
      ],
    },
    {
      id: "ord-7",
      tableNumber: 9,
      guestName: "Vikram Patel",
      status: "cancelled",
      total: 640,
      placedAt: new Date(now - 1000 * 60 * 60).toISOString(),
      server: "Maya",
      items: [{ id: "i15", name: "Club Sandwich", qty: 2 }],
    },
    {
      id: "ord-8",
      tableNumber: 3,
      guestName: "Amelia Rao",
      status: "served",
      total: 1120,
      placedAt: new Date(now - 1000 * 60 * 70).toISOString(),
      server: "Ananya",
      items: [
        { id: "i16", name: "Pour Over", qty: 1 },
        { id: "i17", name: "Eggs Benedict", qty: 1 },
      ],
    },
  ];
}

export function loadOpsOrders(): CafeOrder[] {
  if (typeof window === "undefined") return buildOpsSeedOrders();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildOpsSeedOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as CafeOrder[];
  } catch {
    return buildOpsSeedOrders();
  }
}

export function saveOpsOrders(list: CafeOrder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export type TableGroup = {
  tableNumber: number;
  guestNames: string[];
  orders: CafeOrder[];
  activeCount: number;
  total: number;
};

export function groupOrdersByTable(orders: CafeOrder[]): TableGroup[] {
  const map = new Map<number, CafeOrder[]>();
  for (const order of orders) {
    const list = map.get(order.tableNumber) ?? [];
    list.push(order);
    map.set(order.tableNumber, list);
  }

  return Array.from(map.entries())
    .map(([tableNumber, tableOrders]) => {
      const sorted = [...tableOrders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
      const names = Array.from(new Set(sorted.map((o) => o.guestName)));
      const active = sorted.filter((o) => o.status === "preparing" || o.status === "ready");
      return {
        tableNumber,
        guestNames: names,
        orders: sorted,
        activeCount: active.length,
        total: sorted.reduce((sum, o) => sum + (o.status === "cancelled" ? 0 : o.total), 0),
      };
    })
    .sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount;
      return a.tableNumber - b.tableNumber;
    });
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type OrderStats = {
  openTables: number;
  preparing: number;
  ready: number;
  tickets: number;
};

export function computeOrderStats(orders: CafeOrder[]): OrderStats {
  const active = orders.filter((o) => o.status === "preparing" || o.status === "ready");
  const openTables = new Set(active.map((o) => o.tableNumber)).size;
  return {
    openTables,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    tickets: orders.filter((o) => o.status !== "cancelled").length,
  };
}
