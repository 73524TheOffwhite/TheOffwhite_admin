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
import SharedTestimonialsSection from "@/components/cms/SharedTestimonialsSection";
import {
  ABOUT_SECTIONS,
  DEFAULT_ABOUT,
  type AboutContent,
  type FounderCard,
  type SlideImage,
  type StatItem,
  type ValueCard,
} from "@/data/about-content";
import { getTestimonials, hydrateTestimonials, useSharedTestimonials } from "@/data/shared-testimonials";
import { loadAboutCms, saveAboutCms } from "@/lib/about-cms";
import { toast } from "sonner";

export default function AboutEditor() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_ABOUT));
  const [active, setActive] = useState("hero");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { dirty: testimonialsDirty, save: saveTestimonialsLocal } = useSharedTestimonials();

  const dirty = JSON.stringify(content) !== savedSnapshot || testimonialsDirty;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadAboutCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
        hydrateTestimonials(bundle.testimonials);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load About from Supabase");
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
      await saveAboutCms({
        content,
        testimonials: getTestimonials(),
        pageId,
      });
      const refreshed = await loadAboutCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      hydrateTestimonials(refreshed.testimonials);
      saveTestimonialsLocal();
      toast.success("About page saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save About page");
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
      title="About page content"
      subtitle={loading ? "Loading from Supabase…" : saving ? "Saving…" : "Edit the public About sections."}
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={ABOUT_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Hero */}
      <SectionCard
        id="hero"
        title="Page Hero"
        layout="Full-bleed image · centered text · breadcrumb (no CTA)"
        priority="Medium"
      >
        <ImageField
          label="Image"
          folder="about"
          value={content.hero.image}
          onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))}
        />
        <Field label="Eyebrow">
          <Input
            value={content.hero.eyebrow}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: e.target.value } }))}
          />
        </Field>
        <Field label="Headline">
          <Textarea
            rows={2}
            value={content.hero.headline}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))}
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={3}
            value={content.hero.description}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, description: e.target.value } }))}
          />
        </Field>
        <Field label="Breadcrumb" hint="Optional">
          <Input
            value={content.hero.breadcrumb}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, breadcrumb: e.target.value } }))}
          />
        </Field>
      </SectionCard>

      {/* 2. Philosophy */}
      <SectionCard
        id="philosophy"
        title="Our Philosophy"
        layout="Left fading slideshow · right text (auto-rotate ~3s)"
        priority="High"
      >
        <Field label="Eyebrow">
          <Input
            value={content.philosophy.eyebrow}
            onChange={(e) =>
              setContent((c) => ({ ...c, philosophy: { ...c.philosophy, eyebrow: e.target.value } }))
            }
          />
        </Field>
        <Field label="Headline">
          <Input
            value={content.philosophy.headline}
            onChange={(e) =>
              setContent((c) => ({ ...c, philosophy: { ...c.philosophy, headline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Body · paragraph 1">
          <Textarea
            rows={3}
            value={content.philosophy.body1}
            onChange={(e) =>
              setContent((c) => ({ ...c, philosophy: { ...c.philosophy, body1: e.target.value } }))
            }
          />
        </Field>
        <Field label="Body · paragraph 2">
          <Textarea
            rows={3}
            value={content.philosophy.body2}
            onChange={(e) =>
              setContent((c) => ({ ...c, philosophy: { ...c.philosophy, body2: e.target.value } }))
            }
          />
        </Field>
        <SlideshowEditor
          title="Slideshow images"
          slides={content.philosophy.slides}
          onChange={(slides) => setContent((c) => ({ ...c, philosophy: { ...c.philosophy, slides } }))}
        />
      </SectionCard>

      {/* 3. Founders */}
      <SectionCard
        id="founders"
        title="Founder Story"
        layout="Centered intro → founder cards → shared values + closing"
        priority="High"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.founders.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, founders: { ...c.founders, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="Headline">
            <Input
              value={content.founders.headline}
              onChange={(e) =>
                setContent((c) => ({ ...c, founders: { ...c.founders, headline: e.target.value } }))
              }
            />
          </Field>
        </div>

        <StringListEditor
          title="Intro paragraphs"
          addLabel="Add paragraph"
          multiline
          values={content.founders.intro}
          onChange={(intro) => setContent((c) => ({ ...c, founders: { ...c.founders, intro } }))}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Founder cards</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  founders: {
                    ...c.founders,
                    cards: [
                      ...c.founders.cards,
                      { id: uid(), name: "New founder", role: "Role", paragraphs: [""] },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add founder
            </Button>
          </div>
          {content.founders.cards.map((card, index) => (
            <FounderEditor
              key={card.id}
              card={card}
              index={index}
              total={content.founders.cards.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  founders: {
                    ...c.founders,
                    cards: c.founders.cards.map((f) => (f.id === card.id ? next : f)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  founders: { ...c.founders, cards: moveItem(c.founders.cards, index, dir) },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  founders: {
                    ...c.founders,
                    cards: c.founders.cards.filter((f) => f.id !== card.id),
                  },
                }))
              }
            />
          ))}
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
          <Field label="Shared values · eyebrow">
            <Input
              value={content.founders.valuesEyebrow}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  founders: { ...c.founders, valuesEyebrow: e.target.value },
                }))
              }
            />
          </Field>
          <StringListEditor
            title="Shared values · paragraphs"
            addLabel="Add paragraph"
            multiline
            values={content.founders.valuesParagraphs}
            onChange={(valuesParagraphs) =>
              setContent((c) => ({ ...c, founders: { ...c.founders, valuesParagraphs } }))
            }
          />
          <StringListEditor
            title="Closing lines"
            addLabel="Add line"
            multiline
            values={content.founders.closingLines}
            onChange={(closingLines) =>
              setContent((c) => ({ ...c, founders: { ...c.founders, closingLines } }))
            }
          />
          <StringListEditor
            title="Social handles"
            addLabel="Add handle"
            values={content.founders.socialHandles}
            placeholder="@handle"
            onChange={(socialHandles) =>
              setContent((c) => ({ ...c, founders: { ...c.founders, socialHandles } }))
            }
          />
        </div>
      </SectionCard>

      {/* 4. Values */}
      <SectionCard
        id="values"
        title="Values"
        layout="Header + principle cards"
        priority="Medium"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.values.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, values: { ...c.values, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="Headline">
            <Input
              value={content.values.headline}
              onChange={(e) =>
                setContent((c) => ({ ...c, values: { ...c.values, headline: e.target.value } }))
              }
            />
          </Field>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Principle cards</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  values: {
                    ...c.values,
                    cards: [...c.values.cards, { id: uid(), title: "New principle", body: "" }],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add value
            </Button>
          </div>
          {content.values.cards.map((card, index) => (
            <ValueEditor
              key={card.id}
              card={card}
              index={index}
              total={content.values.cards.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  values: {
                    ...c.values,
                    cards: c.values.cards.map((v) => (v.id === card.id ? next : v)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  values: { ...c.values, cards: moveItem(c.values.cards, index, dir) },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  values: {
                    ...c.values,
                    cards: c.values.cards.filter((v) => v.id !== card.id),
                  },
                }))
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* 5. Stats */}
      <SectionCard id="stats" title="Stats band" layout="4 stat blocks in a row" priority="Medium">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Stats</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  stats: [...c.stats, { id: uid(), value: "0", label: "New stat" }],
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add stat
            </Button>
          </div>
          {content.stats.map((stat, index) => (
            <StatEditor
              key={stat.id}
              stat={stat}
              index={index}
              total={content.stats.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  stats: c.stats.map((s) => (s.id === stat.id ? next : s)),
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({ ...c, stats: moveItem(c.stats, index, dir) }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  stats: c.stats.filter((s) => s.id !== stat.id),
                }))
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* 6. Kitchen */}
      <SectionCard
        id="kitchen"
        title="From the Kitchen"
        layout="Left text + button · right fading slideshow"
        priority="High"
      >
        <Field label="Eyebrow">
          <Input
            value={content.kitchen.eyebrow}
            onChange={(e) =>
              setContent((c) => ({ ...c, kitchen: { ...c.kitchen, eyebrow: e.target.value } }))
            }
          />
        </Field>
        <Field label="Headline / quote">
          <Textarea
            rows={2}
            value={content.kitchen.headline}
            onChange={(e) =>
              setContent((c) => ({ ...c, kitchen: { ...c.kitchen, headline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Body">
          <Textarea
            rows={3}
            value={content.kitchen.body}
            onChange={(e) =>
              setContent((c) => ({ ...c, kitchen: { ...c.kitchen, body: e.target.value } }))
            }
          />
        </Field>
        <Field label="Attribution">
          <Input
            value={content.kitchen.attribution}
            onChange={(e) =>
              setContent((c) => ({ ...c, kitchen: { ...c.kitchen, attribution: e.target.value } }))
            }
          />
        </Field>
        <LinkFields
          label="Button"
          value={content.kitchen.button}
          onChange={(button) => setContent((c) => ({ ...c, kitchen: { ...c.kitchen, button } }))}
        />
        <SlideshowEditor
          title="Slideshow images"
          slides={content.kitchen.slides}
          onChange={(slides) => setContent((c) => ({ ...c, kitchen: { ...c.kitchen, slides } }))}
        />
      </SectionCard>

      {/* 7. Shared testimonials */}
      <SharedTestimonialsSection
        priority="Low"
        note="Shared source with Homepage — one edit updates both."
      />
    </EditorShell>
  );
}

function SlideshowEditor({
  title,
  slides,
  onChange,
}: {
  title: string;
  slides: SlideImage[];
  onChange: (next: SlideImage[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...slides, { id: uid(), image: { name: "new-slide.png" }, alt: "" }])
          }
        >
          <Plus className="h-4 w-4" /> Add slide
        </Button>
      </div>
      {slides.map((slide, index) => (
        <div key={slide.id} className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Slide {String(index + 1).padStart(2, "0")}
            </p>
            <ItemToolbar
              onUp={() => onChange(moveItem(slides, index, -1))}
              onDown={() => onChange(moveItem(slides, index, 1))}
              onRemove={() => onChange(slides.filter((s) => s.id !== slide.id))}
              disableUp={index === 0}
              disableDown={index === slides.length - 1}
            />
          </div>
          <ImageField
            label="Image"
            folder="about"
            value={slide.image}
            onChange={(image) =>
              onChange(slides.map((s) => (s.id === slide.id ? { ...s, image } : s)))
            }
          />
          <Field label="Alt text">
            <Input
              value={slide.alt}
              onChange={(e) =>
                onChange(slides.map((s) => (s.id === slide.id ? { ...s, alt: e.target.value } : s)))
              }
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

function FounderEditor({
  card,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  card: FounderCard;
  index: number;
  total: number;
  onChange: (next: FounderCard) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Founder {number}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={card.name} onChange={(e) => onChange({ ...card, name: e.target.value })} />
        </Field>
        <Field label="Role">
          <Input value={card.role} onChange={(e) => onChange({ ...card, role: e.target.value })} />
        </Field>
      </div>
      <StringListEditor
        title="Paragraphs"
        addLabel="Add paragraph"
        multiline
        values={card.paragraphs}
        onChange={(paragraphs) => onChange({ ...card, paragraphs })}
      />
    </div>
  );
}

function ValueEditor({
  card,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  card: ValueCard;
  index: number;
  total: number;
  onChange: (next: ValueCard) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Principle {number}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Title">
        <Input value={card.title} onChange={(e) => onChange({ ...card, title: e.target.value })} />
      </Field>
      <Field label="Body">
        <Textarea rows={3} value={card.body} onChange={(e) => onChange({ ...card, body: e.target.value })} />
      </Field>
    </div>
  );
}

function StatEditor({
  stat,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  stat: StatItem;
  index: number;
  total: number;
  onChange: (next: StatItem) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 flex-1 min-w-[200px]">
          <Field label="Value">
            <Input value={stat.value} onChange={(e) => onChange({ ...stat, value: e.target.value })} />
          </Field>
          <Field label="Label">
            <Input value={stat.label} onChange={(e) => onChange({ ...stat, label: e.target.value })} />
          </Field>
        </div>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
    </div>
  );
}
