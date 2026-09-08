import type { MediaRef } from "@/data/homepage-content";
import {
  DEFAULT_LEVEL5,
  type FeatureCard,
  type Level5Content,
  type OccasionCard,
  type WalkThumb,
} from "@/data/level5-content";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const LEVEL5_PAGE_SLUG = "level-5";

export type Level5CmsBundle = {
  content: Level5Content;
  pageId?: string;
};

type Level5Sections = {
  features?: FeatureCard[];
  story?: Level5Content["story"];
  occasions?: Level5Content["occasions"];
  note?: Level5Content["note"];
  walk?: Level5Content["walk"];
  goldenHour?: Level5Content["goldenHour"];
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: Level5Sections | null;
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

function mapFeatures(features: FeatureCard[] | undefined): FeatureCard[] {
  const source = features?.length ? features : DEFAULT_LEVEL5.features;
  return source.map((feature) => ({
    ...feature,
    customIcon: feature.customIcon
      ? asMedia(feature.customIcon, feature.customIcon.name || "icon.png")
      : feature.customIcon,
  }));
}

function mapOccasions(cards: OccasionCard[] | undefined): OccasionCard[] {
  const source = cards?.length ? cards : DEFAULT_LEVEL5.occasions.cards;
  return source.map((card) => ({
    ...card,
    image: asMedia(card.image, card.image?.name || "occasion.jpg"),
  }));
}

function mapWalk(thumbs: WalkThumb[] | undefined): WalkThumb[] {
  const source = thumbs?.length ? thumbs : DEFAULT_LEVEL5.walk.thumbs;
  return source.map((thumb) => ({
    ...thumb,
    image: asMedia(thumb.image, thumb.image?.name || "walk.jpg"),
  }));
}

export async function loadLevel5Cms(): Promise<Level5CmsBundle> {
  const { data: page, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", LEVEL5_PAGE_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as Level5Sections;

  const content: Level5Content = {
    hero: {
      image: asMedia(
        {
          name: row?.hero_image_path?.split("/").pop() || DEFAULT_LEVEL5.hero.image.name,
          path: row?.hero_image_path || undefined,
        },
        DEFAULT_LEVEL5.hero.image.name,
      ),
      eyebrow: row?.hero_eyebrow || DEFAULT_LEVEL5.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_LEVEL5.hero.headline,
      subline: row?.hero_description || DEFAULT_LEVEL5.hero.subline,
    },
    features: mapFeatures(sections.features),
    story: {
      eyebrow: sections.story?.eyebrow || DEFAULT_LEVEL5.story.eyebrow,
      title: sections.story?.title || DEFAULT_LEVEL5.story.title,
      intro: sections.story?.intro || DEFAULT_LEVEL5.story.intro,
      paragraphs: sections.story?.paragraphs?.length
        ? sections.story.paragraphs
        : DEFAULT_LEVEL5.story.paragraphs,
      pills: sections.story?.pills?.length ? sections.story.pills : DEFAULT_LEVEL5.story.pills,
      closing: sections.story?.closing || DEFAULT_LEVEL5.story.closing,
    },
    occasions: {
      headline: sections.occasions?.headline || DEFAULT_LEVEL5.occasions.headline,
      cards: mapOccasions(sections.occasions?.cards),
    },
    note: {
      ...(sections.note || DEFAULT_LEVEL5.note),
      portrait: asMedia(
        sections.note?.portrait || DEFAULT_LEVEL5.note.portrait,
        DEFAULT_LEVEL5.note.portrait.name,
      ),
      portraitAlt: sections.note?.portraitAlt || DEFAULT_LEVEL5.note.portraitAlt,
      headline: sections.note?.headline || DEFAULT_LEVEL5.note.headline,
      body: sections.note?.body || DEFAULT_LEVEL5.note.body,
      signOff: sections.note?.signOff || DEFAULT_LEVEL5.note.signOff,
      signature1: sections.note?.signature1 || DEFAULT_LEVEL5.note.signature1,
      signature2: sections.note?.signature2 || DEFAULT_LEVEL5.note.signature2,
    },
    walk: {
      headline: sections.walk?.headline || DEFAULT_LEVEL5.walk.headline,
      thumbs: mapWalk(sections.walk?.thumbs),
    },
    goldenHour: {
      ...(sections.goldenHour || DEFAULT_LEVEL5.goldenHour),
      background: asMedia(
        sections.goldenHour?.background || DEFAULT_LEVEL5.goldenHour.background,
        DEFAULT_LEVEL5.goldenHour.background.name,
      ),
      headline: sections.goldenHour?.headline || DEFAULT_LEVEL5.goldenHour.headline,
      cardTitle: sections.goldenHour?.cardTitle || DEFAULT_LEVEL5.goldenHour.cardTitle,
      dateLabel: sections.goldenHour?.dateLabel || DEFAULT_LEVEL5.goldenHour.dateLabel,
      timeLabel: sections.goldenHour?.timeLabel || DEFAULT_LEVEL5.goldenHour.timeLabel,
      guestsLabel: sections.goldenHour?.guestsLabel || DEFAULT_LEVEL5.goldenHour.guestsLabel,
      guestOptions: sections.goldenHour?.guestOptions?.length
        ? sections.goldenHour.guestOptions
        : DEFAULT_LEVEL5.goldenHour.guestOptions,
      button: sections.goldenHour?.button || DEFAULT_LEVEL5.goldenHour.button,
      footerScript: sections.goldenHour?.footerScript || DEFAULT_LEVEL5.goldenHour.footerScript,
    },
  };

  return { content, pageId: row?.id };
}

export async function saveLevel5Cms(bundle: Level5CmsBundle) {
  const sections: Level5Sections = {
    features: bundle.content.features.map((feature) => ({
      ...feature,
      customIcon: feature.customIcon ? serializeMedia(feature.customIcon) : feature.customIcon,
    })),
    story: bundle.content.story,
    occasions: {
      ...bundle.content.occasions,
      cards: bundle.content.occasions.cards.map((card) => ({
        ...card,
        image: serializeMedia(card.image),
      })),
    },
    note: {
      ...bundle.content.note,
      portrait: serializeMedia(bundle.content.note.portrait),
    },
    walk: {
      ...bundle.content.walk,
      thumbs: bundle.content.walk.thumbs.map((thumb) => ({
        ...thumb,
        image: serializeMedia(thumb.image),
      })),
    },
    goldenHour: {
      ...bundle.content.goldenHour,
      background: serializeMedia(bundle.content.goldenHour.background),
    },
  };

  const pagePayload = {
    slug: LEVEL5_PAGE_SLUG,
    hero_eyebrow: bundle.content.hero.eyebrow,
    hero_title: bundle.content.hero.headline,
    hero_description: bundle.content.hero.subline,
    hero_image_path: mediaPath(bundle.content.hero.image),
    sections,
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (bundle.pageId) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", bundle.pageId);
    if (error) throw new Error(error.message);
    await logActivity(activityNoteForSlug(LEVEL5_PAGE_SLUG));
    return;
  }

  const { data: existing } = await supabase
    .from("page_content")
    .select("id")
    .eq("slug", LEVEL5_PAGE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("page_content").insert(pagePayload);
    if (error) throw new Error(error.message);
  }
  await logActivity(activityNoteForSlug(LEVEL5_PAGE_SLUG));
}
