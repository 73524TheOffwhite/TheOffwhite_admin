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
  moveItem,
  uid,
} from "@/components/cms/fields";
import {
  DEFAULT_THE_SPACE,
  PILLAR_ICON_OPTIONS,
  SPACE_SECTIONS,
  type ExperienceLevel,
  type MemoryQuote,
  type MemorySlide,
  type PhilosophyPillar,
  type TheSpaceContent,
} from "@/data/the-space-content";
import { cn } from "@/lib/utils";
import { loadSpaceCms, saveSpaceCms } from "@/lib/space-cms";
import { toast } from "sonner";

export default function TheSpaceEditor() {
  const [content, setContent] = useState<TheSpaceContent>(DEFAULT_THE_SPACE);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_THE_SPACE));
  const [active, setActive] = useState("hero");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(content) !== savedSnapshot;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadSpaceCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load The Space from Supabase");
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
      await saveSpaceCms({ content, pageId });
      const refreshed = await loadSpaceCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      toast.success("The Space saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save The Space page");
    } finally {
      setSaving(false);
    }
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <EditorShell
      title="The Space page content"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Separate from Homepage’s Space strip — manage this page’s visuals and copy."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={SPACE_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Hero */}
      <SectionCard
        id="hero"
        title="Hero / Intro"
        layout="Left text · right 5-image collage (1 tall + 4 grid)"
        priority="High"
      >
        <Field label="Eyebrow">
          <Input
            value={content.hero.eyebrow}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: e.target.value } }))}
          />
        </Field>
        <Field label="Headline">
          <Input
            value={content.hero.headline}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))}
          />
        </Field>
        <Field label="Body">
          <Textarea
            rows={3}
            value={content.hero.body}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, body: e.target.value } }))}
          />
        </Field>
        <LinkFields
          label="Button / link"
          value={content.hero.button}
          onChange={(button) => setContent((c) => ({ ...c, hero: { ...c.hero, button } }))}
        />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Collage images</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fixed layout slots — replace image and edit alt only (no add/delete).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.hero.collage.map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  "rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3",
                  slot.id === "tall" && "md:row-span-2",
                )}
              >
                <p className="text-xs font-semibold text-muted-foreground">{slot.label}</p>
                <ImageField
                  label="Image"
                  folder="the-space"
                  value={slot.image}
                  onChange={(image) =>
                    setContent((c) => ({
                      ...c,
                      hero: {
                        ...c.hero,
                        collage: c.hero.collage.map((s) => (s.id === slot.id ? { ...s, image } : s)),
                      },
                    }))
                  }
                />
                <Field label="Alt text">
                  <Input
                    value={slot.alt}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        hero: {
                          ...c.hero,
                          collage: c.hero.collage.map((s) =>
                            s.id === slot.id ? { ...s, alt: e.target.value } : s,
                          ),
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 2. Memories */}
      <SectionCard
        id="memories"
        title="Memories Made Here"
        layout="Eyebrow + horizontal carousel (photos + quote card)"
        priority="High"
      >
        <Field label="Eyebrow">
          <Input
            value={content.memories.eyebrow}
            onChange={(e) =>
              setContent((c) => ({ ...c, memories: { ...c.memories, eyebrow: e.target.value } }))
            }
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Carousel slides</p>
              <p className="text-xs text-muted-foreground">Image slides or a quote-card slide.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent((c) => ({
                    ...c,
                    memories: {
                      ...c.memories,
                      slides: [
                        ...c.memories.slides,
                        {
                          id: uid(),
                          type: "image",
                          image: { name: "new-memory.png" },
                          alt: "",
                        },
                      ],
                    },
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Image slide
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent((c) => ({
                    ...c,
                    memories: {
                      ...c.memories,
                      slides: [...c.memories.slides, { id: uid(), type: "quote" }],
                    },
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Quote card
              </Button>
            </div>
          </div>

          {content.memories.slides.map((slide, index) => (
            <MemorySlideEditor
              key={slide.id}
              slide={slide}
              index={index}
              total={content.memories.slides.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    slides: c.memories.slides.map((s) => (s.id === slide.id ? next : s)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    slides: moveItem(c.memories.slides, index, dir),
                  },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    slides: c.memories.slides.filter((s) => s.id !== slide.id),
                  },
                }))
              }
            />
          ))}
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Rotating quotes</p>
              <p className="text-xs text-muted-foreground">
                Used by quote-card slides · auto-rotate ~4.5s on the public site.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    quotes: [...c.memories.quotes, { id: uid(), text: "", author: "" }],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add quote
            </Button>
          </div>
          {content.memories.quotes.map((quote, index) => (
            <QuoteEditor
              key={quote.id}
              quote={quote}
              index={index}
              total={content.memories.quotes.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    quotes: c.memories.quotes.map((q) => (q.id === quote.id ? next : q)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    quotes: moveItem(c.memories.quotes, index, dir),
                  },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  memories: {
                    ...c.memories,
                    quotes: c.memories.quotes.filter((q) => q.id !== quote.id),
                  },
                }))
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* 3. Experiences */}
      <SectionCard
        id="experiences"
        title="Choose Your Experience"
        layout="Eyebrow + experience rows (Level 4 / Level 5)"
        priority="High"
      >
        <Field label="Eyebrow">
          <Input
            value={content.experiences.eyebrow}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                experiences: { ...c.experiences, eyebrow: e.target.value },
              }))
            }
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Experience levels</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  experiences: {
                    ...c.experiences,
                    levels: [
                      ...c.experiences.levels,
                      {
                        id: uid(),
                        levelLabel: "Level X",
                        title: "New / Chapter",
                        description: "",
                        image: { name: "new-level.png" },
                        imageAlt: "",
                        button: { label: "Explore", href: "/" },
                        decorImage: { name: "decor.png" },
                      },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add level
            </Button>
          </div>
          {content.experiences.levels.map((level, index) => (
            <ExperienceEditor
              key={level.id}
              level={level}
              index={index}
              total={content.experiences.levels.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  experiences: {
                    ...c.experiences,
                    levels: c.experiences.levels.map((l) => (l.id === level.id ? next : l)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  experiences: {
                    ...c.experiences,
                    levels: moveItem(c.experiences.levels, index, dir),
                  },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  experiences: {
                    ...c.experiences,
                    levels: c.experiences.levels.filter((l) => l.id !== level.id),
                  },
                }))
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* 4. Philosophy */}
      <SectionCard
        id="philosophy"
        title="Our Philosophy"
        layout="Left copy · center pillars · right wordmark"
        priority="Medium"
      >
        <Field label="Headline">
          <Input
            value={content.philosophy.headline}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                philosophy: { ...c.philosophy, headline: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Body">
          <Textarea
            rows={3}
            value={content.philosophy.body}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                philosophy: { ...c.philosophy, body: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Highlight line">
          <Input
            value={content.philosophy.highlight}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                philosophy: { ...c.philosophy, highlight: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Wordmark" hint="Optional">
          <Input
            value={content.philosophy.wordmark}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                philosophy: { ...c.philosophy, wordmark: e.target.value },
              }))
            }
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Pillars</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  philosophy: {
                    ...c.philosophy,
                    pillars: [
                      ...c.philosophy.pillars,
                      { id: uid(), label: "New pillar", icon: "leaf" },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add pillar
            </Button>
          </div>
          {content.philosophy.pillars.map((pillar, index) => (
            <PillarEditor
              key={pillar.id}
              pillar={pillar}
              index={index}
              total={content.philosophy.pillars.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  philosophy: {
                    ...c.philosophy,
                    pillars: c.philosophy.pillars.map((p) => (p.id === pillar.id ? next : p)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  philosophy: {
                    ...c.philosophy,
                    pillars: moveItem(c.philosophy.pillars, index, dir),
                  },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  philosophy: {
                    ...c.philosophy,
                    pillars: c.philosophy.pillars.filter((p) => p.id !== pillar.id),
                  },
                }))
              }
            />
          ))}
        </div>
      </SectionCard>
    </EditorShell>
  );
}

function MemorySlideEditor({
  slide,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  slide: MemorySlide;
  index: number;
  total: number;
  onChange: (next: MemorySlide) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Slide {index + 1} · {slide.type === "image" ? "Image" : "Quote card"}
        </p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      {slide.type === "image" ? (
        <>
          <ImageField
            label="Image"
            folder="the-space"
            value={slide.image}
            onChange={(image) => onChange({ ...slide, image })}
          />
          <Field label="Alt text">
            <Input value={slide.alt} onChange={(e) => onChange({ ...slide, alt: e.target.value })} />
          </Field>
        </>
      ) : (
        <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-3 py-3">
          This slide shows the rotating quotes list below. No per-slide copy.
        </p>
      )}
    </div>
  );
}

function QuoteEditor({
  quote,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  quote: MemoryQuote;
  index: number;
  total: number;
  onChange: (next: MemoryQuote) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Quote {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Quote">
        <Textarea rows={2} value={quote.text} onChange={(e) => onChange({ ...quote, text: e.target.value })} />
      </Field>
      <Field label="Author">
        <Input value={quote.author} onChange={(e) => onChange({ ...quote, author: e.target.value })} />
      </Field>
    </div>
  );
}

function ExperienceEditor({
  level,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  level: ExperienceLevel;
  index: number;
  total: number;
  onChange: (next: ExperienceLevel) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{level.levelLabel || `Level ${index + 1}`}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Level label">
          <Input
            value={level.levelLabel}
            onChange={(e) => onChange({ ...level, levelLabel: e.target.value })}
          />
        </Field>
        <Field label="Title">
          <Input value={level.title} onChange={(e) => onChange({ ...level, title: e.target.value })} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea
          rows={3}
          value={level.description}
          onChange={(e) => onChange({ ...level, description: e.target.value })}
        />
      </Field>
      <ImageField
        label="Main image"
        folder="the-space"
        value={level.image}
        onChange={(image) => onChange({ ...level, image })}
      />
      <Field label="Image alt">
        <Input
          value={level.imageAlt}
          onChange={(e) => onChange({ ...level, imageAlt: e.target.value })}
        />
      </Field>
      <LinkFields
        label="Button"
        value={level.button}
        onChange={(button) => onChange({ ...level, button })}
      />
      <ImageField
        label="Decor image"
        folder="the-space"
        value={level.decorImage}
        onChange={(decorImage) => onChange({ ...level, decorImage })}
      />
    </div>
  );
}

function PillarEditor({
  pillar,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  pillar: PhilosophyPillar;
  index: number;
  total: number;
  onChange: (next: PhilosophyPillar) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Pillar {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Label" hint="Line breaks allowed">
        <Textarea
          rows={2}
          value={pillar.label}
          onChange={(e) => onChange({ ...pillar, label: e.target.value })}
        />
      </Field>
      <Field label="Icon">
        <div className="flex flex-wrap gap-2">
          {PILLAR_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...pillar, icon: opt.value })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                pillar.icon === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground/70 hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>
      {pillar.icon === "custom" ? (
        <ImageField
          label="Custom icon"
          folder="the-space"
          value={pillar.customIcon ?? { name: "custom-icon.png" }}
          onChange={(customIcon) => onChange({ ...pillar, customIcon })}
        />
      ) : null}
    </div>
  );
}
