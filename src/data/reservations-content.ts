import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type LocationOption = {
  id: string;
  label: string;
  sub: string;
};

export type OccasionChip = {
  id: string;
  label: string;
};

export type ReservationSubmission = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  locationId: string;
  occasion: string;
  specialRequest: string;
  source: "events_full" | "home_mini";
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

export type ReservationsContent = {
  hero: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    tagline: string;
    button1Label: string;
    button2Label: string;
    trustLine: string;
  };
  steps: {
    step1Label: string;
    step2Label: string;
  };
  step1: {
    title: string;
    continueLabel: string;
    unavailableMessage: string;
    locations: LocationOption[];
    occasions: OccasionChip[];
  };
  step2: {
    headline: string;
    body: string;
    summaryTitle: string;
    editButtonLabel: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    specialRequestPlaceholder: string;
    submitLabel: string;
    loadingText: string;
    whatsappAltLabel: string;
    errorMessage: string;
  };
  success: {
    headline: string;
    bodyTemplate: string;
  };
  settings: {
    whatsappNumber: string;
    whatsappDisplay: string;
    whatsappPrefill: string;
    confirmationMessage: string;
  };
};

export const RESERVATIONS_SECTIONS = [
  { id: "hero", label: "Hero", priority: "High" as const },
  { id: "steps", label: "Step copy", priority: "Medium" as const },
  { id: "availability", label: "Availability", priority: "High" as const },
  { id: "locations", label: "Locations & occasions", priority: "High" as const },
  { id: "success", label: "Success & WhatsApp", priority: "Medium" as const },
  { id: "inbox", label: "Inbox", priority: "High" as const },
] as const;

export const DEFAULT_RESERVATIONS: ReservationsContent = {
  hero: {
    image: { name: "offwhite-dining-pano.png" },
    eyebrow: "Reservations",
    headline: "Reserve A Table",
    tagline: "Good food. Warm ambience. Memories to be made.",
    button1Label: "Book Your Table",
    button2Label: "WhatsApp Concierge",
    trustLine: "Your details are safe with us",
  },
  steps: {
    step1Label: "Book Your Table",
    step2Label: "Confirm & Reserve",
  },
  step1: {
    title: "Book Your Table",
    continueLabel: "Continue to Confirm",
    unavailableMessage: "Reservations are unavailable for the selected date.",
    locations: [
      { id: "level4", label: "LEVEL 4", sub: "Fine Dining & Bar" },
      { id: "level5", label: "LEVEL 5", sub: "Events & Parties" },
    ],
    occasions: [
      { id: "occ-1", label: "Birthday" },
      { id: "occ-2", label: "Anniversary" },
      { id: "occ-3", label: "Special Occasion" },
      { id: "occ-4", label: "Corporate" },
    ],
  },
  step2: {
    headline: "Almost There!",
    body: "Please confirm your details so we can hold your table.",
    summaryTitle: "Your Booking",
    editButtonLabel: "Edit Details",
    namePlaceholder: "Your Name",
    phonePlaceholder: "+91 + Your phone number",
    specialRequestPlaceholder: "Any dietary needs, seating preferences…",
    submitLabel: "Confirm Reservation",
    loadingText: "Confirming…",
    whatsappAltLabel: "Reserve via WhatsApp {phone}",
    errorMessage: "Please check your details and try again.",
  },
  success: {
    headline: "Reservation Received",
    bodyTemplate:
      "Thank you, {name}. We'll confirm your table for {date} at {time} shortly via +91 {phone}.",
  },
  settings: {
    whatsappNumber: "918767811778",
    whatsappDisplay: "+91 87678 11778",
    whatsappPrefill: "Hi, I'd like to reserve a table at The Off White.",
    confirmationMessage:
      "Thank you for your reservation. We'll confirm your table shortly.",
  },
};

export const DEFAULT_INBOX: ReservationSubmission[] = [
  {
    id: "res-1",
    name: "Priya Mehta",
    phone: "9876543210",
    date: "2026-08-02",
    time: "8:00 PM",
    guests: 4,
    locationId: "level4",
    occasion: "Anniversary",
    specialRequest: "Window seat if possible",
    source: "events_full",
    status: "pending",
    createdAt: "2026-07-22T10:12:00Z",
  },
  {
    id: "res-2",
    name: "Arjun Kapoor",
    phone: "9123456780",
    date: "2026-08-05",
    time: "7:30 PM",
    guests: 8,
    locationId: "level5",
    occasion: "Birthday",
    specialRequest: "",
    source: "events_full",
    status: "confirmed",
    createdAt: "2026-07-21T16:40:00Z",
  },
  {
    id: "res-3",
    name: "Neha D'Souza",
    phone: "9988776655",
    date: "2026-07-28",
    time: "1:00 PM",
    guests: 2,
    locationId: "level4",
    occasion: "",
    specialRequest: "Vegetarian only",
    source: "home_mini",
    status: "pending",
    createdAt: "2026-07-22T08:05:00Z",
  },
];
