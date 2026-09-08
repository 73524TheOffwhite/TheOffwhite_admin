import type { HomepageContent, MediaRef, Testimonial } from "@/data/homepage-content";
import { DEFAULT_HOMEPAGE } from "@/data/homepage-content";
import {
  DEFAULT_SIGNATURE_DISHES,
  type SignatureDishesContent,
} from "@/data/shared-dishes";
import {
  DEFAULT_TESTIMONIALS,
  type TestimonialsContent,
} from "@/data/shared-testimonials";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const HOME_PAGE_SLUG = "home";

export type HomepageCmsBundle = {
  content: HomepageContent;
  dishes: SignatureDishesContent;
  testimonials: TestimonialsContent;
  pageId?: string;
};

type HomeSections = {
  heroExtras?: {
    button1?: HomepageContent["hero"]["button1"];
    button2?: HomepageContent["hero"]["button2"];
    scrollLabel?: string;
    scrollHref?: string;
  };
  story?: HomepageContent["story"];
  space?: HomepageContent["space"];
  menuPreview?: HomepageContent["menuPreview"];
  dishes?: SignatureDishesContent;
  testimonialsSection?: Pick<
    TestimonialsContent,
    "eyebrow" | "ratingLine" | "decorImage" | "buttonLabel"
  >;
};

type PageContentRow = {
  id: string;
  slug: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: HomeSections | null;
  status: string | null;
};

