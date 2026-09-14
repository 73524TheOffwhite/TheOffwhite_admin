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
  SectionCard,
  moveItem,
  uid,
} from "@/components/cms/fields";
import SharedDishesSection from "@/components/cms/SharedDishesSection";
import {
  DEFAULT_MENU,
  MENU_SECTIONS,
  type MenuPageContent,
  type VisualMenuDish,
} from "@/data/menu-content";
import { useSharedSignatureDishes } from "@/data/shared-dishes";
import { loadMenuCms, saveMenuCms } from "@/lib/menu-cms";
import { toast } from "sonner";

export default function MenuEditor() {
  const [content, setContent] = useState<MenuPageContent>(DEFAULT_MENU);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_MENU));
  const [active, setActive] = useState("hero");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(DEFAULT_MENU.dishes[0]?.id ?? null);
  const { dirty: dishesDirty, save: saveDishes } = useSharedSignatureDishes();

  const dirty = JSON.stringify(content) !== savedSnapshot || dishesDirty;

  const selectedDish =
    content.dishes.find((d) => d.id === selectedDishId) ?? content.dishes[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadMenuCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
        setSelectedDishId(bundle.content.dishes[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Menu from Supabase");
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
      await saveMenuCms({ content, pageId });
      const refreshed = await loadMenuCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      saveDishes();
      toast.success("Menu page saved — live site will use hero, selection header, and dish grid");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Menu page");
    } finally {
      setSaving(false);
    }
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateDishes = (dishes: VisualMenuDish[]) => {
    setContent((c) => ({ ...c, dishes }));
  };

  const updateDish = (id: string, patch: Partial<VisualMenuDish>) => {
    updateDishes(content.dishes.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  return (
    <EditorShell
      title="Menu page content"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Hero, selection header, and dish grid sync to the live Menu page. Footer, modal, and signature dishes are unchanged."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={MENU_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      <SectionCard
        id="hero"
        title="Page Hero"
        layout="Full-bleed image · centered text · breadcrumb"
        priority="Medium"
      >
        <ImageField
          label="Desktop image"
          value={content.hero.image}
          onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))}
        />
        <ImageField
          label="Mobile image"
          value={content.hero.mobileImage}
          onChange={(mobileImage) => setContent((c) => ({ ...c, hero: { ...c.hero, mobileImage } }))}
        />
        <Field label="Eyebrow">
          <Input
            value={content.hero.eyebrow}
            onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: e.target.value } }))}
          />
        </Field>
        <Field label="Headline" hint="Use a line break for two lines on the live site">
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
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, description: e.target.value } }))
            }
          />
        </Field>
        <Field label="Breadcrumb" hint="Optional">
          <Input
            value={content.hero.breadcrumb}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, breadcrumb: e.target.value } }))
            }
          />
        </Field>
      </SectionCard>

      <SectionCard
        id="selection"
        title="Selection header"
        layout="Centered eyebrow · headline · italic intro"
        priority="High"
      >
        <Field label="Eyebrow">
          <Input
            value={content.selection.eyebrow}
            onChange={(e) =>
              setContent((c) => ({ ...c, selection: { ...c.selection, eyebrow: e.target.value } }))
            }
          />
        </Field>
        <Field label="Headline">
          <Input
            value={content.selection.headline}
            onChange={(e) =>
              setContent((c) => ({ ...c, selection: { ...c.selection, headline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Intro" hint="Italic line under the headline">
          <Input
            value={content.selection.intro}
            onChange={(e) =>
              setContent((c) => ({ ...c, selection: { ...c.selection, intro: e.target.value } }))
            }
          />
        </Field>
      </SectionCard>

      <SectionCard
        id="visual"
        title="Dish grid"
        layout="Visual menu — image + name (matches live grid)"
        priority="High"
      >
        <p className="text-xs text-muted-foreground -mt-2">
          Defaults match the live site assets. Until you upload a new image, the public site keeps using
          the bundled Menu photos.
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{content.dishes.length} dishes</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const id = `dish-${uid().slice(0, 8)}.jpg`;
              const next: VisualMenuDish = {
                id,
                name: "New dish",
                image: { name: id },
              };
              updateDishes([...content.dishes, next]);
              setSelectedDishId(id);
            }}
          >
            <Plus className="h-4 w-4" /> Add dish
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {content.dishes.map((dish, index) => (
              <li key={dish.id}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedDishId === dish.id ? "bg-primary/5" : "hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedDishId(dish.id)}
                >
                  <div className="h-12 w-10 rounded-md overflow-hidden bg-muted shrink-0 grid place-items-center">
                    {dish.image.previewUrl ? (
                      <img src={dish.image.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-muted-foreground px-0.5 text-center leading-tight">
                        {dish.image.name}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{dish.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{dish.image.name}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ItemToolbar
                      onUp={() => updateDishes(moveItem(content.dishes, index, -1))}
                      onDown={() => updateDishes(moveItem(content.dishes, index, 1))}
                      onRemove={() => {
                        const next = content.dishes.filter((d) => d.id !== dish.id);
                        updateDishes(next);
                        if (selectedDishId === dish.id) setSelectedDishId(next[0]?.id ?? null);
                      }}
                      disableUp={index === 0}
                      disableDown={index === content.dishes.length - 1}
                    />
                  </div>
                </div>
              </li>
            ))}
            {content.dishes.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-muted-foreground">No dishes yet.</li>
            ) : null}
          </ul>

          <div className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4 space-y-3 h-fit">
            {selectedDish ? (
              <>
                <p className="text-sm font-semibold">Dish detail</p>
                <Field label="Name">
                  <Input
                    value={selectedDish.name}
                    onChange={(e) => updateDish(selectedDish.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="Asset id" hint="Matches live filename when no upload is set">
                  <Input
                    value={selectedDish.id}
                    onChange={(e) => {
                      const nextId = e.target.value.trim() || selectedDish.id;
                      updateDishes(
                        content.dishes.map((d) =>
                          d.id === selectedDish.id
                            ? { ...d, id: nextId, image: { ...d.image, name: d.image.name || nextId } }
                            : d,
                        ),
                      );
                      setSelectedDishId(nextId);
                    }}
                  />
                </Field>
                <ImageField
                  label="Image"
                  value={selectedDish.image}
                  onChange={(image) => updateDish(selectedDish.id, { image })}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">Select a dish to edit.</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SharedDishesSection
        priority="Low"
        note="Shared source with Homepage — one edit updates both. Not part of the live Menu page grid."
      />
    </EditorShell>
  );
}
