import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EditorShell,
  Field,
  ImageField,
  ItemToolbar,
  LinkFields,
  SectionCard,
  StringListEditor,
  moveItem,
  uid,
} from "@/components/cms/fields";
import {
  DEFAULT_LEVEL5,
  DEFAULT_LEVEL5_ENQUIRIES,
  FEATURE_ICON_OPTIONS,
  LEVEL5_SECTIONS,
  type FeatureCard,
  type Level5Content,
  type Level5Enquiry,
  type OccasionCard,
  type WalkThumb,
} from "@/data/level5-content";
import { loadLevel5Cms, saveLevel5Cms } from "@/lib/level5-cms";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Level5Editor() {
  const [content, setContent] = useState<Level5Content>(DEFAULT_LEVEL5);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_LEVEL5));
  const [enquiries, setEnquiries] = useState<Level5Enquiry[]>(DEFAULT_LEVEL5_ENQUIRIES);
  const [active, setActive] = useState("hero");
  const [inboxFilter, setInboxFilter] = useState<"all" | "new" | "contacted" | "closed">("all");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(content) !== savedSnapshot;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadLevel5Cms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Level 5 from Supabase");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await saveLevel5Cms({ content, pageId });
      const refreshed = await loadLevel5Cms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      toast.success("Level 5 saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Level 5 page");
    } finally {
      setSaving(false);
    }
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredEnquiries = enquiries.filter(
    (e) => inboxFilter === "all" || e.status === inboxFilter,
  );

  return (
    <EditorShell
      title="Level 5 content"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Events floor — hero, story, occasions, note, and celebration enquiry."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={LEVEL5_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* Capacity note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        Capacity check: hero features currently say <strong>100 Guests</strong>; story/pills say{" "}
        <strong>Up to 50 Guests</strong>. Keep one source of truth across both sections.
      </div>

      {/* 1. Hero */}
      <SectionCard
        id="hero"
        title="Hero"
        layout="Full-bleed parallax image · bottom-left text (no CTA)"
        priority="High"
      >
        <ImageField
          label="Image"
          folder="level-5"
          value={content.hero.image}
          onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))}
        />
        <Field label="Eyebrow">
          <Input
            value={content.hero.eyebrow}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: e.target.value } }))
            }
          />
        </Field>
        <Field label="Headline" hint="Use / for line breaks · heart is layout chrome">
          <Textarea
            rows={2}
            value={content.hero.headline}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Subline">
          <Input
            value={content.hero.subline}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, subline: e.target.value } }))
            }
          />
        </Field>
      </SectionCard>

      {/* 2. Features */}
      <SectionCard
        id="features"
        title="Feature highlights"
        layout="3 centered icon + text columns"
        priority="Medium"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Feature cards</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                features: [
                  ...c.features,
                  { id: uid(), icon: "guests", title: "New feature", body: "" },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add feature
          </Button>
        </div>
        {content.features.map((card, index) => (
          <FeatureEditor
            key={card.id}
            card={card}
            index={index}
            total={content.features.length}
            onChange={(next) =>
              setContent((c) => ({
                ...c,
                features: c.features.map((f) => (f.id === card.id ? next : f)),
              }))
            }
            onMove={(dir) =>
              setContent((c) => ({
                ...c,
                features: moveItem(c.features, index, dir),
              }))
            }
            onRemove={() =>
              setContent((c) => ({
                ...c,
                features: c.features.filter((f) => f.id !== card.id),
              }))
            }
          />
        ))}
      </SectionCard>

      {/* 3. Story */}
      <SectionCard
        id="story"
        title="Story / description"
        layout="Centered long-form text + pills + closing quote"
        priority="High"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.story.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, story: { ...c.story, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={content.story.title}
              onChange={(e) =>
                setContent((c) => ({ ...c, story: { ...c.story, title: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Intro">
          <Textarea
            rows={2}
            value={content.story.intro}
            onChange={(e) =>
              setContent((c) => ({ ...c, story: { ...c.story, intro: e.target.value } }))
            }
          />
        </Field>
        <StringListEditor
          title="Body paragraphs"
          addLabel="Add paragraph"
          multiline
          values={content.story.paragraphs}
          onChange={(paragraphs) =>
            setContent((c) => ({ ...c, story: { ...c.story, paragraphs } }))
          }
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Feature pills</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  story: {
                    ...c.story,
                    pills: [...c.story.pills, { id: uid(), label: "New pill" }],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add pill
            </Button>
          </div>
          {content.story.pills.map((pill, index) => (
            <div
              key={pill.id}
              className="rounded-xl border border-border bg-background/60 p-3 flex flex-wrap items-end gap-3"
            >
              <Field label="Label" className="flex-1 min-w-[160px]">
                <Input
                  value={pill.label}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      story: {
                        ...c.story,
                        pills: c.story.pills.map((p) =>
                          p.id === pill.id ? { ...p, label: e.target.value } : p,
                        ),
                      },
                    }))
                  }
                />
              </Field>
              <ItemToolbar
                onUp={() =>
                  setContent((c) => ({
                    ...c,
                    story: { ...c.story, pills: moveItem(c.story.pills, index, -1) },
                  }))
                }
                onDown={() =>
                  setContent((c) => ({
                    ...c,
                    story: { ...c.story, pills: moveItem(c.story.pills, index, 1) },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    story: {
                      ...c.story,
                      pills: c.story.pills.filter((p) => p.id !== pill.id),
                    },
                  }))
                }
                disableUp={index === 0}
                disableDown={index === content.story.pills.length - 1}
              />
            </div>
          ))}
        </div>

        <Field label="Closing line">
          <Textarea
            rows={2}
            value={content.story.closing}
            onChange={(e) =>
              setContent((c) => ({ ...c, story: { ...c.story, closing: e.target.value } }))
            }
          />
        </Field>
      </SectionCard>

      {/* 4. Occasions */}
      <SectionCard
        id="occasions"
        title="Occasions"
        layout="Header + full-bleed photo columns"
        priority="High"
      >
        <Field label="Headline">
          <Input
            value={content.occasions.headline}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                occasions: { ...c.occasions, headline: e.target.value },
              }))
            }
          />
        </Field>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Occasion cards</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setContent((c) => ({
                ...c,
                occasions: {
                  ...c.occasions,
                  cards: [
                    ...c.occasions.cards,
                    {
                      id: uid(),
                      label: "New occasion",
                      image: { name: "new-occasion.png" },
                      alt: "",
                    },
                  ],
                },
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add occasion
          </Button>
        </div>
        {content.occasions.cards.map((card, index) => (
          <OccasionEditor
            key={card.id}
            card={card}
            index={index}
            total={content.occasions.cards.length}
            onChange={(next) =>
              setContent((c) => ({
                ...c,
                occasions: {
                  ...c.occasions,
                  cards: c.occasions.cards.map((x) => (x.id === card.id ? next : x)),
                },
              }))
            }
            onMove={(dir) =>
              setContent((c) => ({
                ...c,
                occasions: {
                  ...c.occasions,
                  cards: moveItem(c.occasions.cards, index, dir),
                },
              }))
            }
            onRemove={() =>
              setContent((c) => ({
                ...c,
                occasions: {
                  ...c.occasions,
                  cards: c.occasions.cards.filter((x) => x.id !== card.id),
                },
              }))
            }
          />
        ))}
      </SectionCard>

      {/* 5. Note + Walk */}
      <SectionCard
        id="note"
        title="Note + Walk gallery"
        layout="Portrait | note from us | mini gallery"
        priority="Medium"
      >
        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <p className="text-sm font-medium">Left — portrait</p>
          <ImageField
            label="Image"
            folder="level-5"
            value={content.note.portrait}
            onChange={(portrait) =>
              setContent((c) => ({ ...c, note: { ...c.note, portrait } }))
            }
          />
          <Field label="Alt">
            <Input
              value={content.note.portraitAlt}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  note: { ...c.note, portraitAlt: e.target.value },
                }))
              }
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <p className="text-sm font-medium">Center — A note from us</p>
          <Field label="Headline">
            <Input
              value={content.note.headline}
              onChange={(e) =>
                setContent((c) => ({ ...c, note: { ...c.note, headline: e.target.value } }))
              }
            />
          </Field>
          <Field label="Body">
            <Textarea
              rows={4}
              value={content.note.body}
              onChange={(e) =>
                setContent((c) => ({ ...c, note: { ...c.note, body: e.target.value } }))
              }
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Sign-off">
              <Input
                value={content.note.signOff}
                onChange={(e) =>
                  setContent((c) => ({ ...c, note: { ...c.note, signOff: e.target.value } }))
                }
              />
            </Field>
            <Field label="Signature 1">
              <Input
                value={content.note.signature1}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    note: { ...c.note, signature1: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Signature 2">
              <Input
                value={content.note.signature2}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    note: { ...c.note, signature2: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Right — Walk gallery</p>
              <Field label="Headline" className="mt-2">
                <Input
                  value={content.walk.headline}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      walk: { ...c.walk, headline: e.target.value },
                    }))
                  }
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  walk: {
                    ...c.walk,
                    thumbs: [
                      ...c.walk.thumbs,
                      { id: uid(), label: "New stop", image: { name: "walk.png" } },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add thumb
            </Button>
          </div>
          {content.walk.thumbs.map((thumb, index) => (
            <WalkEditor
              key={thumb.id}
              thumb={thumb}
              index={index}
              total={content.walk.thumbs.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  walk: {
                    ...c.walk,
                    thumbs: c.walk.thumbs.map((t) => (t.id === thumb.id ? next : t)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  walk: { ...c.walk, thumbs: moveItem(c.walk.thumbs, index, dir) },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  walk: {
                    ...c.walk,
                    thumbs: c.walk.thumbs.filter((t) => t.id !== thumb.id),
                  },
                }))
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* 6. Golden hour + enquiry */}
      <SectionCard
        id="enquiry"
        title="Golden hour + enquiry card"
        layout="Full-bleed background · headline · booking card"
        priority="High"
      >
        <ImageField
          label="Background image"
          folder="level-5"
          value={content.goldenHour.background}
          onChange={(background) =>
            setContent((c) => ({
              ...c,
              goldenHour: { ...c.goldenHour, background },
            }))
          }
        />
        <Field label="Headline" hint="Use / for line breaks">
          <Textarea
            rows={2}
            value={content.goldenHour.headline}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                goldenHour: { ...c.goldenHour, headline: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Card title">
          <Input
            value={content.goldenHour.cardTitle}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                goldenHour: { ...c.goldenHour, cardTitle: e.target.value },
              }))
            }
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Date label">
            <Input
              value={content.goldenHour.dateLabel}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  goldenHour: { ...c.goldenHour, dateLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Time label">
            <Input
              value={content.goldenHour.timeLabel}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  goldenHour: { ...c.goldenHour, timeLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Guests label">
            <Input
              value={content.goldenHour.guestsLabel}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  goldenHour: { ...c.goldenHour, guestsLabel: e.target.value },
                }))
              }
            />
          </Field>
        </div>
        <StringListEditor
          title="Guest options"
          addLabel="Add option"
          values={content.goldenHour.guestOptions}
          onChange={(guestOptions) =>
            setContent((c) => ({
              ...c,
              goldenHour: { ...c.goldenHour, guestOptions },
            }))
          }
          placeholder="50"
        />
        <LinkFields
          label="Enquire button"
          value={content.goldenHour.button}
          onChange={(button) =>
            setContent((c) => ({
              ...c,
              goldenHour: { ...c.goldenHour, button },
            }))
          }
        />
        <Field label="Footer script">
          <Input
            value={content.goldenHour.footerScript}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                goldenHour: { ...c.goldenHour, footerScript: e.target.value },
              }))
            }
          />
        </Field>
      </SectionCard>

      {/* 7. Inbox */}
      <SectionCard
        id="inbox"
        title="Enquiries inbox"
        layout="Level 5 celebration enquiries (session → Contact)"
        priority="Medium"
      >
        <div className="flex flex-wrap gap-1.5">
          {(["all", "new", "contacted", "closed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setInboxFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border capitalize",
                inboxFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground/70 hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {filteredEnquiries.map((row) => (
            <li key={row.id} className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {row.date} · {row.time} · {row.guests} guests
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Received {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize",
                    row.status === "new" && "bg-amber-100 text-amber-800",
                    row.status === "contacted" && "bg-sky-100 text-sky-800",
                    row.status === "closed" && "bg-muted text-muted-foreground",
                  )}
                >
                  {row.status}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEnquiries((list) =>
                      list.map((e) => (e.id === row.id ? { ...e, status: "contacted" } : e)),
                    )
                  }
                >
                  Mark contacted
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setEnquiries((list) =>
                      list.map((e) => (e.id === row.id ? { ...e, status: "closed" } : e)),
                    )
                  }
                >
                  Close
                </Button>
              </div>
            </li>
          ))}
          {filteredEnquiries.length === 0 ? (
            <li className="px-4 py-10 text-center text-xs text-muted-foreground">
              No enquiries in this filter.
            </li>
          ) : null}
        </ul>
      </SectionCard>
    </EditorShell>
  );
}

