import type { MediaRef } from "@/data/homepage-content";

export type GalleryCategoryKey =
  | "all"
  | "level4"
  | "level5"
  | "food"
  | "events"
  | "tour360";

export type GalleryCategory = {
  key: GalleryCategoryKey | string;
  label: string;
  hidden: boolean;
};

export type GalleryPhoto = {
  id: string;
  image: MediaRef;
  label: string;
  category: string;
  sortOrder: number;
  featured: boolean;
  active: boolean;
};

/** Preview picks for collapsed 2×2 grid — up to 4 photo IDs per category (not tour360). */
export type PreviewSets = Record<string, string[]>;

export type TourHotspot = {
  id: string;
  targetSceneId: string;
  linkName: string;
  yaw: number;
  pitch: number;
};

export type TourScene = {
  id: string;
  name: string;
  label: string;
  panorama: MediaRef;
  thumbnail: MediaRef;
  hotspots: TourHotspot[];
};

export type GalleryContent = {
  header: {
    eyebrow: string;
    headline: string;
  };
  toggle: {
    expandLabel: string;
    collapseLabel: string;
  };
  categories: GalleryCategory[];
  photos: GalleryPhoto[];
  previewSets: PreviewSets;
  tour: {
    scenes: TourScene[];
  };
};

export const GALLERY_SECTIONS = [
  { id: "header", label: "Page header", priority: "Medium" as const },
  { id: "categories", label: "Filter tabs", priority: "High" as const },
  { id: "photos", label: "Photo library", priority: "High" as const },
  { id: "previews", label: "Preview sets", priority: "High" as const },
  { id: "tour", label: "360° Tour", priority: "High" as const },
] as const;

function photo(
  id: string,
  name: string,
  label: string,
  category: string,
  sortOrder: number,
  featured = false,
): GalleryPhoto {
  return {
    id,
    image: { name },
    label,
    category,
    sortOrder,
    featured,
    active: true,
  };
}

