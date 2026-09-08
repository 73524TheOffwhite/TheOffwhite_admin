import type { LinkButton, MediaRef } from "@/data/homepage-content";

export type MenuItemStatus = "available" | "sold_out" | "hidden";

export type MenuItem = {
  id: string;
  name: string;
  notes: string;
  price: string;
  image: MediaRef;
  blurb: string;
  preparation: string;
  pairing: string;
  allergens: string;
  status: MenuItemStatus;
};

export type MenuCategory = {
  id: string;
  label: string;
  intro: string;
  items: MenuItem[];
};

export type MenuPageContent = {
  hero: {
    image: MediaRef;
    eyebrow: string;
    headline: string;
    description: string;
    breadcrumb: string;
  };
  aLaCarte: {
    eyebrow: string;
    headline: string;
    taxNote: string;
    button: LinkButton;
    categories: MenuCategory[];
  };
};

export const MENU_SECTIONS = [
  { id: "hero", label: "Page Hero", priority: "Medium" as const },
  { id: "alacarte", label: "À la Carte", priority: "High" as const },
  { id: "dishes", label: "Signature Dishes", priority: "Low" as const },
] as const;

function item(
  id: string,
  name: string,
  notes: string,
  price: string,
  image: string,
  blurb: string,
  preparation: string,
  pairing: string,
  allergens: string,
): MenuItem {
  return {
    id,
    name,
    notes,
    price,
    image: { name: image },
    blurb,
    preparation,
    pairing,
    allergens,
    status: "available",
  };
}

