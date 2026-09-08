import type { MediaRef } from "@/data/homepage-content";
import { DEFAULT_CONTACT, type ContactContent } from "@/data/contact-content";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  hydrateSiteSettings,
} from "@/data/shared-site-settings";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const CONTACT_PAGE_SLUG = "contact";

export type ContactCmsBundle = {
  content: ContactContent;
  settings: SiteSettings;
  pageId?: string;
};

type ContactSections = {
  infoLabels?: ContactContent["infoLabels"];
  map?: ContactContent["map"];
  reservePanel?: ContactContent["reservePanel"];
  enquiryPanel?: ContactContent["enquiryPanel"];
  form?: ContactContent["form"];
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: ContactSections | null;
};

const SETTINGS_KEYS = [
  "address_line1",
  "address_line2",
  "city",
  "state",
  "pincode",
  "phone_display",
  "phone_primary",
  "email_primary",
  "contact_hours_text",
  "google_maps_url",
  "google_maps_embed_url",
  "enquiry_confirmation_message",
] as const;

function asMedia(input?: MediaRef | null, fallbackName = "image.jpg"): MediaRef {
  if (!input) return { name: fallbackName };
  const path = input.path;
  const previewUrl =
    input.previewUrl ||
    (path ? optimizedMediaUrl(path, { width: 960, quality: 72 }) : publicMediaUrl(path));
  return {
    name: input.name || fallbackName,
    path,
    previewUrl,
  };
}

function mediaPath(media?: MediaRef | null) {
  if (!media) return null;
  if (media.path) return media.path;
  if (media.previewUrl && !media.previewUrl.startsWith("blob:") && !media.previewUrl.startsWith("data:")) {
    return media.previewUrl;
  }
  return null;
}

function serializeMedia(media: MediaRef): MediaRef {
  return {
    name: media.name,
    path: mediaPath(media) || undefined,
    previewUrl: publicMediaUrl(mediaPath(media)) || media.previewUrl,
  };
}

function settingsFromRows(
  rows: Array<{ key: string; value: string }> | null | undefined,
): SiteSettings {
  const map = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  return {
    addressLine1: map.address_line1 || DEFAULT_SITE_SETTINGS.addressLine1,
    addressLine2: map.address_line2 || DEFAULT_SITE_SETTINGS.addressLine2,
    city: map.city || DEFAULT_SITE_SETTINGS.city,
    state: map.state || DEFAULT_SITE_SETTINGS.state,
    pincode: map.pincode || DEFAULT_SITE_SETTINGS.pincode,
    phoneDisplay: map.phone_display || DEFAULT_SITE_SETTINGS.phoneDisplay,
    phonePrimary: map.phone_primary || DEFAULT_SITE_SETTINGS.phonePrimary,
    emailPrimary: map.email_primary || DEFAULT_SITE_SETTINGS.emailPrimary,
    hoursText: map.contact_hours_text || DEFAULT_SITE_SETTINGS.hoursText,
    googleMapsUrl: map.google_maps_url || DEFAULT_SITE_SETTINGS.googleMapsUrl,
    googleMapsEmbedUrl: map.google_maps_embed_url || DEFAULT_SITE_SETTINGS.googleMapsEmbedUrl,
    enquiryConfirmationMessage:
      map.enquiry_confirmation_message || DEFAULT_SITE_SETTINGS.enquiryConfirmationMessage,
  };
}

async function loadSiteSettingsFromDb(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("key,value").in("key", [...SETTINGS_KEYS]);
  return settingsFromRows(data as Array<{ key: string; value: string }> | null);
}

