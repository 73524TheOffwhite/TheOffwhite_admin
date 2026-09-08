import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type ContactEnquiry = {
  id: string;
  name: string;
  email: string;
  occasion: string;
  date: string;
  guests: string;
  message: string;
  type: "private_event" | "level5_booking";
  status: "new" | "replied" | "closed";
  createdAt: string;
};

export type ContactContent = {
  hero: {
    image: MediaRef;
    headline: string;
    body: string;
  };
  infoLabels: {
    location: string;
    phone: string;
    email: string;
    hours: string;
  };
  map: {
    pinLabel: string;
    iframeTitle: string;
  };
  reservePanel: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    body: string;
    button: LinkButton;
  };
  enquiryPanel: {
    background: MediaRef;
    leafDecor: MediaRef;
    eyebrow: string;
    headline: string;
    body: string;
  };
  form: {
    namePlaceholder: string;
    emailPlaceholder: string;
    occasionPlaceholder: string;
    datePlaceholder: string;
    guestsPlaceholder: string;
    messagePlaceholder: string;
    submitLabel: string;
    loadingText: string;
    errorMessage: string;
    successHeadline: string;
    successBodyTemplate: string;
  };
};

export const CONTACT_SECTIONS = [
  { id: "settings", label: "Site settings", priority: "High" as const },
  { id: "hero", label: "Hero & info", priority: "High" as const },
  { id: "map", label: "Map", priority: "High" as const },
  { id: "panels", label: "Reserve & enquiry", priority: "High" as const },
  { id: "form", label: "Enquiry form", priority: "Medium" as const },
  { id: "inbox", label: "Enquiries inbox", priority: "High" as const },
] as const;

export const DEFAULT_CONTACT: ContactContent = {
  hero: {
    image: { name: "contact-hero.png" },
    headline: "Contact Us",
    body: "We'd love to hear from you. Reach out for reservations, events or any inquiries.",
  },
  infoLabels: {
    location: "Location",
    phone: "Phone",
    email: "Email",
    hours: "Hours",
  },
  map: {
    pinLabel: "The Off White",
    iframeTitle: "The Off White Bar & Grill on map — Navelim, Goa",
  },
  reservePanel: {
    image: { name: "contact-reserve.png" },
    eyebrow: "Plan Your Evening",
    headline: "Reserve a Table",
    body: "Great food, warm light and even better company.",
    button: { label: "Reserve a Table", href: "/events" },
  },
  enquiryPanel: {
    background: { name: "contact-enquiry-bg.png" },
    leafDecor: { name: "contact-enquiry-leaf.png" },
    eyebrow: "Private Enquiry",
    headline: "Hosting something special?",
    body: "Tell us about your occasion — date, guest count, and the mood you're after. Our team will respond within 24 hours with a proposal tailored to you.",
  },
  form: {
    namePlaceholder: "Your Name",
    emailPlaceholder: "Email",
    occasionPlaceholder: "Occasion",
    datePlaceholder: "dd-mm-yyyy",
    guestsPlaceholder: "Approx. guests",
    messagePlaceholder: "Tell us a little about what you're planning...",
    submitLabel: "Send Enquiry",
    loadingText: "Sending…",
    errorMessage: "Please complete all required fields.",
    successHeadline: "Enquiry Received",
    successBodyTemplate:
      "Thank you, {name}. Our events team will respond within 24 hours.",
  },
};

export const DEFAULT_CONTACT_ENQUIRIES: ContactEnquiry[] = [
  {
    id: "ce-1",
    name: "Meera Shah",
    email: "meera@example.com",
    occasion: "Anniversary dinner",
    date: "2026-08-18",
    guests: "12",
    message: "Looking for a quiet corner on Level 4.",
    type: "private_event",
    status: "new",
    createdAt: "2026-07-22T14:10:00Z",
  },
  {
    id: "ce-2",
    name: "Rohit Nair",
    email: "rohit@brand.co",
    occasion: "Level 5 Event",
    date: "2026-09-05",
    guests: "40",
    message: "Brand launch — need AV and bar package.",
    type: "level5_booking",
    status: "replied",
    createdAt: "2026-07-21T09:30:00Z",
  },
];
