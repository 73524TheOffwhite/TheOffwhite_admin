import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown, ChevronUp, ImagePlus, Plus, Save, Trash2, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_HOMEPAGE,
  SECTIONS,
  type HomepageContent,
  type MediaRef,
  type MenuColumn,
  type SpaceCard,
} from "@/data/homepage-content";
import { hydrateTestimonials, useSharedTestimonials } from "@/data/shared-testimonials";
import { hydrateSignatureDishes, useSharedSignatureDishes } from "@/data/shared-dishes";
import SharedTestimonialsSection from "@/components/cms/SharedTestimonialsSection";
import SharedDishesSection from "@/components/cms/SharedDishesSection";
import { cn } from "@/lib/utils";
import { loadHomepageCms, saveHomepageCms } from "@/lib/homepage-cms";
import { uploadMediaFile } from "@/lib/media";
import { toast } from "sonner";
import { getTestimonials } from "@/data/shared-testimonials";
import { getSignatureDishes } from "@/data/shared-dishes";

function uid() {
  return crypto.randomUUID();
}

function PriorityPill({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const tone =
    priority === "High"
      ? "bg-rose-100 text-rose-700"
      : priority === "Medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone)}>
      {priority}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
        {hint ? <span className="text-[10px] text-muted-foreground/80">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function SectionCard({
  id,
  title,
  layout,
  priority,
  children,
}: {
  id: string;
  title: string;
  layout: string;
  priority: "High" | "Medium" | "Low";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border bg-card/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <PriorityPill priority={priority} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{layout}</p>
        </div>
      </header>
      <div className="p-4 sm:p-5 space-y-5">{children}</div>
    </section>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MediaRef;
  onChange: (next: MediaRef) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    onChange({ name: file.name, previewUrl: localPreview, path: value.path });
    setUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, "homepage");
      onChange({
        name: file.name,
        path: uploaded.path,
        previewUrl: uploaded.previewUrl,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
      onChange(value);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Field label={label} hint={uploading ? "Uploading…" : "Replace"}>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group w-full rounded-xl border border-dashed border-border bg-secondary/40 hover:bg-secondary/70 transition-colors overflow-hidden text-left disabled:opacity-70"
      >
        <div className="flex items-stretch gap-3 p-2.5 sm:p-3">
          <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-muted grid place-items-center">
            {value.previewUrl ? (
              <img src={value.previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-muted-foreground/70" />
            )}
          </div>
          <div className="min-w-0 flex-1 py-1">
            <p className="text-sm font-medium truncate">{value.name || "No image"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uploading ? "Uploading to storage…" : "Click to replace image"}
            </p>
          </div>
        </div>
      </button>
    </Field>
  );
}

function LinkFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; href: string };
  onChange: (next: { label: string; href: string }) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label={`${label} · Label`}>
        <Input
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </Field>
      <Field label={`${label} · Link`}>
        <Input
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="/path or #anchor"
        />
      </Field>
    </div>
  );
}

function ItemToolbar({
  onUp,
  onDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <span className="text-muted-foreground/40 px-0.5 hidden sm:inline">
        <GripVertical className="h-4 w-4" />
      </span>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onUp} disabled={disableUp} aria-label="Move up">
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onDown} disabled={disableDown} aria-label="Move down">
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700" onClick={onRemove} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

export default function HomepageEditor() {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_HOMEPAGE));
  const [active, setActive] = useState<string>("hero");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { dirty: testimonialsDirty, save: saveTestimonials } = useSharedTestimonials();
  const { dirty: dishesDirty, save: saveDishes } = useSharedSignatureDishes();
  const dirty = JSON.stringify(content) !== savedSnapshot || testimonialsDirty || dishesDirty;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadHomepageCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
        hydrateSignatureDishes(bundle.dishes);
        hydrateTestimonials(bundle.testimonials);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load homepage from Supabase");
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
      await saveHomepageCms({
        content,
        dishes: getSignatureDishes(),
        testimonials: getTestimonials(),
        pageId,
      });
      const refreshed = await loadHomepageCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      hydrateSignatureDishes(refreshed.dishes);
      hydrateTestimonials(refreshed.testimonials);
      saveTestimonials();
      saveDishes();
      toast.success("Homepage saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save homepage");
    } finally {
      setSaving(false);
    }
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 sm:py-0 sm:static bg-mesh/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">Homepage content</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading
                ? "Loading from Supabase…"
                : dirty
                  ? "You have unsaved changes."
                  : "All changes saved."}
            </p>
          </div>
          <Button type="button" onClick={() => void save()} disabled={!dirty || saving || loading} className="shrink-0">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-4 sm:gap-5">
        {/* Section nav */}
        <nav className="xl:sticky xl:top-4 self-start rounded-2xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sections
          </p>
          <ul className="flex xl:flex-col gap-1 overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                    active === s.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground/80",
                  )}
                >
                  <span className="font-medium whitespace-nowrap">{s.label}</span>
                  {active !== s.id ? <PriorityPill priority={s.priority} /> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Editors */}
        <div className="space-y-4 sm:space-y-5 min-w-0">
          {/* 1. Hero */}
          <SectionCard id="hero" title="Hero" layout="Full-bleed image · centered text · 2 buttons · scroll hint" priority="High">
            <ImageField
              label="Background image"
              value={content.hero.image}
              onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))}
            />
            <Field label="Eyebrow / tagline">
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
            <LinkFields
              label="Button 1"
              value={content.hero.button1}
              onChange={(button1) => setContent((c) => ({ ...c, hero: { ...c.hero, button1 } }))}
            />
            <LinkFields
              label="Button 2"
              value={content.hero.button2}
              onChange={(button2) => setContent((c) => ({ ...c, hero: { ...c.hero, button2 } }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Scroll label" hint="Optional">
                <Input
                  value={content.hero.scrollLabel}
                  onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, scrollLabel: e.target.value } }))}
                />
              </Field>
              <Field label="Scroll link">
                <Input
                  value={content.hero.scrollHref}
                  onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, scrollHref: e.target.value } }))}
                />
              </Field>
            </div>
          </SectionCard>

          {/* 2. Story */}
          <SectionCard id="story" title="Our Story" layout="Left image · right text + button" priority="Medium">
            <ImageField
              label="Image"
              value={content.story.image}
              onChange={(image) => setContent((c) => ({ ...c, story: { ...c.story, image } }))}
            />
            <Field label="Eyebrow">
              <Input
                value={content.story.eyebrow}
                onChange={(e) => setContent((c) => ({ ...c, story: { ...c.story, eyebrow: e.target.value } }))}
              />
            </Field>
            <Field label="Headline">
              <Input
                value={content.story.headline}
                onChange={(e) => setContent((c) => ({ ...c, story: { ...c.story, headline: e.target.value } }))}
              />
            </Field>
            <Field label="Body">
              <Textarea
                rows={4}
                value={content.story.body}
                onChange={(e) => setContent((c) => ({ ...c, story: { ...c.story, body: e.target.value } }))}
              />
            </Field>
            <LinkFields
              label="Button"
              value={content.story.button}
              onChange={(button) => setContent((c) => ({ ...c, story: { ...c.story, button } }))}
            />
          </SectionCard>

          {/* 3. Signature Dishes — shared with Menu */}
          <SharedDishesSection
            priority="High"
            note="Shared source with Menu — one edit updates both."
          />

          {/* 4. The Space */}
          <SectionCard id="space" title="The Space" layout="Header + repeatable cards + button" priority="High">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Eyebrow">
                <Input
                  value={content.space.eyebrow}
                  onChange={(e) => setContent((c) => ({ ...c, space: { ...c.space, eyebrow: e.target.value } }))}
                />
              </Field>
              <Field label="Headline">
                <Input
                  value={content.space.headline}
                  onChange={(e) => setContent((c) => ({ ...c, space: { ...c.space, headline: e.target.value } }))}
                />
              </Field>
            </div>
            <LinkFields
              label="Section button"
              value={content.space.button}
              onChange={(button) => setContent((c) => ({ ...c, space: { ...c.space, button } }))}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Space cards</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      space: {
                        ...c.space,
                        cards: [
                          ...c.space.cards,
                          { id: uid(), image: { name: "new-space.png" }, label: "New space" },
                        ],
                      },
                    }))
                  }
                >
                  <Plus className="h-4 w-4" /> Add space
                </Button>
              </div>
              {content.space.cards.map((card, index) => (
                <SpaceEditor
                  key={card.id}
                  card={card}
                  index={index}
                  total={content.space.cards.length}
                  onChange={(next) =>
                    setContent((c) => ({
                      ...c,
                      space: {
                        ...c.space,
                        cards: c.space.cards.map((d) => (d.id === card.id ? next : d)),
                      },
                    }))
                  }
                  onMove={(dir) =>
                    setContent((c) => ({
                      ...c,
                      space: { ...c.space, cards: moveItem(c.space.cards, index, dir) },
                    }))
                  }
                  onRemove={() =>
                    setContent((c) => ({
                      ...c,
                      space: { ...c.space, cards: c.space.cards.filter((d) => d.id !== card.id) },
                    }))
                  }
                />
              ))}
            </div>
          </SectionCard>

          {/* 5. Menu + Reservation */}
          <SectionCard id="menu" title="Menu Preview + Reservation" layout="Two columns — menu preview | booking form" priority="Medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Menu eyebrow">
                <Input
                  value={content.menuPreview.eyebrow}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, menuPreview: { ...c.menuPreview, eyebrow: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Menu headline">
                <Input
                  value={content.menuPreview.headline}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, menuPreview: { ...c.menuPreview, headline: e.target.value } }))
                  }
                />
              </Field>
            </div>
            <LinkFields
              label="Menu button"
              value={content.menuPreview.button}
              onChange={(button) => setContent((c) => ({ ...c, menuPreview: { ...c.menuPreview, button } }))}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Menu columns</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      menuPreview: {
                        ...c.menuPreview,
                        columns: [
                          ...c.menuPreview.columns,
                          { id: uid(), title: "New column", items: [""] },
                        ],
                      },
                    }))
                  }
                >
                  <Plus className="h-4 w-4" /> Add column
                </Button>
              </div>
              {content.menuPreview.columns.map((col, index) => (
                <MenuColumnEditor
                  key={col.id}
                  column={col}
                  index={index}
                  total={content.menuPreview.columns.length}
                  onChange={(next) =>
                    setContent((c) => ({
                      ...c,
                      menuPreview: {
                        ...c.menuPreview,
                        columns: c.menuPreview.columns.map((d) => (d.id === col.id ? next : d)),
                      },
                    }))
                  }
                  onMove={(dir) =>
                    setContent((c) => ({
                      ...c,
                      menuPreview: {
                        ...c.menuPreview,
                        columns: moveItem(c.menuPreview.columns, index, dir),
                      },
                    }))
                  }
                  onRemove={() =>
                    setContent((c) => ({
                      ...c,
                      menuPreview: {
                        ...c.menuPreview,
                        columns: c.menuPreview.columns.filter((d) => d.id !== col.id),
                      },
                    }))
                  }
                />
              ))}
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Reservation card</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Form fields (Name, Phone, Date, Time, Guests, Preference) stay fixed in the UI.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Eyebrow">
                  <Input
                    value={content.menuPreview.reservation.eyebrow}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        menuPreview: {
                          ...c.menuPreview,
                          reservation: { ...c.menuPreview.reservation, eyebrow: e.target.value },
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Headline">
                  <Input
                    value={content.menuPreview.reservation.headline}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        menuPreview: {
                          ...c.menuPreview,
                          reservation: { ...c.menuPreview.reservation, headline: e.target.value },
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Submit button">
                  <Input
                    value={content.menuPreview.reservation.submitLabel}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        menuPreview: {
                          ...c.menuPreview,
                          reservation: { ...c.menuPreview.reservation, submitLabel: e.target.value },
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* 6. Testimonials — shared with About */}
          <SharedTestimonialsSection
            priority="High"
            note="Shared source with About — one edit updates both."
          />
        </div>
      </div>
    </div>
  );
}

function SpaceEditor({
  card,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  card: SpaceCard;
  index: number;
  total: number;
  onChange: (next: SpaceCard) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Space {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <ImageField label="Image" value={card.image} onChange={(image) => onChange({ ...card, image })} />
      <Field label="Label">
        <Input value={card.label} onChange={(e) => onChange({ ...card, label: e.target.value })} />
      </Field>
    </div>
  );
}

function MenuColumnEditor({
  column,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  column: MenuColumn;
  index: number;
  total: number;
  onChange: (next: MenuColumn) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Column {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Column title">
        <Input value={column.title} onChange={(e) => onChange({ ...column, title: e.target.value })} />
      </Field>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground font-medium">Items</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...column, items: [...column.items, ""] })}
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </Button>
        </div>
        {column.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const items = [...column.items];
                items[i] = e.target.value;
                onChange({ ...column, items });
              }}
              placeholder="Dish name"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-rose-600"
              onClick={() => onChange({ ...column, items: column.items.filter((_, j) => j !== i) })}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
