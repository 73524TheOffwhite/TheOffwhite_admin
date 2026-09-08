import { useSyncExternalStore } from "react";

export type TimeSlot = {
  id: string;
  label: string;
  /** Optional: empty = all locations */
  locationIds: string[];
};

export type BlackoutDate = {
  id: string;
  date: string;
  /** Empty = all locations */
  locationIds: string[];
  note: string;
};

export type AvailabilitySettings = {
  timeSlots: TimeSlot[];
  maxGuests: number;
  blackouts: BlackoutDate[];
};

const DEFAULT_SLOTS = [
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM",
  "10:30 PM",
  "11:00 PM",
];

export const DEFAULT_AVAILABILITY: AvailabilitySettings = {
  timeSlots: DEFAULT_SLOTS.map((label, i) => ({
    id: `slot-${i + 1}`,
    label,
    locationIds: [],
  })),
  maxGuests: 12,
  blackouts: [
    {
      id: "bo-1",
      date: "2026-08-15",
      locationIds: [],
      note: "Independence Day — closed",
    },
  ],
};

let availability = structuredClone(DEFAULT_AVAILABILITY);
let savedSnapshot = JSON.stringify(availability);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getAvailability() {
  return availability;
}

export function setAvailability(
  next: AvailabilitySettings | ((prev: AvailabilitySettings) => AvailabilitySettings),
) {
  availability = typeof next === "function" ? next(availability) : next;
  emit();
}

export function isAvailabilityDirty() {
  return JSON.stringify(availability) !== savedSnapshot;
}

export function saveAvailability() {
  savedSnapshot = JSON.stringify(availability);
  emit();
}

/** Replace in-memory state and mark clean (used after load/save from Supabase). */
export function hydrateAvailability(next: AvailabilitySettings) {
  availability = structuredClone(next);
  savedSnapshot = JSON.stringify(availability);
  emit();
}

export function subscribeAvailability(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSharedAvailability() {
  const data = useSyncExternalStore(subscribeAvailability, getAvailability, getAvailability);
  const dirty = useSyncExternalStore(subscribeAvailability, isAvailabilityDirty, () => false);
  return {
    availability: data,
    setAvailability,
    dirty,
    save: saveAvailability,
  };
}
