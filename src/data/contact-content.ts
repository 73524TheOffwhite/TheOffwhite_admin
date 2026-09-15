import type { LinkButton, MediaRef } from "@/data/homepage-content";

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
] as const;

/** Defaults match live theoffwhite.com/contact (copy + asset filenames). */
export const DEFAULT_CONTACT: ContactContent = {
  hero: {
    image: { name: "contact-hero.jpg" },
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
    image: { name: "contact-reserve.jpg" },
    eyebrow: "Plan Your Evening",
    headline: "Reserve a Table",
    body: "Great food, warm light and even better company.",
    button: { label: "Reserve a Table", href: "/events" },
  },
  enquiryPanel: {
    background: { name: "contact-enquiry-bg.jpg" },
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
