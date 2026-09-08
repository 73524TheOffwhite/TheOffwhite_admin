import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type CollageSlotId = "tall" | "gridTL" | "gridTR" | "gridBL" | "gridBR";

export type CollageSlot = {
  id: CollageSlotId;
  label: string;
  image: MediaRef;
  alt: string;
};

export type MemoryImageSlide = {
  id: string;
  type: "image";
  image: MediaRef;
  alt: string;
};

export type MemoryQuoteSlide = {
  id: string;
  type: "quote";
};

export type MemorySlide = MemoryImageSlide | MemoryQuoteSlide;

export type MemoryQuote = {
  id: string;
  text: string;
  author: string;
};

export type ExperienceLevel = {
  id: string;
  levelLabel: string;
  title: string;
  description: string;
  image: MediaRef;
  imageAlt: string;
  button: LinkButton;
  decorImage: MediaRef;
};

export type PhilosophyPillarIcon = "leaf" | "heart" | "sun" | "users" | "custom";

export type PhilosophyPillar = {
  id: string;
  label: string;
  icon: PhilosophyPillarIcon;
  customIcon?: MediaRef;
};

export type TheSpaceContent = {
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    button: LinkButton;
    collage: CollageSlot[];
  };
  memories: {
    eyebrow: string;
    slides: MemorySlide[];
    quotes: MemoryQuote[];
  };
  experiences: {
    eyebrow: string;
    levels: ExperienceLevel[];
  };
  philosophy: {
    headline: string;
    body: string;
    highlight: string;
    wordmark: string;
    pillars: PhilosophyPillar[];
  };
};

export const SPACE_SECTIONS = [
  { id: "hero", label: "Hero / Intro", priority: "High" as const },
  { id: "memories", label: "Memories", priority: "High" as const },
  { id: "experiences", label: "Experiences", priority: "High" as const },
  { id: "philosophy", label: "Philosophy", priority: "Medium" as const },
] as const;

export const PILLAR_ICON_OPTIONS: { value: PhilosophyPillarIcon; label: string }[] = [
  { value: "leaf", label: "Leaf" },
  { value: "heart", label: "Heart" },
  { value: "sun", label: "Sun" },
  { value: "users", label: "Users" },
  { value: "custom", label: "Custom upload" },
];

export const DEFAULT_THE_SPACE: TheSpaceContent = {
  hero: {
    eyebrow: "The Space",
    headline: "Designed to be experienced.",
    body: "Every curve, every arch and every material is chosen to slow you down — light, texture, and quiet luxury in Navelim, South Goa.",
    button: { label: "Explore The Space", href: "#gallery" },
    collage: [
      {
        id: "tall",
        label: "Tall portrait (left)",
        image: { name: "space-entrance.png" },
        alt: "Arched entrance with neon sign at The Off White",
      },
      {
        id: "gridTL",
        label: "Grid · top left",
        image: { name: "niche.jpg" },
        alt: "Arched stone niche with dried pampas grass",
      },
      {
        id: "gridTR",
        label: "Grid · top right",
        image: { name: "space-grid-pendants.png" },
        alt: "Woven rattan pendant lights over the dining space",
      },
      {
        id: "gridBL",
        label: "Grid · bottom left",
        image: { name: "space-grid-corridor.png" },
        alt: "Stone arch corridor leading through The Off White",
      },
      {
        id: "gridBR",
        label: "Grid · bottom right",
        image: { name: "space-grid-dining.png" },
        alt: "Sunlit dining room with soft arches",
      },
    ],
  },
  memories: {
    eyebrow: "Memories Made Here",
    slides: [
      {
        id: "mem-1",
        type: "image",
        image: { name: "space-memory-celebrity.png" },
        alt: "Guests celebrating a special evening",
      },
      {
        id: "mem-2",
        type: "image",
        image: { name: "space-memory-family.png" },
        alt: "Family gathering at The Off White",
      },
      { id: "mem-3", type: "quote" },
      {
        id: "mem-4",
        type: "image",
        image: { name: "space-memory-dining.png" },
        alt: "Sunlit dining moment",
      },
      {
        id: "mem-5",
        type: "image",
        image: { name: "space-memory-cocktail.png" },
        alt: "Cocktails at the bar",
      },
    ],
    quotes: [
      {
        id: "q-1",
        text: "We got engaged here! Everything was perfect.",
        author: "Priya & Arjun",
      },
      {
        id: "q-2",
        text: "The attention to detail is unmatched — from the arches to the plates.",
        author: "Arjun R.",
      },
      {
        id: "q-3",
        text: "Felt like a vacation in the Mediterranean without leaving Goa.",
        author: "Neha D.",
      },
      {
        id: "q-4",
        text: "A hidden gem! The ambiance, the food, the warmth — unforgettable.",
        author: "Priya M.",
      },
    ],
  },
  experiences: {
    eyebrow: "Choose Your Experience",
    levels: [
      {
        id: "level-4",
        levelLabel: "Level 4",
        title: "The Evening / Chapter",
        description:
          "For the ones who love slow dinners, soft light, and conversations that stretch past dessert.",
        image: { name: "space-level4-interior.png" },
        imageAlt: "Level 4 dining room at The Off White",
        button: { label: "Explore Level 4", href: "/level-4-dining" },
        decorImage: { name: "level4-decor.png" },
      },
      {
        id: "level-5",
        levelLabel: "Level 5",
        title: "The Celebration / Chapter",
        description:
          "For the big moments — engagements, gatherings, and evenings meant to be remembered.",
        image: { name: "space-level5-dining.png" },
        imageAlt: "Level 5 airy dining space at The Off White",
        button: { label: "Explore Level 5", href: "/level-5-events" },
        decorImage: { name: "level5-decor.png" },
      },
    ],
  },
  philosophy: {
    headline: "Our Philosophy",
    body: "We believe in honest food, warm rooms, and hospitality that feels personal — never rushed, never loud.",
    highlight: "Good food. Good people. Good memories.",
    wordmark: "forever.",
    pillars: [
      { id: "p-1", label: "Honest Ingredients", icon: "leaf" },
      { id: "p-2", label: "Warm Hospitality", icon: "heart" },
      { id: "p-3", label: "Beautiful Ambience", icon: "sun" },
      { id: "p-4", label: "Meaningful Experiences", icon: "users" },
    ],
  },
};