type TestimonialRow = {
  id: string;
  quote: string;
  author: string;
  meta: string | null;
  posted_when: string | null;
  rating: number | null;
  show_on_home: boolean | null;
  show_on_about: boolean | null;
  show_on_space: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
  status: string | null;
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

export async function loadHomepageCms(): Promise<HomepageCmsBundle> {
  const [{ data: page, error: pageError }, { data: reviewRows, error: reviewError }, { data: settings }] =
    await Promise.all([
      supabase.from("page_content").select("*").eq("slug", HOME_PAGE_SLUG).maybeSingle(),
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
  const sections = (row?.sections ?? {}) as HomeSections;

  const content: HomepageContent = {
    hero: {
      image: asMedia(
        {
          name: row?.hero_image_path?.split("/").pop() || DEFAULT_HOMEPAGE.hero.image.name,
          path: row?.hero_image_path || undefined,
        },
        DEFAULT_HOMEPAGE.hero.image.name,
      ),
      eyebrow: row?.hero_eyebrow || DEFAULT_HOMEPAGE.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_HOMEPAGE.hero.headline,
      button1: sections.heroExtras?.button1 || DEFAULT_HOMEPAGE.hero.button1,
      button2: sections.heroExtras?.button2 || DEFAULT_HOMEPAGE.hero.button2,
      scrollLabel: sections.heroExtras?.scrollLabel || DEFAULT_HOMEPAGE.hero.scrollLabel,
      scrollHref: sections.heroExtras?.scrollHref || DEFAULT_HOMEPAGE.hero.scrollHref,
    },
    story: {
      ...(sections.story || DEFAULT_HOMEPAGE.story),
      image: asMedia(sections.story?.image, DEFAULT_HOMEPAGE.story.image.name),
    },
    space: {
      ...(sections.space || DEFAULT_HOMEPAGE.space),
      cards: (sections.space?.cards || DEFAULT_HOMEPAGE.space.cards).map((card) => ({
        ...card,
        image: asMedia(card.image, card.image?.name || "space.jpg"),
      })),
    },
    menuPreview: sections.menuPreview || DEFAULT_HOMEPAGE.menuPreview,
  };

  const dishesSource = sections.dishes || DEFAULT_SIGNATURE_DISHES;
  const dishes: SignatureDishesContent = {
    ...dishesSource,
    cards: dishesSource.cards.map((card) => ({
      ...card,
      image: asMedia(card.image, card.image?.name || "dish.jpg"),
    })),
  };

  const sectionChrome = sections.testimonialsSection || {
    eyebrow: DEFAULT_TESTIMONIALS.eyebrow,
    ratingLine: DEFAULT_TESTIMONIALS.ratingLine,
    decorImage: DEFAULT_TESTIMONIALS.decorImage,
    buttonLabel: DEFAULT_TESTIMONIALS.buttonLabel,
  };

  const reviews: Testimonial[] =
    (reviewRows as TestimonialRow[] | null)?.length
      ? (reviewRows as TestimonialRow[]).map((r) => ({
          id: r.id,
          quote: r.quote,
          author: r.author,
          meta: r.meta || "",
          postedWhen: r.posted_when || "",
          rating: r.rating || 5,
          showOnHome: Boolean(r.show_on_home),
        }))
      : DEFAULT_TESTIMONIALS.reviews;

  const testimonials: TestimonialsContent = {
    eyebrow: sectionChrome.eyebrow,
    ratingLine: sectionChrome.ratingLine,
    decorImage: asMedia(sectionChrome.decorImage, DEFAULT_TESTIMONIALS.decorImage.name),
    buttonLabel: sectionChrome.buttonLabel,
    googleUrl: settings?.value || DEFAULT_TESTIMONIALS.googleUrl,
    reviews,
  };

  return {
    content,
    dishes,
    testimonials,
    pageId: row?.id,
  };
}

async function saveTestimonialsRows(reviews: Testimonial[]) {
  const { data: existing, error: existingError } = await supabase
    .from("testimonials")
    .select("id")
    .eq("is_active", true);

  if (existingError) throw new Error(existingError.message);

  const existingIds = new Set((existing ?? []).map((r) => r.id as string));
  const keepIds = new Set(reviews.map((r) => r.id));
  const toDisable = [...existingIds].filter((id) => !keepIds.has(id));

  if (toDisable.length) {
    const { error } = await supabase
      .from("testimonials")
      .update({ is_active: false })
      .in("id", toDisable);
    if (error) throw new Error(error.message);
  }

  for (let index = 0; index < reviews.length; index += 1) {
    const review = reviews[index];
    const payload = {
      quote: review.quote,
      author: review.author,
      meta: review.meta || null,
      posted_when: review.postedWhen || null,
      rating: review.rating,
      show_on_home: review.showOnHome,
      sort_order: index + 1,
      is_active: true,
      status: "published",
      source: "manual",
    };

    if (existingIds.has(review.id)) {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", review.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("testimonials").insert({ id: review.id, ...payload });
      if (error) throw new Error(error.message);
    }
  }
}

export async function saveHomepageCms(bundle: HomepageCmsBundle) {
  const sections: HomeSections = {
    heroExtras: {
      button1: bundle.content.hero.button1,
      button2: bundle.content.hero.button2,
      scrollLabel: bundle.content.hero.scrollLabel,
      scrollHref: bundle.content.hero.scrollHref,
    },
    story: {
      ...bundle.content.story,
      image: {
        name: bundle.content.story.image.name,
        path: mediaPath(bundle.content.story.image) || undefined,
        previewUrl: publicMediaUrl(mediaPath(bundle.content.story.image)) || bundle.content.story.image.previewUrl,
      },
    },
    space: {
      ...bundle.content.space,
      cards: bundle.content.space.cards.map((card) => ({
        ...card,
        image: {
          name: card.image.name,
          path: mediaPath(card.image) || undefined,
          previewUrl: publicMediaUrl(mediaPath(card.image)) || card.image.previewUrl,
        },
      })),
    },
    menuPreview: bundle.content.menuPreview,
    dishes: {
      ...bundle.dishes,
      cards: bundle.dishes.cards.map((card) => ({
        ...card,
        image: {
          name: card.image.name,
          path: mediaPath(card.image) || undefined,
          previewUrl: publicMediaUrl(mediaPath(card.image)) || card.image.previewUrl,
        },
      })),
    },
    testimonialsSection: {
      eyebrow: bundle.testimonials.eyebrow,
      ratingLine: bundle.testimonials.ratingLine,
      buttonLabel: bundle.testimonials.buttonLabel,
      decorImage: {
        name: bundle.testimonials.decorImage.name,
        path: mediaPath(bundle.testimonials.decorImage) || undefined,
        previewUrl:
          publicMediaUrl(mediaPath(bundle.testimonials.decorImage)) ||
          bundle.testimonials.decorImage.previewUrl,
      },
    },
  };

  const pagePayload = {
    slug: HOME_PAGE_SLUG,
    hero_eyebrow: bundle.content.hero.eyebrow,
    hero_title: bundle.content.hero.headline,
    hero_description: null as string | null,
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
      .eq("slug", HOME_PAGE_SLUG)
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
  await logActivity(activityNoteForSlug(HOME_PAGE_SLUG));
}

export async function saveTestimonialsBundle(testimonials: TestimonialsContent) {
  await saveTestimonialsRows(testimonials.reviews);

  const { error: settingsError } = await supabase.from("site_settings").upsert(
    {
      key: "google_reviews_url",
      value: testimonials.googleUrl,
      description: "Google reviews profile URL",
    },
    { onConflict: "key" },
  );
  if (settingsError) {
    const { error: patchError } = await supabase
      .from("site_settings")
      .update({ value: testimonials.googleUrl })
      .eq("key", "google_reviews_url");
    if (patchError) throw new Error(patchError.message || settingsError.message);
  }
}
