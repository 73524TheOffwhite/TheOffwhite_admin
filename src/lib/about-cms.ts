import {
  DEFAULT_ABOUT,
  type AboutContent,
  type SlideImage,
} from "@/data/about-content";
import type { MediaRef } from "@/data/homepage-content";
import {
  DEFAULT_TESTIMONIALS,
  type TestimonialsContent,
  getTestimonials,
} from "@/data/shared-testimonials";
import { saveTestimonialsBundle } from "@/lib/homepage-cms";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const ABOUT_PAGE_SLUG = "about";

export type AboutCmsBundle = {
  content: AboutContent;
  testimonials: TestimonialsContent;
  pageId?: string;
};

type AboutSections = {
  heroExtras?: { breadcrumb?: string };
  philosophy?: AboutContent["philosophy"];
  founders?: AboutContent["founders"];
  values?: AboutContent["values"];
  stats?: AboutContent["stats"];
  kitchen?: AboutContent["kitchen"];
};

type PageContentRow = {
  id: string;
  slug: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: AboutSections | null;
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

function mapSlides(slides: SlideImage[] | undefined, fallback: SlideImage[]): SlideImage[] {
  const source = slides?.length ? slides : fallback;
  return source.map((slide) => ({
    ...slide,
    image: asMedia(slide.image, slide.image?.name || "slide.jpg"),
  }));
}

function serializeMedia(media: MediaRef): MediaRef {
  return {
    name: media.name,
    path: mediaPath(media) || undefined,
    previewUrl: publicMediaUrl(mediaPath(media)) || media.previewUrl,
  };
}

function serializeSlides(slides: SlideImage[]): SlideImage[] {
  return slides.map((slide) => ({
    ...slide,
    image: serializeMedia(slide.image),
  }));
}

export async function loadAboutCms(): Promise<AboutCmsBundle> {
  const [{ data: page, error: pageError }, { data: reviewRows, error: reviewError }, { data: settings }] =
    await Promise.all([
      supabase.from("page_content").select("*").eq("slug", ABOUT_PAGE_SLUG).maybeSingle(),
      supabase
        .from("testimonials")
        .select(
          "id,quote,author,meta,posted_when,rating,show_on_home,show_on_about,show_on_space,sort_order,is_active,status",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("site_settings").select("key,value").eq("key", "google_reviews_url").maybeSingle(),
    ]);

  if (pageError) throw new Error(pageError.message);
  if (reviewError) throw new Error(reviewError.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as AboutSections;

  const content: AboutContent = {
    hero: {
      image: asMedia(
        {
          name: row?.hero_image_path?.split("/").pop() || DEFAULT_ABOUT.hero.image.name,
          path: row?.hero_image_path || undefined,
        },
        DEFAULT_ABOUT.hero.image.name,
      ),
      eyebrow: row?.hero_eyebrow || DEFAULT_ABOUT.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_ABOUT.hero.headline,
      description: row?.hero_description || DEFAULT_ABOUT.hero.description,
      breadcrumb: sections.heroExtras?.breadcrumb || DEFAULT_ABOUT.hero.breadcrumb,
    },
    philosophy: {
      ...(sections.philosophy || DEFAULT_ABOUT.philosophy),
      slides: mapSlides(sections.philosophy?.slides, DEFAULT_ABOUT.philosophy.slides),
    },
    founders: sections.founders || DEFAULT_ABOUT.founders,
    values: sections.values || DEFAULT_ABOUT.values,
    stats: sections.stats || DEFAULT_ABOUT.stats,
    kitchen: {
      ...(sections.kitchen || DEFAULT_ABOUT.kitchen),
      slides: mapSlides(sections.kitchen?.slides, DEFAULT_ABOUT.kitchen.slides),
    },
  };

  const currentShared = getTestimonials();
  const reviews =
    reviewRows?.length
      ? reviewRows.map((r) => ({
          id: r.id as string,
          quote: r.quote as string,
          author: r.author as string,
          meta: (r.meta as string | null) || "",
          postedWhen: (r.posted_when as string | null) || "",
          rating: (r.rating as number | null) || 5,
          showOnHome: Boolean(r.show_on_home),
        }))
      : currentShared.reviews.length
        ? currentShared.reviews
        : DEFAULT_TESTIMONIALS.reviews;

  const testimonials: TestimonialsContent = {
    ...currentShared,
    googleUrl: settings?.value || currentShared.googleUrl || DEFAULT_TESTIMONIALS.googleUrl,
    reviews,
  };

  return {
    content,
    testimonials,
    pageId: row?.id,
  };
}

export async function saveAboutCms(bundle: AboutCmsBundle) {
  const sections: AboutSections = {
    heroExtras: {
      breadcrumb: bundle.content.hero.breadcrumb,
    },
    philosophy: {
      ...bundle.content.philosophy,
      slides: serializeSlides(bundle.content.philosophy.slides),
    },
    founders: bundle.content.founders,
    values: bundle.content.values,
    stats: bundle.content.stats,
    kitchen: {
      ...bundle.content.kitchen,
      slides: serializeSlides(bundle.content.kitchen.slides),
    },
  };

  const pagePayload = {
    slug: ABOUT_PAGE_SLUG,
    hero_eyebrow: bundle.content.hero.eyebrow,
    hero_title: bundle.content.hero.headline,
    hero_description: bundle.content.hero.description,
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
      .eq("slug", ABOUT_PAGE_SLUG)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("page_content").insert(pagePayload);
      if (error) throw new Error(error.message);
    }
  }

  await saveTestimonialsBundle(bundle.testimonials);
  await logActivity(activityNoteForSlug(ABOUT_PAGE_SLUG));
}
