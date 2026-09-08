import type { MediaRef } from "@/data/homepage-content";
import {
  DEFAULT_RESERVATIONS,
  type ReservationsContent,
} from "@/data/reservations-content";
import {
  DEFAULT_AVAILABILITY,
  type AvailabilitySettings,
  getAvailability,
  hydrateAvailability,
} from "@/data/shared-availability";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const RESERVATIONS_PAGE_SLUG = "reservations";

export type ReservationsCmsBundle = {
  content: ReservationsContent;
  availability: AvailabilitySettings;
  pageId?: string;
};

type ReservationsSections = {
  heroExtras?: {
    button1Label?: string;
    button2Label?: string;
    trustLine?: string;
    image?: MediaRef;
  };
  steps?: ReservationsContent["steps"];
  step1?: ReservationsContent["step1"];
  step2?: ReservationsContent["step2"];
  success?: ReservationsContent["success"];
  settings?: ReservationsContent["settings"];
  availability?: AvailabilitySettings;
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: ReservationsSections | null;
};

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

async function loadWhatsAppSettings(fallback: ReservationsContent["settings"]) {
  const { data } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", [
      "whatsapp_number",
      "whatsapp_message_template",
      "phone_display",
      "reservation_confirmation_message",
    ]);

  const map = Object.fromEntries((data ?? []).map((row) => [row.key as string, row.value as string]));
  return {
    whatsappNumber: map.whatsapp_number || fallback.whatsappNumber,
    whatsappDisplay: map.phone_display || fallback.whatsappDisplay,
    whatsappPrefill: map.whatsapp_message_template || fallback.whatsappPrefill,
    confirmationMessage: map.reservation_confirmation_message || fallback.confirmationMessage,
  };
}

