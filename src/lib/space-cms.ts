import {
  DEFAULT_THE_SPACE,
  type CollageSlot,
  type ExperienceLevel,
  type MemorySlide,
  type PhilosophyPillar,
  type TheSpaceContent,
} from "@/data/the-space-content";
import type { MediaRef } from "@/data/homepage-content";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const SPACE_PAGE_SLUG = "the-space";

export type SpaceCmsBundle = {
  content: TheSpaceContent;
  pageId?: string;
};

type SpaceSections = {
  heroExtras?: {
    button?: TheSpaceContent["hero"]["button"];
    collage?: CollageSlot[];
  };
  memories?: TheSpaceContent["memories"];
  experiences?: TheSpaceContent["experiences"];
  philosophy?: TheSpaceContent["philosophy"];
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: SpaceSections | null;
};

function asMedia(input?: MediaRef | null, fallbackName = "image.jpg"): MediaRef {
  if (!input) return { name: fallbackName };
  const path = input.path;
  const previewUrl =
    input.previewUrl ||
    (path ? optimizedMediaUrl(path, { width: 640, quality: 72 }) : publicMediaUrl(path));
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

function mapCollage(slots: CollageSlot[] | undefined): CollageSlot[] {
  const source = slots?.length ? slots : DEFAULT_THE_SPACE.hero.collage;
  return source.map((slot) => ({
    ...slot,
    image: asMedia(slot.image, slot.image?.name || "space.jpg"),
  }));
}

function mapMemorySlides(slides: MemorySlide[] | undefined): MemorySlide[] {
  const source = slides?.length ? slides : DEFAULT_THE_SPACE.memories.slides;
  return source.map((slide) => {
    if (slide.type === "quote") return slide;
    return {
      ...slide,
      image: asMedia(slide.image, slide.image?.name || "memory.jpg"),
    };
  });
}

function mapLevels(levels: ExperienceLevel[] | undefined): ExperienceLevel[] {
  const source = levels?.length ? levels : DEFAULT_THE_SPACE.experiences.levels;
  return source.map((level) => ({
    ...level,
    image: asMedia(level.image, level.image?.name || "level.jpg"),
    decorImage: asMedia(level.decorImage, level.decorImage?.name || "decor.png"),
  }));
}

function mapPillars(pillars: PhilosophyPillar[] | undefined): PhilosophyPillar[] {
  const source = pillars?.length ? pillars : DEFAULT_THE_SPACE.philosophy.pillars;
  return source.map((pillar) => ({
    ...pillar,
    customIcon: pillar.customIcon
      ? asMedia(pillar.customIcon, pillar.customIcon.name || "icon.png")
      : pillar.customIcon,
  }));
}

export async function loadSpaceCms(): Promise<SpaceCmsBundle> {
  const { data: page, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", SPACE_PAGE_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = page as PageContentRow | null;
const sections = (row?.sections ?? {}) as SpaceSections;

  const content: TheSpaceContent = {
    hero: {
      eyebrow: row?.hero_eyebrow || DEFAULT_THE_SPACE.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_THE_SPACE.hero.headline,
      body: row?.hero_description || DEFAULT_THE_SPACE.hero.body,
      button: sections.heroExtras?.button || DEFAULT_THE_SPACE.hero.button,
      collage: mapCollage(sections.heroExtras?.collage).map((slot) =>
        slot.id === "tall" && row?.hero_image_path
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
      ),
    },
    memories: {
      eyebrow: sections.memories?.eyebrow || DEFAULT_THE_SPACE.memories.eyebrow,
      slides: mapMemorySlides(sections.memories?.slides),
      quotes: sections.memories?.quotes?.length
        ? sections.memories.quotes
        : DEFAULT_THE_SPACE.memories.quotes,
    },
    experiences: {
      eyebrow: sections.experiences?.eyebrow || DEFAULT_THE_SPACE.experiences.eyebrow,
      levels: mapLevels(sections.experiences?.levels),
    },
    philosophy: {
      ...(sections.philosophy || DEFAULT_THE_SPACE.philosophy),
      pillars: mapPillars(sections.philosophy?.pillars),
    },
  };

  return { content, pageId: row?.id };
}

export async function saveSpaceCms(bundle: SpaceCmsBundle) {
  const tall = bundle.content.hero.collage.find((s) => s.id === "tall");
  const sections: SpaceSections = {
    heroExtras: {
      button: bundle.content.hero.button,
      collage: bundle.content.hero.collage.map((slot) => ({
        ...slot,
        image: serializeMedia(slot.image),
      })),
    },
    memories: {
      ...bundle.content.memories,
      slides: bundle.content.memories.slides.map((slide) => {
        if (slide.type === "quote") return slide;
        return { ...slide, image: serializeMedia(slide.image) };
      }),
    },
    experiences: {
      ...bundle.content.experiences,
      levels: bundle.content.experiences.levels.map((level) => ({
        ...level,
        image: serializeMedia(level.image),
        decorImage: serializeMedia(level.decorImage),
      })),
    },
    philosophy: {
      ...bundle.content.philosophy,
      pillars: bundle.content.philosophy.pillars.map((pillar) => ({
        ...pillar,
        customIcon: pillar.customIcon ? serializeMedia(pillar.customIcon) : pillar.customIcon,
      })),
    },
  };

  const pagePayload = {
    slug: SPACE_PAGE_SLUG,
    hero_eyebrow: bundle.content.hero.eyebrow,
    hero_title: bundle.content.hero.headline,
    hero_description: bundle.content.hero.body,
    hero_image_path: mediaPath(tall?.image),
    sections,
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (bundle.pageId) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", bundle.pageId);
    if (error) throw new Error(error.message);
    await logActivity(activityNoteForSlug(SPACE_PAGE_SLUG));
    return;
  }

  const { data: existing } = await supabase
    .from("page_content")
    .select("id")
    .eq("slug", SPACE_PAGE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("page_content").insert(pagePayload);
    if (error) throw new Error(error.message);
  }
  await logActivity(activityNoteForSlug(SPACE_PAGE_SLUG));
}
