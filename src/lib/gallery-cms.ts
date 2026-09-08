import type { MediaRef } from "@/data/homepage-content";
import {
  DEFAULT_GALLERY,
  type GalleryCategory,
  type GalleryContent,
  type GalleryPhoto,
  type PreviewSets,
  type TourScene,
} from "@/data/gallery-content";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { optimizedMediaUrl, publicMediaUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";

export const GALLERY_PAGE_SLUG = "gallery";

export type GalleryCmsBundle = {
  content: GalleryContent;
  pageId?: string;
};

type GallerySections = {
  toggle?: GalleryContent["toggle"];
  categories?: GalleryCategory[];
  photos?: GalleryPhoto[];
  previewSets?: PreviewSets;
  tour?: GalleryContent["tour"];
};

type PageContentRow = {
  id: string;
  hero_eyebrow: string | null;
  hero_title: string | null;
  sections: GallerySections | null;
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

function hasUploadedImage(photo: GalleryPhoto) {
  const image = photo.image;
  if (!image) return false;
  if (image.path) return true;
  const preview = image.previewUrl;
  return Boolean(
    preview &&
      !preview.startsWith("blob:") &&
      !preview.startsWith("data:") &&
      (preview.startsWith("http://") || preview.startsWith("https://") || preview.includes("/storage/")),
  );
}

function mapPhotos(photos: GalleryPhoto[] | undefined): GalleryPhoto[] {
  if (!photos?.length) return DEFAULT_GALLERY.photos;
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const merged = photos.map((photo) => ({
    ...photo,
    image: asMedia(photo.image, photo.image?.name || "photo.jpg"),
  }));
  const hasUploadedEvents = photos.some(
    (photo) => photo.category === "events" && hasUploadedImage(photo),
  );
  for (const fallback of DEFAULT_GALLERY.photos) {
    if (byId.has(fallback.id)) continue;
    if (fallback.category === "events" && hasUploadedEvents) continue;
    merged.push({ ...fallback, image: asMedia(fallback.image, fallback.image.name) });
  }
  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapCategories(categories: GalleryCategory[] | undefined): GalleryCategory[] {
  if (!categories?.length) return DEFAULT_GALLERY.categories;
  const byKey = new Map(categories.map((category) => [category.key, category]));
  return DEFAULT_GALLERY.categories.map((fallback) => {
    const saved = byKey.get(fallback.key);
    return saved ? { ...fallback, ...saved, key: fallback.key } : fallback;
  });
}

function mapPreviewSets(previewSets: PreviewSets | undefined): PreviewSets {
  if (!previewSets || !Object.keys(previewSets).length) return DEFAULT_GALLERY.previewSets;
  return { ...DEFAULT_GALLERY.previewSets, ...previewSets };
}

function mapTourScenes(scenes: TourScene[] | undefined): TourScene[] {
  if (!scenes?.length) return DEFAULT_GALLERY.tour.scenes;
  return scenes.map((scene) => ({
    ...scene,
    panorama: asMedia(scene.panorama, scene.panorama?.name || "panorama.jpg"),
    thumbnail: asMedia(scene.thumbnail, scene.thumbnail?.name || "thumb.jpg"),
    hotspots: scene.hotspots ?? [],
  }));
}

export async function loadGalleryCms(): Promise<GalleryCmsBundle> {
  const { data: page, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("slug", GALLERY_PAGE_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const row = page as PageContentRow | null;
  const sections = (row?.sections ?? {}) as GallerySections;

  const content: GalleryContent = {
    header: {
      eyebrow: row?.hero_eyebrow || DEFAULT_GALLERY.header.eyebrow,
      headline: row?.hero_title || DEFAULT_GALLERY.header.headline,
    },
    toggle: sections.toggle || DEFAULT_GALLERY.toggle,
    categories: mapCategories(sections.categories),
    photos: mapPhotos(sections.photos),
    previewSets: mapPreviewSets(sections.previewSets),
    tour: {
      scenes: mapTourScenes(sections.tour?.scenes),
    },
  };

  return { content, pageId: row?.id };
}

export async function saveGalleryCms(bundle: GalleryCmsBundle) {
  const sections: GallerySections = {
    toggle: bundle.content.toggle,
    categories: bundle.content.categories,
    photos: bundle.content.photos.map((photo) => ({
      ...photo,
      image: serializeMedia(photo.image),
    })),
    previewSets: bundle.content.previewSets,
    tour: {
      scenes: bundle.content.tour.scenes.map((scene) => ({
        ...scene,
        panorama: serializeMedia(scene.panorama),
        thumbnail: serializeMedia(scene.thumbnail),
      })),
    },
  };

  const pagePayload = {
    slug: GALLERY_PAGE_SLUG,
    hero_eyebrow: bundle.content.header.eyebrow,
    hero_title: bundle.content.header.headline,
    hero_description: null,
    hero_image_path: null,
    sections,
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (bundle.pageId) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", bundle.pageId);
    if (error) throw new Error(error.message);
    await logActivity(activityNoteForSlug(GALLERY_PAGE_SLUG));
    return;
  }

  const { data: existing } = await supabase
    .from("page_content")
    .select("id")
    .eq("slug", GALLERY_PAGE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("page_content").update(pagePayload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("page_content").insert(pagePayload);
    if (error) throw new Error(error.message);
  }
  await logActivity(activityNoteForSlug(GALLERY_PAGE_SLUG));
}