async function saveSiteSettingsToDb(settings: SiteSettings) {
  const rows = [
    { key: "address_line1", value: settings.addressLine1, description: "Address line 1" },
    { key: "address_line2", value: settings.addressLine2, description: "Address line 2" },
    { key: "city", value: settings.city, description: "City" },
    { key: "state", value: settings.state, description: "State" },
    { key: "pincode", value: settings.pincode, description: "Pincode" },
    { key: "phone_display", value: settings.phoneDisplay, description: "Display phone" },
    { key: "phone_primary", value: settings.phonePrimary, description: "Primary phone" },
    { key: "email_primary", value: settings.emailPrimary, description: "Primary email" },
    { key: "contact_hours_text", value: settings.hoursText, description: "Contact hours" },
    { key: "google_maps_url", value: settings.googleMapsUrl, description: "Google Maps URL" },
    {
      key: "google_maps_embed_url",
      value: settings.googleMapsEmbedUrl,
      description: "Google Maps embed URL",
    },
    {
      key: "enquiry_confirmation_message",
      value: settings.enquiryConfirmationMessage,
      description: "Enquiry confirmation message",
    },
  ];

  for (const row of rows) {
    const { error } = await supabase.from("site_settings").update({ value: row.value }).eq("key", row.key);
    if (error) {
      const { error: upsertError } = await supabase.from("site_settings").upsert(row, { onConflict: "key" });
      if (upsertError) throw new Error(upsertError.message || error.message);
    }
  }
}

export async function loadContactCms(): Promise<ContactCmsBundle> {
  const [{ data: page, error }, settings] = await Promise.all([
    supabase.from("page_content").select("*").eq("slug", CONTACT_PAGE_SLUG).maybeSingle(),
    loadSiteSettingsFromDb(),
  ]);

  if (error) throw new Error(error.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as ContactSections;

  const content: ContactContent = {
    hero: {
      image: asMedia(
        {
          name: row?.hero_image_path?.split("/").pop() || DEFAULT_CONTACT.hero.image.name,
          path: row?.hero_image_path || undefined,
        },
        DEFAULT_CONTACT.hero.image.name,
      ),
      headline: row?.hero_title || DEFAULT_CONTACT.hero.headline,
      body: row?.hero_description || DEFAULT_CONTACT.hero.body,
    },
    infoLabels: sections.infoLabels || DEFAULT_CONTACT.infoLabels,
    map: sections.map || DEFAULT_CONTACT.map,
    reservePanel: {
      ...(sections.reservePanel || DEFAULT_CONTACT.reservePanel),
      image: asMedia(
        sections.reservePanel?.image || DEFAULT_CONTACT.reservePanel.image,
        DEFAULT_CONTACT.reservePanel.image.name,
      ),
      button: sections.reservePanel?.button || DEFAULT_CONTACT.reservePanel.button,
    },
    enquiryPanel: {
      ...(sections.enquiryPanel || DEFAULT_CONTACT.enquiryPanel),
      background: asMedia(
        sections.enquiryPanel?.background || DEFAULT_CONTACT.enquiryPanel.background,
        DEFAULT_CONTACT.enquiryPanel.background.name,
      ),
      leafDecor: asMedia(
        sections.enquiryPanel?.leafDecor || DEFAULT_CONTACT.enquiryPanel.leafDecor,
        DEFAULT_CONTACT.enquiryPanel.leafDecor.name,
      ),
    },
    form: sections.form || DEFAULT_CONTACT.form,
  };

  return { content, settings, pageId: row?.id };
}

export async function saveContactCms(bundle: ContactCmsBundle) {
  const sections: ContactSections = {
    infoLabels: bundle.content.infoLabels,
    map: bundle.content.map,
    reservePanel: {
      ...bundle.content.reservePanel,
      image: serializeMedia(bundle.content.reservePanel.image),
    },
    enquiryPanel: {
      ...bundle.content.enquiryPanel,
      background: serializeMedia(bundle.content.enquiryPanel.background),
      leafDecor: serializeMedia(bundle.content.enquiryPanel.leafDecor),
    },
    form: bundle.content.form,
  };

  const pagePayload = {
    slug: CONTACT_PAGE_SLUG,
    hero_eyebrow: null,
    hero_title: bundle.content.hero.headline,
    hero_description: bundle.content.hero.body,
    hero_image_path: mediaPath(bundle.content.hero.image),
    sections,
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (bundle.pageId) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", bundle.pageId);
    if (error) throw new Error(error.message);
  } else {
    const { data: existing } = await supabase
      .from("page_content")
      .select("id")
      .eq("slug", CONTACT_PAGE_SLUG)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("page_content").insert(pagePayload);
      if (error) throw new Error(error.message);
    }
  }

  await saveSiteSettingsToDb(bundle.settings);
  hydrateSiteSettings(bundle.settings);
  await logActivity(activityNoteForSlug(CONTACT_PAGE_SLUG));
}
