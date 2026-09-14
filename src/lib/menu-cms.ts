import type { MediaRef } from "@/data/homepage-content";
import { DEFAULT_MENU, type MenuPageContent, type VisualMenuDish } from "@/data/menu-content";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const MENU_PAGE_SLUG = "menu";

export type MenuCmsBundle = {
  content: MenuPageContent;
  pageId?: string;
};

type MenuSections = {
  heroExtras?: {
    breadcrumb?: string;
    mobileImage?: MediaRef;
  };
  selection?: MenuPageContent["selection"];
  dishes?: VisualMenuDish[];
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_image_path: string | null;
  sections: MenuSections | null;
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

function mapDishes(dishes: VisualMenuDish[] | undefined): VisualMenuDish[] {
  if (!dishes?.length) return DEFAULT_MENU.dishes;
  return dishes.map((d) => ({
    id: d.id || d.image?.name || d.name,
    name: d.name || DEFAULT_MENU.dishes.find((x) => x.id === d.id)?.name || "Dish",
    image: asMedia(d.image, d.image?.name || "dish.jpg"),
  }));
}

export async function loadMenuCms(): Promise<MenuCmsBundle> {
  const { data: page, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", MENU_PAGE_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as MenuSections;

  const content: MenuPageContent = {
    hero: {
      image: row?.hero_image_path
        ? asMedia(
            {
              name: row.hero_image_path.split("/").pop() || DEFAULT_MENU.hero.image.name,
              path: row.hero_image_path,
            },
            DEFAULT_MENU.hero.image.name,
          )
        : asMedia(DEFAULT_MENU.hero.image, DEFAULT_MENU.hero.image.name),
      mobileImage: asMedia(
        sections.heroExtras?.mobileImage,
        DEFAULT_MENU.hero.mobileImage.name,
      ),
      eyebrow: row?.hero_eyebrow || DEFAULT_MENU.hero.eyebrow,
      headline: row?.hero_title || DEFAULT_MENU.hero.headline,
      description: row?.hero_description || DEFAULT_MENU.hero.description,
      breadcrumb: sections.heroExtras?.breadcrumb || DEFAULT_MENU.hero.breadcrumb,
    },
    selection: {
      eyebrow: sections.selection?.eyebrow || DEFAULT_MENU.selection.eyebrow,
      headline: sections.selection?.headline || DEFAULT_MENU.selection.headline,
      intro: sections.selection?.intro || DEFAULT_MENU.selection.intro,
    },
    dishes: mapDishes(sections.dishes),
  };

  return { content, pageId: row?.id };
}

export async function saveMenuCms(bundle: MenuCmsBundle) {
  const sections: MenuSections = {
    heroExtras: {
      breadcrumb: bundle.content.hero.breadcrumb,
      mobileImage: serializeMedia(bundle.content.hero.mobileImage),
    },
    selection: bundle.content.selection,
    dishes: bundle.content.dishes.map((d) => ({
      ...d,
      image: serializeMedia(d.image),
    })),
  };

  const pagePayload = {
    slug: MENU_PAGE_SLUG,
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
    await logActivity(activityNoteForSlug(MENU_PAGE_SLUG));
    return;
  }

  const { data: existing } = await supabase
    .from("page_content")
    .select("id")
    .eq("slug", MENU_PAGE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("page_content").insert(pagePayload);
    if (error) throw new Error(error.message);
  }
  await logActivity(activityNoteForSlug(MENU_PAGE_SLUG));
}
