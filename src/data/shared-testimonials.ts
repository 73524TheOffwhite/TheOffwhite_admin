import { useSyncExternalStore } from "react";
import type { MediaRef, Testimonial } from "@/data/homepage-content";

export type TestimonialsContent = {
  eyebrow: string;
  ratingLine: string;
  decorImage: MediaRef;
  buttonLabel: string;
  googleUrl: string;
  reviews: Testimonial[];
};

export const DEFAULT_TESTIMONIALS: TestimonialsContent = {
  eyebrow: "What Our Guests Say",
  ratingLine: "Rated 5.0 by our guests on Google",
  decorImage: { name: "testimonials-decor.png" },
  buttonLabel: "Read More Reviews on Google",
  googleUrl: "https://g.page/the-off-white",
  reviews: [
    {
      id: "rev-1",
      quote: "An unforgettable evening — the atmosphere is as carefully composed as the plates.",
      author: "Amelia R.",
      meta: "Dinner · Anniversary",
      postedWhen: "2 weeks ago",
      rating: 5,
      showOnHome: true,
    },
    {
      id: "rev-2",
      quote: "Mediterranean soul with architectural beauty. The sangria alone is worth the visit.",
      author: "Daniel K.",
      meta: "Cocktails · Weekend",
      postedWhen: "1 month ago",
      rating: 5,
      showOnHome: true,
    },
    {
      id: "rev-3",
      quote: "Warm service, thoughtful design, and food that feels like art on a plate.",
      author: "Priya S.",
      meta: "Lunch · Friends",
      postedWhen: "3 weeks ago",
      rating: 5,
      showOnHome: true,
    },
  ],
};

let testimonials = structuredClone(DEFAULT_TESTIMONIALS);
let savedSnapshot = JSON.stringify(testimonials);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getTestimonials() {
  return testimonials;
}

export function setTestimonials(next: TestimonialsContent | ((prev: TestimonialsContent) => TestimonialsContent)) {
  testimonials = typeof next === "function" ? next(testimonials) : next;
  emit();
}

export function isTestimonialsDirty() {
  return JSON.stringify(testimonials) !== savedSnapshot;
}

export function saveTestimonials() {
  savedSnapshot = JSON.stringify(testimonials);
  emit();
}

/** Replace in-memory state and mark clean (used after load/save from Supabase). */
export function hydrateTestimonials(next: TestimonialsContent) {
  testimonials = structuredClone(next);
  savedSnapshot = JSON.stringify(testimonials);
  emit();
}

export function subscribeTestimonials(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSharedTestimonials() {
  const data = useSyncExternalStore(subscribeTestimonials, getTestimonials, getTestimonials);
  const dirty = useSyncExternalStore(
    subscribeTestimonials,
    isTestimonialsDirty,
    () => false,
  );
  return {
    testimonials: data,
    setTestimonials,
    dirty,
    save: saveTestimonials,
  };
}