export const DEFAULT_MENU: MenuPageContent = {
  hero: {
    image: { name: "menu-hero.png" },
    eyebrow: "The Menu",
    headline: "Made slowly, / served generously.",
    description:
      "A short menu, written by the season — Mediterranean soul, coastal produce, and plates meant for sharing.",
    breadcrumb: "Menu",
  },
  aLaCarte: {
    eyebrow: "À la Carte",
    headline: "Choose your chapter",
    taxNote: "All prices in INR, exclusive of taxes",
    button: { label: "Reserve a Table", href: "/events" },
    categories: [
      {
        id: "starters",
        label: "Starters",
        intro: "Small plates, large gestures.",
        items: [
          item(
            "st-1",
            "Burrata & Heirloom Tomatoes",
            "Aged balsamic · Basil oil · Sea salt",
            "₹ 680",
            "dish-ravioli.jpg",
            "Creamy burrata with sun-ripened tomatoes and a soft hit of basil.",
            "Tomatoes dressed warm; burrata torn tableside with basil oil.",
            "Crisp Vermentino",
            "Dairy",
          ),
          item(
            "st-2",
            "Tuna Tartare",
            "Citrus · Capers · Crispy shallot",
            "₹ 820",
            "dish-seabass.jpg",
            "Clean, bright tuna cut by hand and finished with citrus heat.",
            "Hand-cut tuna, chilled; finished with citrus and crisp shallot.",
            "Garden Gimlet",
            "Fish · Sesame",
          ),
          item(
            "st-3",
            "Truffle Arancini",
            "Parmesan · Wild mushroom · Herb aioli",
            "₹ 620",
            "dish-ravioli.jpg",
            "Golden risotto bites with a quiet truffle warmth.",
            "Arborio risotto cooled, rolled, and fried to order.",
            "Light Pinot Noir",
            "Dairy · Gluten",
          ),
          item(
            "st-4",
            "Grilled Octopus",
            "Paprika oil · Lemon · Soft potato",
            "₹ 980",
            "dish-octopus.jpg",
            "Charred tentacles, tender centre, Mediterranean heat.",
            "Slow-poached then grilled over high flame.",
            "Saffron Negroni",
            "Mollusc",
          ),
          item(
            "st-5",
            "Charred Aubergine",
            "Tahini · Pomegranate · Mint",
            "₹ 560",
            "dish-ravioli.jpg",
            "Smoke, cream, and bright fruit in one soft plate.",
            "Aubergine blistered until collapsing; dressed cold.",
            "Signature Off White Spritz",
            "Sesame",
          ),
        ],
      },
      {
        id: "mains",
        label: "Mains",
        intro: "The heart of the table.",
        items: [
          item(
            "mn-1",
            "Herb Crusted Sea Bass",
            "Saffron broth · Fennel · Soft herbs",
            "₹ 1,480",
            "dish-seabass.jpg",
            "Crisp skin, gentle flesh, and a broth that smells of the coast.",
            "Pan-roasted with herb crust; finished in saffron broth.",
            "Chablis or crisp local white",
            "Fish",
          ),
          item(
            "mn-2",
            "Lemon Herb Chicken",
            "Herb crust · Mash · Saffron coulis",
            "₹ 1,280",
            "dish-seabass.jpg",
            "Bright lemon, soft mash, and a plate built for comfort.",
            "Roasted slowly; rested and carved to order.",
            "Mediterranean Mule",
            "Dairy",
          ),
          item(
            "mn-3",
            "Seafood Linguine",
            "Prawns · Mussels · White wine",
            "₹ 1,420",
            "dish-octopus.jpg",
            "A coastal classic — brine, butter, and al dente pasta.",
            "Pasta finished in the pan with shellfish liquor.",
            "Signature Off White Spritz",
            "Shellfish · Gluten · Dairy",
          ),
          item(
            "mn-4",
            "Grilled Lamb Cutlets",
            "Rosemary · Charred greens · Jus",
            "₹ 1,680",
            "dish-seabass.jpg",
            "Fire-kissed lamb with rosemary and a deep, quiet jus.",
            "Grilled over open flame; rested before plating.",
            "Smoked Old Fashioned",
            "None listed",
          ),
          item(
            "mn-5",
            "Truffle Ravioli",
            "Brown butter · Sage · Aged parmesan",
            "₹ 1,180",
            "dish-ravioli.jpg",
            "Handmade pillows with earthy truffle and nutty butter.",
            "Fresh pasta filled daily; finished in brown butter.",
            "Light red or sparkling",
            "Dairy · Gluten · Egg",
          ),
          item(
            "mn-6",
            "Wood-Fired Margherita",
            "San Marzano · Basil · Fior di latte",
            "₹ 780",
            "dish-ravioli.jpg",
            "Simple, blistered, and built for sharing.",
            "Wood-fired until leopard-spotted.",
            "Garden Gimlet",
            "Dairy · Gluten",
          ),
        ],
      },
      {
        id: "desserts",
        label: "Desserts",
        intro: "A quiet ending.",
        items: [
          item(
            "ds-1",
            "Tiramisu",
            "Espresso · Mascarpone · Cocoa",
            "₹ 520",
            "dish-ravioli.jpg",
            "Soft layers, bitter coffee, and a clean cocoa finish.",
            "Assembled cold; rested overnight.",
            "Espresso or dessert wine",
            "Dairy · Egg · Gluten",
          ),
          item(
            "ds-2",
            "Chocolate Delice",
            "Dark ganache · Sea salt · Olive oil",
            "₹ 580",
            "dish-ravioli.jpg",
            "Dense chocolate with a Mediterranean olive-oil lift.",
            "Set ganache; plated with warm edges.",
            "Saffron Negroni",
            "Dairy",
          ),
          item(
            "ds-3",
            "Pistachio Semifreddo",
            "Honey · Crushed nuts · Dark chocolate",
            "₹ 560",
            "dish-ravioli.jpg",
            "Frozen silk with pistachio and a bitter-chocolate edge.",
            "Churned and set; sliced to order.",
            "Sweet Muscat",
            "Nuts · Dairy · Egg",
          ),
          item(
            "ds-4",
            "Lemon Tart",
            "Shortcrust · Soft curd · Burnt sugar",
            "₹ 480",
            "dish-seabass.jpg",
            "Sharp lemon, buttery crust, and a caramelised top.",
            "Curd set in baked shell; finished under heat.",
            "Garden Gimlet",
            "Dairy · Egg · Gluten",
          ),
        ],
      },
      {
        id: "cocktails",
        label: "Cocktails",
        intro: "Stirred, not hurried.",
        items: [
          item(
            "ck-1",
            "Signature Off White Spritz",
            "Prosecco · Bitter citrus · Soft herbs",
            "₹ 650",
            "dish-spritz.jpg",
            "Light, floral, and built for long evenings.",
            "Built in glass over ice; finished with herbs.",
            "Pairs with starters",
            "Sulphites",
          ),
          item(
            "ck-2",
            "Saffron Negroni",
            "Gin · Bitter · Saffron vermouth",
            "₹ 720",
            "dish-spritz.jpg",
            "A classic frame with a quiet saffron warmth.",
            "Stirred down; served over a large cube.",
            "Pairs with octopus or lamb",
            "None listed",
          ),
          item(
            "ck-3",
            "Garden Gimlet",
            "Gin · Lime · Fresh herbs",
            "₹ 680",
            "dish-spritz.jpg",
            "Bright, green, and sharply refreshing.",
            "Shaken hard; fine-strained.",
            "Pairs with tartare or margherita",
            "None listed",
          ),
          item(
            "ck-4",
            "Smoked Old Fashioned",
            "Whiskey · Demerara · Orange smoke",
            "₹ 780",
            "dish-spritz.jpg",
            "Deep, smoky, and unhurried.",
            "Stirred; smoke-finished tableside.",
            "Pairs with lamb cutlets",
            "None listed",
          ),
          item(
            "ck-5",
            "Mediterranean Mule",
            "Vodka · Ginger · Citrus · Olive brine",
            "₹ 640",
            "dish-spritz.jpg",
            "A mule with coastal salinity and spice.",
            "Built tall over crushed ice.",
            "Pairs with chicken or spritz hour",
            "None listed",
          ),
        ],
      },
    ],
  },
};
