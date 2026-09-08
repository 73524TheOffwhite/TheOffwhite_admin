import { useSyncExternalStore } from "react";
import type { DishCard, LinkButton } from "@/data/homepage-content";

export type SignatureDishesContent = {
  eyebrow: string;
  headline: string;
  button: LinkButton;
  cards: DishCard[];
};

export const DEFAULT_SIGNATURE_DISHES: SignatureDishesContent = {
  eyebrow: "Signature Dishes",
  headline: "Art on a Plate",
  button: { label: "Explore Full Menu", href: "/menu" },
  cards: [
    {
      id: "dish-1",
      image: { name: "lemon-herb-chicken.png" },
      name: "Lemon Herb Chicken",
      notes: "Herb crust · Mash · Saffron coulis",
    },
    {
      id: "dish-2",
      image: { name: "red-wine-sangria.png" },
      name: "Red Wine Sangria",
      notes: "Citrus · Brandy · Seasonal fruit",
    },
    {
      id: "dish-3",
      image: { name: "seafood-linguine.png" },
      name: "Seafood Linguine",
      notes: "Prawns · Mussels · White wine",
    },
    {
      id: "dish-4",
      image: { name: "pistachio-semifreddo.png" },
      name: "Pistachio Semifreddo",
      notes: "Honey · Crushed nuts · Dark chocolate",
    },
  ],
};

let dishes = structuredClone(DEFAULT_SIGNATURE_DISHES);
let savedSnapshot = JSON.stringify(dishes);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getSignatureDishes() {
  return dishes;
}

export function setSignatureDishes(
  next: SignatureDishesContent | ((prev: SignatureDishesContent) => SignatureDishesContent),
) {
  dishes = typeof next === "function" ? next(dishes) : next;
  emit();
}

export function isSignatureDishesDirty() {
  return JSON.stringify(dishes) !== savedSnapshot;
}

export function saveSignatureDishes() {
  savedSnapshot = JSON.stringify(dishes);
  emit();
}

/** Replace in-memory state and mark clean (used after load/save from Supabase). */
export function hydrateSignatureDishes(next: SignatureDishesContent) {
  dishes = structuredClone(next);
  savedSnapshot = JSON.stringify(dishes);
  emit();
}

export function subscribeSignatureDishes(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSharedSignatureDishes() {
  const data = useSyncExternalStore(subscribeSignatureDishes, getSignatureDishes, getSignatureDishes);
  const dirty = useSyncExternalStore(
    subscribeSignatureDishes,
    isSignatureDishesDirty,
    () => false,
  );
  return {
    dishes: data,
    setDishes: setSignatureDishes,
    dirty,
    save: saveSignatureDishes,
  };
}