function FeatureEditor({
  card,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  card: FeatureCard;
  index: number;
  total: number;
  onChange: (next: FeatureCard) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Feature {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Icon">
        <div className="flex flex-wrap gap-2">
          {FEATURE_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...card, icon: opt.value })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium border",
                card.icon === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground/70",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>
      {card.icon === "custom" ? (
        <ImageField
          label="Custom icon"
          folder="level-5"
          value={card.customIcon ?? { name: "icon.png" }}
          onChange={(customIcon) => onChange({ ...card, customIcon })}
        />
      ) : null}
      <Field label="Title">
        <Input value={card.title} onChange={(e) => onChange({ ...card, title: e.target.value })} />
      </Field>
      <Field label="Body">
        <Textarea
          rows={2}
          value={card.body}
          onChange={(e) => onChange({ ...card, body: e.target.value })}
        />
      </Field>
    </div>
  );
}

function OccasionEditor({
  card,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  card: OccasionCard;
  index: number;
  total: number;
  onChange: (next: OccasionCard) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Occasion {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Label" hint="Line breaks OK">
        <Textarea
          rows={2}
          value={card.label}
          onChange={(e) => onChange({ ...card, label: e.target.value })}
        />
      </Field>
      <ImageField
        label="Image"
        folder="level-5"
        value={card.image}
        onChange={(image) => onChange({ ...card, image })}
      />
      <Field label="Alt">
        <Input value={card.alt} onChange={(e) => onChange({ ...card, alt: e.target.value })} />
      </Field>
    </div>
  );
}

function WalkEditor({
  thumb,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  thumb: WalkThumb;
  index: number;
  total: number;
  onChange: (next: WalkThumb) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 flex flex-wrap items-end gap-3">
      <Field label="Label" className="flex-1 min-w-[140px]">
        <Input
          value={thumb.label}
          onChange={(e) => onChange({ ...thumb, label: e.target.value })}
        />
      </Field>
      <div className="flex-1 min-w-[200px]">
        <ImageField
          label="Image"
          folder="level-5"
          value={thumb.image}
          onChange={(image) => onChange({ ...thumb, image })}
        />
      </div>
      <ItemToolbar
        onUp={() => onMove(-1)}
        onDown={() => onMove(1)}
        onRemove={onRemove}
        disableUp={index === 0}
        disableDown={index === total - 1}
      />
    </div>
  );
}
