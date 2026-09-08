import { useSyncExternalStore } from "react";

export type SiteSettings = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phoneDisplay: string;
  phonePrimary: string;
  emailPrimary: string;
  hoursText: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  enquiryConfirmationMessage: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  addressLine1: "Sitara Atrium, 4th Floor, Sitara Building",
  addressLine2: "Colmorod, Navelim Highway, Sanscar Society",
  city: "Madgaon, Navelim",
  state: "Goa",
  pincode: "403601",
  phoneDisplay: "+91 87678 11778",
  phonePrimary: "+918767811778",
  emailPrimary: "hello@theoffwhite.in",
  hoursText: "12:00 PM – 11:00 PM (All Days)",
  googleMapsUrl: "https://maps.app.goo.gl/jvHLryG1k2ZpDUfQ6",
  googleMapsEmbedUrl:
    "https://maps.google.com/maps?q=15.2619293,73.9632973&z=17&ie=UTF8&output=embed",
  enquiryConfirmationMessage:
    "Thank you! Your enquiry has been received. Our events team will respond within 24 hours.",
};

let settings = structuredClone(DEFAULT_SITE_SETTINGS);
let savedSnapshot = JSON.stringify(settings);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getSiteSettings() {
  return settings;
}

export function setSiteSettings(
  next: SiteSettings | ((prev: SiteSettings) => SiteSettings),
) {
  settings = typeof next === "function" ? next(settings) : next;
  emit();
}

export function isSiteSettingsDirty() {
  return JSON.stringify(settings) !== savedSnapshot;
}

export function saveSiteSettings() {
  savedSnapshot = JSON.stringify(settings);
  emit();
}

/** Replace in-memory state and mark clean (used after load/save from Supabase). */
export function hydrateSiteSettings(next: SiteSettings) {
  settings = structuredClone(next);
  savedSnapshot = JSON.stringify(settings);
  emit();
}

export function subscribeSiteSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSharedSiteSettings() {
  const data = useSyncExternalStore(subscribeSiteSettings, getSiteSettings, getSiteSettings);
  const dirty = useSyncExternalStore(subscribeSiteSettings, isSiteSettingsDirty, () => false);
  return {
    settings: data,
    setSettings: setSiteSettings,
    dirty,
    save: saveSiteSettings,
  };
}
