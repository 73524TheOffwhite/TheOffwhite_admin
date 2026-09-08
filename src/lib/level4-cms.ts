import type { MediaRef } from "@/data/homepage-content";
import { DEFAULT_LEVEL4, type CollageImageSlot, type Level4Content } from "@/data/level4-content";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const LEVEL4_PAGE_SLUG = "level-4";

export type Level4CmsBundle = {
  content: Level4Content;
  pageId?: string;
};

type Level4Sections = {
  heroExtras?: {
    buttonLabel?: string;
    collage?: CollageImageSlot[];
  };
  mood?: Level4Content["mood"];
  story?: Level4Content["story"];
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: Level4Sections | null;
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

function mapCollage(slots: CollageImageSlot[] | undefined): CollageImageSlot[] {
  const byId = new Map((slots ?? []).map((slot) => [slot.id, slot]));
  return DEFAULT_LEVEL4.collage.map((fallback) => {
    const slot = byId.get(fallback.id) || fallback;
    return {
      ...fallback,
      ...slot,
      id: fallback.id,
      label: slot.label || fallback.label,
      alt: slot.alt || fallback.alt,
      image: asMedia(slot.image, fallback.image.name),
    };
  });
}

export async function loadLevel4Cms(): Promise<Level4CmsBundle> {
  const { data: page, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", LEVEL4_PAGE_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as Level4Sections;
  const collage = mapCollage(sections.heroExtras?.collage).map((slot) =>
    slot.id === "dining" && row?.hero_image_path
      ? {
          ...slot,
          image: asMedia(
            {
              name: row.hero_image_path.split("/").pop() || slot.image.name,
              path: row.hero_image_path,
            },
            slot.image.name,
          ),
        }
      : slot,
  );

  const content: Level4Content = {
    hero: {
      eyebrow: row?.hero_eyebrow || DEFAULT_LEVEL4.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_LEVEL4.hero.headline,
      body: row?.hero_description || DEFAULT_LEVEL4.hero.body,
      buttonLabel: sections.heroExtras?.buttonLabel || DEFAULT_LEVEL4.hero.buttonLabel,
    },
    collage,
    mood: {
      quoteLines: sections.mood?.quoteLines?.length
        ? sections.mood.quoteLines
        : DEFAULT_LEVEL4.mood.quoteLines,
      button: sections.mood?.button || DEFAULT_LEVEL4.mood.button,
    },
    story: {
      eyebrow: sections.story?.eyebrow || DEFAULT_LEVEL4.story.eyebrow,
      title: sections.story?.title || DEFAULT_LEVEL4.story.title,
      intro: sections.story?.intro || DEFAULT_LEVEL4.story.intro,
      paragraphs: sections.story?.paragraphs?.length
        ? sections.story.paragraphs
        : DEFAULT_LEVEL4.story.paragraphs,
      features: sections.story?.features?.length
        ? sections.story.features
        : DEFAULT_LEVEL4.story.features,
    },
  };

  return { content, pageId: row?.id };
}

export async function saveLevel4Cms(bundle: Level4CmsBundle) {
  const dining = bundle.content.collage.find((s) => s.id === "dining");
  const sections: Level4Sections = {
    heroExtras: {
      buttonLabel: bundle.content.hero.buttonLabel,
      collage: bundle.content.collage.map((slot) => ({
        ...slot,
        image: serializeMedia(slot.image),
      })),
    },
    mood: bundle.content.mood,
    story: bundle.content.story,
  };

  const pagePayload = {
    slug: LEVEL4_PAGE_SLUG,
    hero_eyebrow: bundle.content.hero.eyebrow,
    hero_title: bundle.content.hero.headline,
    hero_description: bundle.content.hero.body,
    hero_image_path: mediaPath(dining?.image),
    sections,
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (bundle.pageId) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", bundle.pageId);
    if (error) throw new Error(error.message);
    await logActivity(activityNoteForSlug(LEVEL4_PAGE_SLUG));
    return;
  }

  const { data: existing } = await supabase
    .from("page_content")
    .select("id")
    .eq("slug", LEVEL4_PAGE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("page_content").insert(pagePayload);
    if (error) throw new Error(error.message);
  }
  await logActivity(activityNoteForSlug(LEVEL4_PAGE_SLUG));
}
