import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type CollageImageSlot = {
  id: "dining" | "brand" | "bar";
  label: string;
  image: MediaRef;
  alt: string;
};

export type Level4Content = {
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    buttonLabel: string;
  };
  collage: CollageImageSlot[];
  mood: {
    quoteLines: string[];
    button: LinkButton;
  };
  story: {
    eyebrow: string;
    title: string;
    intro: string;
    paragraphs: string[];
    features: { id: string; label: string }[];
  };
};

export const LEVEL4_SECTIONS = [
  { id: "hero", label: "Hero & collage", priority: "High" as const },
  { id: "mood", label: "Mood block", priority: "Medium" as const },
  { id: "story", label: "Story & features", priority: "High" as const },
] as const;

export const DEFAULT_LEVEL4: Level4Content = {
  hero: {
    eyebrow: "Level 4",
    headline: "For conversations that deserve time.",
    body: "The kind of evening you'll remember next year. Not because of what you ate. Because of who you shared it with.",
    buttonLabel: "Explore Level 4",
  },
  collage: [
    {
      id: "dining",
      label: "Main dining",
      image: { name: "space-level4-interior.png" },
      alt: "Level 4 dining room with woven pendants, stone walls and neon sign",
    },
    {
      id: "brand",
      label: "Brand / niches",
      image: { name: "space-brand.png" },
      alt: "Arched niches with sculptures and warm ambient lighting",
    },
    {
      id: "bar",
      label: "Bar",
      image: { name: "kitchen-bar-level4.png" },
      alt: "Level 4 bar with bamboo slats and curved bottle display",
    },
  ],
  mood: {
    quoteLines: [
      "The light changes.",
      "The mood changes.",
      "The evening unfolds.",
    ],
    button: { label: "Discover More", href: "/contact#reserve" },
  },
  story: {
    eyebrow: "The Space · Level 4",
    title: "The Signature Fine Dining & Bar Experience",
    intro:
      "Step into Level 4 of The Off White Bar & Grill and you enter a space that feels both sophisticated and deeply welcoming — South Goa's refined yet relaxed fine dining destination, where boho-chic elegance meets thoughtful modern comfort.",
    paragraphs: [
      "The interiors are a masterclass in layered, organic luxury. A warm, neutral palette of creamy off-whites, soft beiges, and rich natural wood tones creates an airy, sunlit atmosphere, beautifully complemented by textured stone accent walls and pillars that add depth and character. Large, sculptural woven rattan pendant lights cascade from the ceiling in generous clusters, casting patterned shadows and bathing the space in a soft, golden glow that feels intimate even when the room is full.",
      "Comfortable rattan and wicker chairs with plush cushions surround crisp off-white-topped tables, while thoughtful design details — arched niches filled with dried grasses and potted plants, delicate macramé and dreamcatcher accents, and carefully curated ceramics — add layers of texture and warmth. A striking arched passageway leads the eye toward a serene painted mural, enhancing the sense of escape and tranquillity.",
      "The windows on Level 4 are luminous portals that breathe life and light into the space. Tall and elegantly proportioned, they are framed with warm, natural wood that echoes the organic tones of the rattan chandeliers and wooden furniture. Bathed in abundant natural daylight, they allow golden streams of sunlight to cascade across the room, gently illuminating the textured stone walls. In the evening, as the light softens, the same windows reflect the warm radiance of the rattan lights, maintaining the space's intimate yet airy charm long after sunset.",
      "The well-appointed bar anchors one end of the space, offering a stylish yet approachable counter where guests can enjoy creative cocktails or a glass of wine before or after their meal. Concealed speakers ensure subtle, high-quality background music or AV support without intruding on conversation. The entire level is fully air-conditioned, and the venue's robust diesel generator backup guarantees uninterrupted comfort and service even during power fluctuations.",
      "With direct access to the state-of-the-art kitchen and traditional tandoor, Level 4 delivers seamless, high-quality global cuisine with Indian soul — from perfectly grilled meats and seafood to refined vegetarian offerings, all served in an ambiance that makes every meal feel special. Whether for an intimate dinner, a business lunch, or a leisurely evening with friends, Level 4 strikes the perfect balance between elegance and ease.",
    ],
    features: [
      { id: "f-1", label: "Fully Air-Conditioned" },
      { id: "f-2", label: "Diesel Generator Backup" },
      { id: "f-3", label: "Craft Cocktail Bar" },
      { id: "f-4", label: "Tandoor & Global Kitchen" },
    ],
  },
};
