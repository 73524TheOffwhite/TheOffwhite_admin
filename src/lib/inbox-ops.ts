export type InboxKind = "message";

export type InboxItem = {
  id: string;
  kind: InboxKind;
  name: string;
  preview: string;
  createdAt: string;
  unread: boolean;
  avatarTone?: string;
};

const now = Date.now();

export const SEED_MESSAGES: InboxItem[] = [
  {
    id: "msg-1",
    kind: "message",
    name: "Priya Mehta",
    preview: "Can we move our table to 8:30 PM tonight?",
    createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
    unread: true,
    avatarTone: "bg-amber-100 text-amber-800",
  },
  {
    id: "msg-2",
    kind: "message",
    name: "Arjun Kapoor",
    preview: "Thanks for confirming Level 5 for Saturday.",
    createdAt: new Date(now - 1000 * 60 * 48).toISOString(),
    unread: true,
    avatarTone: "bg-sky-100 text-sky-800",
  },
  {
    id: "msg-3",
    kind: "message",
    name: "Neha D'Souza",
    preview: "Is outdoor seating available this Sunday?",
    createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
    unread: false,
    avatarTone: "bg-rose-100 text-rose-800",
  },
  {
    id: "msg-4",
    kind: "message",
    name: "Rohan Shah",
    preview: "Please note vegetarian preferences for our party of 6.",
    createdAt: new Date(now - 1000 * 60 * 220).toISOString(),
    unread: false,
    avatarTone: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "msg-5",
    kind: "message",
    name: "Sara Khan",
    preview: "Could you send the tasting menu PDF?",
    createdAt: new Date(now - 1000 * 60 * 400).toISOString(),
    unread: false,
    avatarTone: "bg-violet-100 text-violet-800",
  },
];

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