async function loadOccasions(fallback: ReservationsContent["step1"]["occasions"]) {
  const { data } = await supabase
    .from("occasion_options")
    .select("id,label,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!data?.length) return fallback;
  return data.map((row) => ({
    id: row.id as string,
    label: row.label as string,
  }));
}

async function loadAvailabilityFromDb(): Promise<AvailabilitySettings> {
  const [{ data: slots }, { data: blackouts }] = await Promise.all([
    supabase
      .from("reservation_settings")
      .select("id,time_slot,max_guests,location,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("blackout_dates")
      .select("id,blackout_date,location,is_active")
      .eq("is_active", true)
      .order("blackout_date", { ascending: true }),
  ]);

  if (!slots?.length) return structuredClone(DEFAULT_AVAILABILITY);

  const uniqueSlots = [
    ...new Map(
      slots.map((slot) => [
        slot.time_slot as string,
        {
          id: (slot.id as string) || `slot-${slot.time_slot}`,
          label: slot.time_slot as string,
          locationIds: slot.location && slot.location !== "all" ? [slot.location as string] : [],
        },
      ]),
    ).values(),
  ];

  const maxGuests =
    slots.reduce((max, slot) => {
      const value = Number(slot.max_guests ?? 0);
      return value > max ? value : max;
    }, 0) || DEFAULT_AVAILABILITY.maxGuests;

  // Notes stay in page_content sections when edited in admin (DB has no note column).
  return {
    timeSlots: uniqueSlots,
    maxGuests,
    blackouts: (blackouts ?? []).map((row) => ({
      id: row.id as string,
      date: row.blackout_date as string,
      locationIds: row.location && row.location !== "all" ? [row.location as string] : [],
      note: "",
    })),
  };
}

async function saveWhatsAppSettings(settings: ReservationsContent["settings"]) {
  const rows = [
    { key: "whatsapp_number", value: settings.whatsappNumber, description: "WhatsApp number" },
    { key: "phone_display", value: settings.whatsappDisplay, description: "Display phone" },
    {
      key: "whatsapp_message_template",
      value: settings.whatsappPrefill,
      description: "WhatsApp prefill message",
    },
    {
      key: "reservation_confirmation_message",
      value: settings.confirmationMessage,
      description: "Reservation confirmation message",
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

async function syncOccasionLabels(occasions: ReservationsContent["step1"]["occasions"]) {
  const { data: existing } = await supabase
    .from("occasion_options")
    .select("id,label,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!existing?.length) return;

  const count = Math.min(existing.length, occasions.length);
  for (let i = 0; i < count; i += 1) {
    const { error } = await supabase
      .from("occasion_options")
      .update({ label: occasions[i].label, sort_order: i + 1 })
      .eq("id", existing[i].id);
    if (error) throw new Error(error.message);
  }
}

async function syncMaxGuests(maxGuests: number) {
  const { error } = await supabase
    .from("reservation_settings")
    .update({ max_guests: maxGuests })
    .eq("is_active", true);
  if (error) throw new Error(error.message);
}

export async function loadReservationsCms(): Promise<ReservationsCmsBundle> {
  const [{ data: page, error: pageError }, settings, occasions, availability] = await Promise.all([
    supabase.from("page_content").select("*").eq("slug", RESERVATIONS_PAGE_SLUG).maybeSingle(),
    loadWhatsAppSettings(DEFAULT_RESERVATIONS.settings),
    loadOccasions(DEFAULT_RESERVATIONS.step1.occasions),
    loadAvailabilityFromDb(),
  ]);

  if (pageError) throw new Error(pageError.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as ReservationsSections;

  const content: ReservationsContent = {
    hero: {
      image: asMedia(
        sections.heroExtras?.image || {
          name: row?.hero_image_path?.split("/").pop() || DEFAULT_RESERVATIONS.hero.image.name,
          path: row?.hero_image_path || undefined,
        },
        DEFAULT_RESERVATIONS.hero.image.name,
      ),
      eyebrow: row?.hero_eyebrow || DEFAULT_RESERVATIONS.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_RESERVATIONS.hero.headline,
      tagline: row?.hero_description || DEFAULT_RESERVATIONS.hero.tagline,
      button1Label: sections.heroExtras?.button1Label || DEFAULT_RESERVATIONS.hero.button1Label,
      button2Label: sections.heroExtras?.button2Label || DEFAULT_RESERVATIONS.hero.button2Label,
      trustLine: sections.heroExtras?.trustLine || DEFAULT_RESERVATIONS.hero.trustLine,
    },
    steps: sections.steps || DEFAULT_RESERVATIONS.steps,
    step1: {
      ...(sections.step1 || DEFAULT_RESERVATIONS.step1),
      occasions,
      locations: sections.step1?.locations?.length
        ? sections.step1.locations
        : DEFAULT_RESERVATIONS.step1.locations,
    },
    step2: sections.step2 || DEFAULT_RESERVATIONS.step2,
    success: sections.success || DEFAULT_RESERVATIONS.success,
    settings,
  };

  const cmsAvailability = sections.availability;
  const resolvedAvailability = cmsAvailability?.timeSlots?.length
    ? {
        ...availability,
        ...cmsAvailability,
        // Prefer live DB slots/blackouts when present; keep CMS notes when dates match
        timeSlots: availability.timeSlots.length ? availability.timeSlots : cmsAvailability.timeSlots,
        blackouts: (availability.blackouts.length ? availability.blackouts : cmsAvailability.blackouts).map(
          (bo) => {
            const fromCms = cmsAvailability.blackouts?.find((item) => item.date === bo.date);
            return { ...bo, note: fromCms?.note || bo.note || "" };
          },
        ),
        maxGuests: availability.maxGuests || cmsAvailability.maxGuests,
      }
    : availability;

  return {
    content,
    availability: resolvedAvailability,
    pageId: row?.id,
  };
}

export async function saveReservationsCms(bundle: ReservationsCmsBundle) {
  const availability = bundle.availability;
  const sections: ReservationsSections = {
    heroExtras: {
      button1Label: bundle.content.hero.button1Label,
      button2Label: bundle.content.hero.button2Label,
      trustLine: bundle.content.hero.trustLine,
      image: serializeMedia(bundle.content.hero.image),
    },
    steps: bundle.content.steps,
    step1: bundle.content.step1,
    step2: bundle.content.step2,
    success: bundle.content.success,
    settings: bundle.content.settings,
    availability,
  };

  const pagePayload = {
    slug: RESERVATIONS_PAGE_SLUG,
    hero_eyebrow: bundle.content.hero.eyebrow,
    hero_title: bundle.content.hero.headline,
    hero_description: bundle.content.hero.tagline,
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
      .eq("slug", RESERVATIONS_PAGE_SLUG)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("page_content").insert(pagePayload);
      if (error) throw new Error(error.message);
    }
  }

  await saveWhatsAppSettings(bundle.content.settings);
  await syncOccasionLabels(bundle.content.step1.occasions);
  await syncMaxGuests(availability.maxGuests || getAvailability().maxGuests);
  hydrateAvailability(availability);
  await logActivity(activityNoteForSlug(RESERVATIONS_PAGE_SLUG));
}
