export type LinkButton = {
  label: string;
  href: string;
};

export type MediaRef = {
  name: string;
  previewUrl?: string;
  /** Supabase Storage object path inside the `media` bucket */
  path?: string;
};

export type DishCard = {
  id: string;
  image: MediaRef;
  name: string;
  notes: string;
};

export type SpaceCard = {
  id: string;
  image: MediaRef;
  label: string;
};

export type MenuColumn = {
  id: string;
  title: string;
  items: string[];
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  meta: string;
  postedWhen: string;
  rating: number;
  showOnHome: boolean;
};

export type HomepageContent = {
  hero: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    button1: LinkButton;
    button2: LinkButton;
    scrollLabel: string;
    scrollHref: string;
  };
  story: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    body: string;
    button: LinkButton;
  };
  space: {
    eyebrow: string;
    headline: string;
    button: LinkButton;
    cards: SpaceCard[];
  };
  menuPreview: {
    eyebrow: string;
    headline: string;
    button: LinkButton;
    columns: MenuColumn[];
    reservation: {
      eyebrow: string;
      headline: string;
      submitLabel: string;
    };
  };
};

export const DEFAULT_HOMEPAGE: HomepageContent = {
  hero: {
    image: { name: "hero.jpg" },
    eyebrow: "Fine Dining · Crafted Cocktails · Mediterranean Soul",
    headline: "Where Architecture / Meets Cuisine",
    button1: { label: "Reserve a Table", href: "/events" },
    button2: { label: "View Menu", href: "#menu" },
    scrollLabel: "Scroll Down",
    scrollHref: "#story",
  },
  story: {
    image: { name: "story-arch.jpg" },
    eyebrow: "Our Story",
    headline: "Inspired by Mediterranean Living & Timeless Design",
    body: "The Off White Bar & Grill is more than a restaurant. It is a gathering place shaped by Mediterranean living, warm hospitality, and architecture that invites you to stay a little longer.",
    button: { label: "Discover Our Story", href: "/about" },
  },
  space: {
    eyebrow: "The Space",
    headline: "Every Corner Has a Story",
    button: { label: "View Gallery", href: "/gallery" },
    cards: [
      { id: "space-1", image: { name: "space-bar.png" }, label: "The Bar" },
      { id: "space-2", image: { name: "space-archway-corner.png" }, label: "The Archway Corner" },
      { id: "space-3", image: { name: "space-mural.png" }, label: "The Mural Seating" },
      { id: "space-4", image: { name: "space-dining.png" }, label: "The Sunlit Dining" },
    ],
  },
  menuPreview: {
    eyebrow: "Menu Preview",
    headline: "A Taste of What Awaits",
    button: { label: "Explore Full Menu", href: "/menu" },
    columns: [
      {
        id: "col-starters",
        title: "Starters",
        items: ["Burrata & Heirloom Tomatoes", "Tuna Tartare", "Truffle Arancini"],
      },
      {
        id: "col-mains",
        title: "Mains",
        items: ["Lemon Herb Chicken", "Seafood Linguine", "Grilled Lamb Cutlets"],
      },
      {
        id: "col-desserts",
        title: "Desserts",
        items: ["Tiramisu", "Chocolate Delice", "Pistachio Semifreddo"],
      },
    ],
    reservation: {
      eyebrow: "Reservation",
      headline: "Book Your Table",
      submitLabel: "Reserve Your Table",
    },
  },
};

export const SECTIONS = [
  { id: "hero", label: "Hero", priority: "High" as const },
  { id: "story", label: "Our Story", priority: "Medium" as const },
  { id: "dishes", label: "Signature Dishes", priority: "High" as const },
  { id: "space", label: "The Space", priority: "High" as const },
  { id: "menu", label: "Menu & Booking", priority: "Medium" as const },
  { id: "testimonials", label: "Testimonials", priority: "High" as const },
] as const;
