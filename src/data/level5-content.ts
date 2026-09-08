import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type FeatureCard = {
  id: string;
  icon: "guests" | "arch" | "sun" | "custom";
  title: string;
  body: string;
  customIcon?: MediaRef;
};

export type OccasionCard = {
  id: string;
  label: string;
  image: MediaRef;
  alt: string;
};

export type WalkThumb = {
  id: string;
  label: string;
  image: MediaRef;
};

export type Level5Enquiry = {
  id: string;
  date: string;
  time: string;
  guests: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
};

export type Level5Content = {
  hero: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    subline: string;
  };
  features: FeatureCard[];
  story: {
    eyebrow: string;
    title: string;
    intro: string;
    paragraphs: string[];
    pills: { id: string; label: string }[];
    closing: string;
  };
  occasions: {
    headline: string;
    cards: OccasionCard[];
  };
  note: {
    portrait: MediaRef;
    portraitAlt: string;
    headline: string;
    body: string;
    signOff: string;
    signature1: string;
    signature2: string;
  };
  walk: {
    headline: string;
    thumbs: WalkThumb[];
  };
  goldenHour: {
    background: MediaRef;
    headline: string;
    cardTitle: string;
    dateLabel: string;
    timeLabel: string;
    guestsLabel: string;
    guestOptions: string[];
    button: LinkButton;
    footerScript: string;
  };
};

export const LEVEL5_SECTIONS = [
  { id: "hero", label: "Hero", priority: "High" as const },
  { id: "features", label: "Feature highlights", priority: "Medium" as const },
  { id: "story", label: "Story & pills", priority: "High" as const },
  { id: "occasions", label: "Occasions", priority: "High" as const },
  { id: "note", label: "Note & walk", priority: "Medium" as const },
  { id: "enquiry", label: "Golden hour & enquiry", priority: "High" as const },
  { id: "inbox", label: "Enquiries inbox", priority: "Medium" as const },
] as const;

export const FEATURE_ICON_OPTIONS = [
  { value: "guests" as const, label: "Guests" },
  { value: "arch" as const, label: "Arch" },
  { value: "sun" as const, label: "Sun" },
  { value: "custom" as const, label: "Custom" },
];

