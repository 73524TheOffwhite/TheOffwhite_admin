import { format, isSameDay, parseISO } from "date-fns";
import {
  DEFAULT_INBOX,
  DEFAULT_RESERVATIONS,
  type ReservationSubmission,
} from "@/data/reservations-content";

const STORAGE_KEY = "offwhite-ops-reservations";

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

/** Seed inbox with live-looking bookings around today. */
export function buildOpsSeedInbox(): ReservationSubmission[] {
  const today = todayISO();
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

  return [
    {
      id: "ops-1",
      name: "Priya Mehta",
      phone: "9876543210",
      date: today,
      time: "8:00 PM",
      guests: 4,
      locationId: "level4",
      occasion: "Anniversary",
      specialRequest: "Window seat if possible",
      source: "events_full",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    },
    {
      id: "ops-2",
      name: "Arjun Kapoor",
      phone: "9123456780",
      date: today,
      time: "7:30 PM",
      guests: 6,
      locationId: "level5",
      occasion: "Birthday",
      specialRequest: "",
      source: "events_full",
      status: "confirmed",
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: "ops-3",
      name: "Neha D'Souza",
      phone: "9988776655",
      date: today,
      time: "1:00 PM",
      guests: 2,
      locationId: "level4",
      occasion: "",
      specialRequest: "Vegetarian only",
      source: "home_mini",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: "ops-4",
      name: "Rohan Shah",
      phone: "9811122233",
      date: today,
      time: "9:00 PM",
      guests: 3,
      locationId: "level4",
      occasion: "Corporate",
      specialRequest: "Quiet corner",
      source: "home_mini",
      status: "confirmed",
      createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    },
    {
      id: "ops-5",
      name: "Sara Khan",
      phone: "9001122334",
      date: tomorrow,
      time: "8:30 PM",
      guests: 8,
      locationId: "level5",
      occasion: "Birthday",
      specialRequest: "Cake cutting at 9",
      source: "events_full",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
    {
      id: "ops-6",
      name: "Vikram Patel",
      phone: "9765432109",
      date: yesterday,
      time: "7:00 PM",
      guests: 5,
      locationId: "level4",
      occasion: "Special Occasion",
      specialRequest: "",
      source: "events_full",
      status: "cancelled",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    },
    ...DEFAULT_INBOX,
  ];
}

export function loadOpsReservations(): ReservationSubmission[] {
  if (typeof window === "undefined") return buildOpsSeedInbox();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildOpsSeedInbox();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as ReservationSubmission[];
  } catch {
    return buildOpsSeedInbox();
  }
}

export function saveOpsReservations(list: ReservationSubmission[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function locationLabel(locationId: string) {
  return (
    DEFAULT_RESERVATIONS.step1.locations.find((l) => l.id === locationId)?.label ??
    locationId
  );
}

export function tablesForGuests(guests: number) {
  return Math.max(1, Math.ceil(guests / 4));
}

export function isReservationOnDay(row: ReservationSubmission, day: Date) {
  try {
    return isSameDay(parseISO(row.date), day);
  } catch {
    return false;
  }
}

export type OpsStats = {
  waiting: number;
  confirmedToday: number;
  tablesBooked: number;
  covers: number;
  cancelledToday: number;
};

export function computeOpsStats(list: ReservationSubmission[], day = new Date()): OpsStats {
  const dayRows = list.filter((r) => isReservationOnDay(r, day));
  const waiting = list.filter((r) => r.status === "pending").length;
  const confirmedToday = dayRows.filter((r) => r.status === "confirmed").length;
  const activeToday = dayRows.filter((r) => r.status === "confirmed" || r.status === "pending");
  const tablesBooked = activeToday.reduce((sum, r) => sum + tablesForGuests(r.guests), 0);
  const covers = activeToday.reduce((sum, r) => sum + r.guests, 0);
  const cancelledToday = dayRows.filter((r) => r.status === "cancelled").length;
  return { waiting, confirmedToday, tablesBooked, covers, cancelledToday };
}