export const DEFAULT_GALLERY: GalleryContent = {
  header: {
    eyebrow: "Gallery",
    headline: "Moments, captured.",
  },
  toggle: {
    expandLabel: "View Full Gallery",
    collapseLabel: "Show Less",
  },
  categories: [
    { key: "all", label: "All", hidden: false },
    { key: "level4", label: "Level 4", hidden: false },
    { key: "level5", label: "Level 5", hidden: false },
    { key: "food", label: "Food", hidden: false },
    { key: "events", label: "Events", hidden: false },
    { key: "tour360", label: "360° view", hidden: false },
  ],
  photos: [
    // Level 4
    photo("p-l4-1", "gallery-l4-sunlit.jpg", "Sunlit dining", "level4", 1, true),
    photo("p-l4-2", "gallery-l4-kitchen-bar.jpg", "Kitchen & bar", "level4", 2, true),
    photo("p-l4-3", "gallery-l4-bar.jpg", "The bar", "level4", 3, true),
    photo("p-l4-4", "gallery-l4-philosophy.jpg", "Philosophy of dining", "level4", 4, true),
    photo("p-l4-5", "gallery-l4-corner.jpg", "Quiet corner", "level4", 5),
    // Level 5
    photo("p-l5-1", "gallery-l5-mural.jpg", "Mural seating", "level5", 1, true),
    photo("p-l5-2", "gallery-l5-archway.jpg", "Archway corner", "level5", 2, true),
    photo("p-l5-3", "gallery-l5-lounge.jpg", "Level 5 lounge", "level5", 3, true),
    photo("p-l5-4", "gallery-l5-celebration.jpg", "Celebration tables", "level5", 4, true),
    // Events — upload from src/assets/events (1800×2400, JPEG, under 5 MB)
    photo("p-ev-1", "image0.jpeg", "Evening gathering", "events", 1, true),
    photo("p-ev-2", "image0 (1).jpeg", "Celebration", "events", 2, true),
    photo("p-ev-3", "image1 (1).jpeg", "Guests at table", "events", 3, true),
    photo("p-ev-4", "image1 (2).jpeg", "Dining event", "events", 4, true),
    photo("p-ev-5", "image5.jpeg", "Event ambience", "events", 5),
    photo("p-ev-6", "IMG_5721.jpg", "Private event", "events", 6),
    photo("p-ev-7", "IMG_5723.jpg", "Hall gathering", "events", 7),
    // Food
    photo("p-fd-1", "gallery-fd-biryani.jpg", "Biryani", "food", 1, true),
    photo("p-fd-2", "gallery-fd-prawns.jpg", "Prawns", "food", 2, true),
    photo("p-fd-3", "gallery-fd-custard.jpg", "Custard", "food", 3, true),
    photo("p-fd-4", "gallery-fd-beef.jpg", "Beef fillet", "food", 4, true),
    photo("p-fd-5", "gallery-fd-mousse.jpg", "Mousse", "food", 5),
    photo("p-fd-6", "gallery-fd-salad.jpg", "Salad", "food", 6),
    photo("p-fd-7", "gallery-fd-sangria.jpg", "Sangria", "food", 7),
    photo("p-fd-8", "gallery-fd-paella.jpg", "Paella", "food", 8),
    photo("p-fd-9", "gallery-fd-seabass.jpg", "Sea bass", "food", 9),
    photo("p-fd-10", "gallery-fd-spritz.jpg", "Spritz", "food", 10),
    photo("p-fd-11", "gallery-fd-octopus.jpg", "Octopus", "food", 11),
    photo("p-fd-12", "gallery-fd-curry.jpg", "Curries", "food", 12),
    // 360 stills (also in All)
    photo("p-360-1", "niche.jpg", "The niche", "tour360", 1),
    photo("p-360-2", "mediterranean-arch.jpg", "Mediterranean arch", "tour360", 2),
    photo("p-360-3", "dining-panorama.jpg", "Dining room panorama", "tour360", 3),
    // All-tab featured previews (can overlap other cats via featured on those; these are all-specific picks)
    photo("p-all-1", "chatgpt-preview-1.jpg", "Entrance light", "level4", 10, true),
    photo("p-all-2", "chatgpt-preview-2.jpg", "Table setting", "events", 10, true),
    photo("p-all-3", "chatgpt-preview-3.jpg", "Plate detail", "food", 20, true),
    photo("p-all-4", "chatgpt-preview-4.jpg", "Lounge glow", "level5", 10, true),
  ],
  previewSets: {
    all: ["p-all-1", "p-all-2", "p-all-3", "p-all-4"],
    level4: ["p-l4-1", "p-l4-2", "p-l4-3", "p-l4-4"],
    level5: ["p-l5-1", "p-l5-2", "p-l5-3", "p-l5-4"],
    food: ["p-fd-1", "p-fd-2", "p-fd-3", "p-fd-4"],
    events: ["p-ev-1", "p-ev-2", "p-ev-3", "p-ev-4"],
  },
  tour: {
    scenes: [
      {
        id: "entrance",
        name: "Lounge",
        label: "Café lounge",
        panorama: { name: "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/industrial_sunset_puresky.jpg" },
        thumbnail: { name: "niche.jpg" },
        hotspots: [
          { id: "hs-1", targetSceneId: "arch", linkName: "To Bar", yaw: 45, pitch: 0 },
          { id: "hs-2", targetSceneId: "dining", linkName: "To Dining", yaw: -30, pitch: -5 },
        ],
      },
      {
        id: "arch",
        name: "Bar",
        label: "Bar & lounge",
        panorama: { name: "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/lebombo.jpg" },
        thumbnail: { name: "space-bar.jpg" },
        hotspots: [
          { id: "hs-3", targetSceneId: "entrance", linkName: "To Lounge", yaw: 180, pitch: 0 },
          { id: "hs-4", targetSceneId: "dining", linkName: "To Dining", yaw: 90, pitch: -2 },
        ],
      },
      {
        id: "dining",
        name: "Dining",
        label: "Dining room",
        panorama: { name: "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/veranda.jpg" },
        thumbnail: { name: "space-dining.jpg" },
        hotspots: [
          { id: "hs-5", targetSceneId: "entrance", linkName: "To Lounge", yaw: -90, pitch: 0 },
          { id: "hs-6", targetSceneId: "arch", linkName: "To Bar", yaw: 120, pitch: 2 },
        ],
      },
    ],
  },
};