export const DEFAULT_LEVEL5: Level5Content = {
  hero: {
    image: { name: "space-level5-dining.png" },
    eyebrow: "Level 5",
    headline: "Made for / beautiful / together.",
    subline: "Celebrations. Gatherings. Milestones.",
  },
  features: [
    {
      id: "feat-1",
      icon: "guests",
      title: "100 Guests",
      body: "Host unforgettable celebrations with your favourite people.",
    },
    {
      id: "feat-2",
      icon: "arch",
      title: "Double Height Ceiling",
      body: "A grand setting that adds to every moment.",
    },
    {
      id: "feat-3",
      icon: "sun",
      title: "Natural Daylight",
      body: "Bright, airy and beautiful from morning to sunset.",
    },
  ],
  story: {
    eyebrow: "The Space · Level 5",
    title: "The Private Party & Events Floor",
    intro:
      "Ascending to Level 5 reveals a versatile, beautifully appointed private party space designed for celebrations, intimate gatherings, and special occasions of up to 50 guests. This floor maintains the same refined boho-chic aesthetic as Level 4 — stone flooring, natural woods, warm neutral tones, and signature woven rattan lighting — while offering a more flexible, event-oriented layout.",
    paragraphs: [
      "A private sanctuary of refined celebration, the sophisticated aesthetic of Level 4 is elevated here by architectural drama and thoughtful functionality. The most striking feature is the soaring 30-foot-high ceilings, which infuse the entire space with a profound sense of grandeur and openness. This dramatic vertical volume creates an airy, cathedral-like expansiveness that makes even gatherings of 50 guests feel spacious and light-filled. The lofty ceilings amplify the sense of occasion while allowing light to move beautifully through the room and providing excellent natural acoustics and ventilation — ideal for everything from intimate dinners and milestone birthdays to elegant corporate events and private parties.",
      "Grounding this soaring architecture is the beautiful natural stone flooring. Its textured, timeless surface brings a sense of quiet luxury and organic authenticity, offering both visual warmth and practical resilience — a durable yet elegant foundation that handles the energy of lively celebrations with effortless grace.",
      "The space features its own stylish bar, complete with an ice-making machine — perfect for welcome drinks, signature cocktails, or a dedicated beverage station. Comfortable, adaptable seating can be configured for seated dinners, standing receptions, or a mix of both, allowing hosts to create exactly the atmosphere they envision. Visible high-quality speakers and a professional AV and mixer sound system deliver dynamic audio support for speeches, playlists, or live entertainment, giving the floor an energetic yet elegant atmosphere.",
      "Level 5 is fully air-conditioned and benefits from the venue's full diesel generator backup. Both levels share seamless access to the same state-of-the-art kitchen and tandoor, ensuring that even private events enjoy the same exceptional culinary standards and flawless service that have made The Off White Bar & Grill a standout in South Goa.",
      "Whether you're hosting a milestone birthday, an intimate wedding reception, a corporate gathering, or a special family celebration, Level 5 offers a sophisticated, private sanctuary where every detail — from the beautiful surroundings to the impeccable service and sound system — is thoughtfully curated to make your event memorable.",
    ],
    pills: [
      { id: "pill-1", label: "Up to 50 Guests" },
      { id: "pill-2", label: "Soaring 30-ft Ceilings" },
      { id: "pill-3", label: "Private Bar & Ice Machine" },
      { id: "pill-4", label: "Pro AV & Sound System" },
    ],
    closing:
      "Together, Level 4 and Level 5 of The Off White Bar & Grill represent a rare combination of refined design, warm hospitality, and practical excellence — a true destination venue in the heart of Navelim, Margao, where every guest feels both welcomed and inspired.",
  },
  occasions: {
    headline: "For every kind of celebration",
    cards: [
      {
        id: "occ-1",
        label: "Corporate\nDinners",
        image: { name: "space-level5-dining.png" },
        alt: "Corporate dinner setup on Level 5",
      },
      {
        id: "occ-2",
        label: "Private\nCelebrations",
        image: { name: "philosophy-dining.png" },
        alt: "Private celebration dining",
      },
      {
        id: "occ-3",
        label: "Engagement\nParties",
        image: { name: "space-level5.png" },
        alt: "Engagement party atmosphere",
      },
      {
        id: "occ-4",
        label: "Birthdays",
        image: { name: "space-grid-dining.png" },
        alt: "Birthday gathering",
      },
      {
        id: "occ-5",
        label: "Brand\nLaunches",
        image: { name: "space-level5-interior.png" },
        alt: "Brand launch event space",
      },
    ],
  },
  note: {
    portrait: { name: "space-level5-interior.png" },
    portraitAlt: "The Off White owners",
    headline: "A note from us.",
    body: "The Off White was never just a restaurant. It was our way of creating a place where memories are made. Thank you for letting us be a part of your special moments.",
    signOff: "With love,",
    signature1: "Mrs Arati Dileep Menon",
    signature2: "Head chef and curator Mr. Santosh Kumar Salapu",
  },
  walk: {
    headline: "Take a walk with us",
    thumbs: [
      { id: "w-1", label: "The Lounge", image: { name: "space-level5.png" } },
      { id: "w-2", label: "The Bar", image: { name: "kitchen-bar-level4.png" } },
      { id: "w-3", label: "Window Seating", image: { name: "space-grid-corridor.png" } },
      { id: "w-4", label: "The Decor Wall", image: { name: "space-brand.png" } },
      { id: "w-5", label: "Open Dining", image: { name: "space-grid-pendants.png" } },
    ],
  },
  goldenHour: {
    background: { name: "space-hero.jpg" },
    headline: "Golden hour / belongs to / your moments.",
    cardTitle: "Plan Your Celebration",
    dateLabel: "Date",
    timeLabel: "Time",
    guestsLabel: "Guests",
    guestOptions: ["5", "10", "15", "20", "25", "30", "40", "50", "75", "100"],
    button: { label: "Enquire Now", href: "/contact#reserve" },
    footerScript: "We can't wait to host you!",
  },
};

export const DEFAULT_LEVEL5_ENQUIRIES: Level5Enquiry[] = [
  {
    id: "enq-1",
    date: "2026-09-12",
    time: "7:00 PM",
    guests: "40",
    status: "new",
    createdAt: "2026-07-22T11:20:00Z",
  },
  {
    id: "enq-2",
    date: "2026-08-20",
    time: "6:30 PM",
    guests: "25",
    status: "contacted",
    createdAt: "2026-07-20T09:05:00Z",
  },
];
