import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type SlideImage = {
  id: string;
  image: MediaRef;
  alt: string;
};

export type FounderCard = {
  id: string;
  name: string;
  role: string;
  paragraphs: string[];
};

export type ValueCard = {
  id: string;
  title: string;
  body: string;
};

export type StatItem = {
  id: string;
  value: string;
  label: string;
};

export type AboutContent = {
  hero: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    description: string;
    breadcrumb: string;
  };
  philosophy: {
    eyebrow: string;
    headline: string;
    body1: string;
    body2: string;
    slides: SlideImage[];
  };
  founders: {
    eyebrow: string;
    headline: string;
    intro: string[];
    cards: FounderCard[];
    valuesEyebrow: string;
    valuesParagraphs: string[];
    closingLines: string[];
    socialHandles: string[];
  };
  values: {
    eyebrow: string;
    headline: string;
    cards: ValueCard[];
  };
  stats: StatItem[];
  kitchen: {
    eyebrow: string;
    headline: string;
    body: string;
    attribution: string;
    button: LinkButton;
    slides: SlideImage[];
  };
};

export const ABOUT_SECTIONS = [
  { id: "hero", label: "Page Hero", priority: "Medium" as const },
  { id: "philosophy", label: "Philosophy", priority: "High" as const },
  { id: "founders", label: "Founder Story", priority: "High" as const },
  { id: "values", label: "Values", priority: "Medium" as const },
  { id: "stats", label: "Stats", priority: "Medium" as const },
  { id: "kitchen", label: "From the Kitchen", priority: "High" as const },
  { id: "testimonials", label: "Testimonials", priority: "Low" as const },
] as const;

export const DEFAULT_ABOUT: AboutContent = {
  hero: {
    image: { name: "story-arch.jpg" },
    eyebrow: "Our Story",
    headline: "A Quiet Devotion / to Detail",
    description:
      "The Off White began as a shared dream — a place where Mediterranean soul meets Goan warmth, set among arches and quiet light in Navelim, South Goa.",
    breadcrumb: "About",
  },
  philosophy: {
    eyebrow: "Our Philosophy",
    headline: "Cooking the way the coast remembers it.",
    body1:
      "We source quietly — small fishermen at dawn, farms that still know the names of their soil, bakers who start before the village wakes. Nothing loud. Nothing rushed.",
    body2:
      "The kitchen is led by a small team who cook as if every plate will be remembered. Technique matters. Restraint matters more.",
    slides: [
      {
        id: "phil-1",
        image: { name: "philosophy-chef-santosh.png" },
        alt: "Head Chef Santosh at The Off White",
      },
      {
        id: "phil-2",
        image: { name: "philosophy-dining.png" },
        alt: "Level 5 dining room",
      },
    ],
  },
  founders: {
    eyebrow: "Vision, Partnership & Excellence",
    headline: "The Off White Bar & Grill Story",
    intro: [
      "The Off White Bar & Grill was born from a belief that hospitality can be both intimate and ambitious — a room where architecture, cuisine, and conversation share the same quiet confidence.",
      "What began as a conversation between partners became a carefully composed space in South Goa: lime-washed calm, Mediterranean flavours, and a kitchen devoted to craft.",
    ],
    cards: [
      {
        id: "founder-1",
        name: "Arati Menon",
        role: "Managing Partner & Visionary",
        paragraphs: [
          "Arati imagined The Off White as more than a restaurant — a gathering place shaped by light, texture, and the slow rituals of Mediterranean living.",
          "Her eye for detail guides everything from the hush of the dining room to the way a table is set at dusk.",
          "She believes hospitality begins before the first plate arrives: in the welcome, the pacing, the sense that every guest has been considered.",
          "Under her direction, the brand stays intimate even as it grows — never louder than the experience itself.",
          "She works closely with the kitchen and floor teams to keep service personal, unhurried, and precise.",
          "For Arati, excellence is quiet: felt in the room long after the evening ends.",
        ],
      },
      {
        id: "founder-2",
        name: "Dileep Menon",
        role: "Strategic Partner & Primary Investor",
        paragraphs: [
          "Dileep brought the strategic backbone that turned a vision into a lasting house — structure without sacrificing soul.",
          "His focus is long-term craft: building a place guests return to, season after season.",
          "He champions patience in growth, preferring depth over spectacle and consistency over trend.",
          "From partnerships to planning, he keeps The Off White grounded in sustainable hospitality.",
          "Together with the founding team, he protects the standard that makes the room feel inevitable.",
        ],
      },
      {
        id: "founder-3",
        name: "Chef Santhosh Kumar Salapu",
        role: "Head Chef & Culinary Curator",
        paragraphs: [
          "Chef Santhosh leads a kitchen that cooks with coastal memory — bright herbs, clean fire, and plates that feel composed rather than crowded.",
          "His menus honour Mediterranean soul while listening to Goan produce and seasonality.",
          "He insists on in-house craft: breads, sauces, and sweets made with the same care as the mains.",
          "In service, he values rhythm — hot food hot, quiet tables kept quiet, generosity without excess.",
          "Every dish is an invitation to slow down and taste with attention.",
        ],
      },
    ],
    valuesEyebrow: "A Partnership Built on Shared Values",
    valuesParagraphs: [
      "The Off White rests on trust between partners who share the same patience for craft.",
      "We believe a great room is built slowly — through people, produce, and places that feel honest.",
      "Design and cuisine are not separate languages here; they answer each other.",
      "Guests are treated as companions for an evening, not traffic through a shift.",
      "What we refuse is noise: of trends, of shortcuts, of hospitality without heart.",
    ],
    closingLines: [
      "Come for the light. Stay for the quiet generosity of a table well kept.",
      "Architecture that softens. Food that remembers the coast.",
      "A house in Navelim, made for lingering.",
      "Welcome to The Off White.",
    ],
    socialHandles: ["@offwhitegoa", "@thewhitegoa"],
  },
  values: {
    eyebrow: "What We Stand For",
    headline: "Three quiet principles",
    cards: [
      {
        id: "val-1",
        title: "Mediterranean Soul",
        body: "Sun-soaked flavours, olive oil, citrus, and herbs — cooking that feels warm, generous, and unhurried.",
      },
      {
        id: "val-2",
        title: "Crafted by Hand",
        body: "From the breads we bake to the sauces we finish to order, craft is not a flourish. It is the method.",
      },
      {
        id: "val-3",
        title: "Architecture of Calm",
        body: "Arches, lime-washed walls, and soft light create a room that asks you to breathe slower.",
      },
    ],
  },
  stats: [
    { id: "stat-1", value: "12+", label: "Years of craft" },
    { id: "stat-2", value: "08", label: "Signature dishes" },
    { id: "stat-3", value: "100%", label: "Made in-house" },
    { id: "stat-4", value: "4.9", label: "Guest rating" },
  ],
  kitchen: {
    eyebrow: "From the Kitchen",
    headline: '"A great meal is just attention, given generously."',
    body: "Our kitchen is small by design — close enough for conversation, focused enough for craft. Every service is a practice in attention.",
    attribution: "— The Off White Kitchen",
    button: { label: "See What's Cooking", href: "/menu" },
    slides: [
      {
        id: "kit-1",
        image: { name: "kitchen-bar-level4.png" },
        alt: "Level 4 bar at The Off White",
      },
      {
        id: "kit-2",
        image: { name: "kitchen-bartender.png" },
        alt: "Bartender crafting cocktails at The Off White",
      },
    ],
  },
};
