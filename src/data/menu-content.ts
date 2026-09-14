import type { MediaRef } from "@/data/homepage-content";

/** Visual menu dish — matches live `/menu` grid (image + name). */
export type VisualMenuDish = {
  id: string;
  name: string;
  image: MediaRef;
};

export type MenuPageContent = {
  hero: {
    image: MediaRef;
    mobileImage: MediaRef;
    eyebrow: string;
    headline: string;
    description: string;
    breadcrumb: string;
  };
  selection: {
    eyebrow: string;
    headline: string;
    intro: string;
  };
  dishes: VisualMenuDish[];
};

export const MENU_SECTIONS = [
  { id: "hero", label: "Page Hero", priority: "Medium" as const },
  { id: "selection", label: "Selection header", priority: "High" as const },
  { id: "visual", label: "Dish grid", priority: "High" as const },
  { id: "dishes", label: "Signature Dishes", priority: "Low" as const },
] as const;

/** Same display-name transform as the live Menu page. */
export function dishNameFromFile(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function dish(fileName: string): VisualMenuDish {
  return {
    id: fileName,
    name: dishNameFromFile(fileName),
    image: { name: fileName },
  };
}

/** Filenames match `TheOffwhite_MainSite/src/assets/menu/` (live final). */
export const LIVE_MENU_DISH_FILES = [
  "baklava.jpg",
  "chicken_burani_kebab.jpg",
  "coq_au_vin.jpg",
  "cottage_cheese_steak.jpg",
  "french_pepper_steak.jpg",
  "freshly_baked_chocolate_cookie_with_icecream.jpg",
  "grain_mustard_fish_fillet.jpg",
  "greek_tenderloin_steak_with_creamy_mushroom_sauce.jpg",
  "healthy_oats_tikki.jpg",
  "irani_fish_kebab.jpg",
  "kholapuri_mutton_lonche.jpg",
  "mushrooms_baked_with_cheese.jpg",
  "mutton_dum_phukt.jpg",
  "mutton_nalupu.jpg",
  "nali_nihari_with_khameeri_roti.jpg",
  "nellore_style_beef_roast.jpg",
  "offwhite_special_mutton_chops.jpg",
  "offwhite_veg_special_salad.jpg",
  "orange_gin_basil_smash.jpg",
  "Palleturu_mutton_pulao.jpg",
  "paneer_triyaki_poke_bowl.jpg",
  "spicy_green_guava_cocktail.jpg",
  "thai_port_stir_fry_withcashew_and_asparagus.jpg",
  "Watermelon_Avocado_Wasabi_Shrimps.jpg",
] as const;

export const DEFAULT_MENU: MenuPageContent = {
  hero: {
    image: { name: "Gemini_Generated_Image_nwgy8znwgy8znwgy.jpg" },
    mobileImage: { name: "menu-hero-mobile-04-kitchen-background.jpg" },
    eyebrow: "The Visual Menu",
    headline: "Made slowly,\nserved generously.",
    description: "Every plate, photographed and detailed. Tap any dish to read its full story.",
    breadcrumb: "Menu",
  },
  selection: {
    eyebrow: "The Selection",
    headline: "Choose your chapter",
    intro: "The heart of the table",
  },
  dishes: LIVE_MENU_DISH_FILES.map((file) => dish(file)),
};
