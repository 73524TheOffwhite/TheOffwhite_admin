import { useMemo, useState } from "react";
import { ChevronRight, ImagePlus, Plus } from "lucide-react";
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
import SharedDishesSection from "@/components/cms/SharedDishesSection";
import {
  DEFAULT_MENU,
  MENU_SECTIONS,
  type MenuCategory,
  type MenuItem,
  type MenuItemStatus,
  type MenuPageContent,
} from "@/data/menu-content";
import { useSharedSignatureDishes } from "@/data/shared-dishes";
import { activityNoteForSlug, logActivity } from "@/lib/activity-log";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: MenuItemStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "sold_out", label: "Sold out" },
  { value: "hidden", label: "Hidden" },
];

export default function MenuEditor() {
  const [content, setContent] = useState<MenuPageContent>(DEFAULT_MENU);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_MENU));
  const [active, setActive] = useState("hero");
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_MENU.aLaCarte.categories[0]?.id ?? "");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    DEFAULT_MENU.aLaCarte.categories[0]?.items[0]?.id ?? null,
  );
  const { dirty: dishesDirty, save: saveDishes } = useSharedSignatureDishes();

  const dirty = JSON.stringify(content) !== savedSnapshot || dishesDirty;

  const selectedCategory = useMemo(
    () => content.aLaCarte.categories.find((c) => c.id === selectedCategoryId) ?? null,
    [content.aLaCarte.categories, selectedCategoryId],
  );

  const selectedItem = useMemo(
    () => selectedCategory?.items.find((i) => i.id === selectedItemId) ?? null,
    [selectedCategory, selectedItemId],
  );

  const save = () => {
    setSavedSnapshot(JSON.stringify(content));
    saveDishes();
    void logActivity(activityNoteForSlug("menu"));
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateCategories = (categories: MenuCategory[]) => {
    setContent((c) => ({ ...c, aLaCarte: { ...c.aLaCarte, categories } }));
  };

  const updateCategory = (categoryId: string, patch: Partial<MenuCategory>) => {
    updateCategories(
      content.aLaCarte.categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)),
    );
  };

  const updateItem = (categoryId: string, itemId: string, next: MenuItem) => {
    updateCategories(
      content.aLaCarte.categories.map((c) =>
        c.id === categoryId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? next : i)) }
          : c,
      ),
    );
  };

  const selectCategory = (id: string) => {
    setSelectedCategoryId(id);
    const cat = content.aLaCarte.categories.find((c) => c.id === id);
    setSelectedItemId(cat?.items[0]?.id ?? null);
  };

  return (
    <EditorShell
      title="Menu page content"
      subtitle="Manage à la carte categories, items, and shared signature dishes."
      dirty={dirty}
      onSave={save}
      sections={MENU_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Hero */}
      <SectionCard
        id="hero"
        title="Page Hero"
        layout="Full-bleed image · centered text · breadcrumb"
        priority="Medium"
      >
        <ImageField
          label="Image"
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

      {/* 2. À la Carte */}
      <SectionCard
        id="alacarte"
        title="À la Carte"
        layout="Section header → category tabs → item list → footer note + button"
        priority="High"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.aLaCarte.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, aLaCarte: { ...c.aLaCarte, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="Headline">
            <Input
              value={content.aLaCarte.headline}
              onChange={(e) =>
                setContent((c) => ({ ...c, aLaCarte: { ...c.aLaCarte, headline: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Tax note">
          <Input
            value={content.aLaCarte.taxNote}
            onChange={(e) =>
              setContent((c) => ({ ...c, aLaCarte: { ...c.aLaCarte, taxNote: e.target.value } }))
            }
          />
        </Field>
        <LinkFields
          label="Footer button"
          value={content.aLaCarte.button}
          onChange={(button) => setContent((c) => ({ ...c, aLaCarte: { ...c.aLaCarte, button } }))}
        />

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-2.5">
            <p className="text-sm font-medium">Categories & items</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const id = `cat-${uid().slice(0, 8)}`;
                const next: MenuCategory = {
                  id,
                  label: "New category",
                  intro: "",
                  items: [],
                };
                updateCategories([...content.aLaCarte.categories, next]);
                setSelectedCategoryId(id);
                setSelectedItemId(null);
              }}
            >
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] min-h-[420px]">
            {/* Category list */}
            <aside className="border-b lg:border-b-0 lg:border-r border-border bg-background/50 p-2 space-y-1">
              {content.aLaCarte.categories.map((cat, index) => (
                <div
                  key={cat.id}
                  className={cn(
                    "rounded-xl border transition-colors",
                    selectedCategoryId === cat.id
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent hover:bg-muted/60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectCategory(cat.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{cat.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <div className="flex justify-end px-1 pb-1">
                    <ItemToolbar
                      onUp={() => {
                        const next = moveItem(content.aLaCarte.categories, index, -1);
                        updateCategories(next);
                      }}
                      onDown={() => {
                        const next = moveItem(content.aLaCarte.categories, index, 1);
                        updateCategories(next);
                      }}
                      onRemove={() => {
                        const next = content.aLaCarte.categories.filter((c) => c.id !== cat.id);
                        updateCategories(next);
                        if (selectedCategoryId === cat.id) {
                          setSelectedCategoryId(next[0]?.id ?? "");
                          setSelectedItemId(next[0]?.items[0]?.id ?? null);
                        }
                      }}
                      disableUp={index === 0}
                      disableDown={index === content.aLaCarte.categories.length - 1}
                    />
                  </div>
                </div>
              ))}
              {content.aLaCarte.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4">No categories yet.</p>
              ) : null}
            </aside>

            {/* Category + items workspace */}
            <div className="p-3 sm:p-4 space-y-4 min-w-0">
              {selectedCategory ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Category ID">
                      <Input
                        value={selectedCategory.id}
                        onChange={(e) => {
                          const nextId = e.target.value.trim() || selectedCategory.id;
                          updateCategories(
                            content.aLaCarte.categories.map((c) =>
                              c.id === selectedCategory.id ? { ...c, id: nextId } : c,
                            ),
                          );
                          setSelectedCategoryId(nextId);
                        }}
                      />
                    </Field>
                    <Field label="Label">
                      <Input
                        value={selectedCategory.label}
                        onChange={(e) => updateCategory(selectedCategory.id, { label: e.target.value })}
                      />
                    </Field>
                    <Field label="Intro">
                      <Input
                        value={selectedCategory.intro}
                        onChange={(e) => updateCategory(selectedCategory.id, { intro: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Items</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newItem: MenuItem = {
                          id: uid(),
                          name: "New dish",
                          notes: "",
                          price: "₹ 0",
                          image: { name: "dish-ravioli.jpg" },
                          blurb: "",
                          preparation: "",
                          pairing: "",
                          allergens: "",
                          status: "available",
                        };
                        updateCategory(selectedCategory.id, {
                          items: [...selectedCategory.items, newItem],
                        });
                        setSelectedItemId(newItem.id);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Add item
                    </Button>
                  </div>

                  {/* Items table */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="hidden sm:grid grid-cols-[minmax(0,1.4fr)_80px_72px_100px_88px] gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 border-b border-border">
                      <span>Name</span>
                      <span>Price</span>
                      <span>Image</span>
                      <span>Status</span>
                      <span className="text-right">Order</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {selectedCategory.items.map((menuItem, index) => (
                        <li key={menuItem.id}>
                          <div
                            className={cn(
                              "grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_80px_72px_100px_88px] gap-2 px-3 py-2.5 items-center cursor-pointer transition-colors",
                              selectedItemId === menuItem.id ? "bg-primary/5" : "hover:bg-muted/40",
                            )}
                            onClick={() => setSelectedItemId(menuItem.id)}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{menuItem.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{menuItem.notes}</p>
                            </div>
                            <p className="text-sm font-semibold">{menuItem.price}</p>
                            <div className="h-9 w-12 rounded-md overflow-hidden bg-muted grid place-items-center">
                              {menuItem.image.previewUrl ? (
                                <img src={menuItem.image.previewUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-[9px] text-muted-foreground truncate px-0.5">
                                  {menuItem.image.name.split(".")[0]}
                                </span>
                              )}
                            </div>
                            <StatusBadge status={menuItem.status} />
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              <ItemToolbar
                                onUp={() =>
                                  updateCategory(selectedCategory.id, {
                                    items: moveItem(selectedCategory.items, index, -1),
                                  })
                                }
                                onDown={() =>
                                  updateCategory(selectedCategory.id, {
                                    items: moveItem(selectedCategory.items, index, 1),
                                  })
                                }
                                onRemove={() => {
                                  const items = selectedCategory.items.filter((i) => i.id !== menuItem.id);
                                  updateCategory(selectedCategory.id, { items });
                                  if (selectedItemId === menuItem.id) {
                                    setSelectedItemId(items[0]?.id ?? null);
                                  }
                                }}
                                disableUp={index === 0}
                                disableDown={index === selectedCategory.items.length - 1}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                      {selectedCategory.items.length === 0 ? (
                        <li className="px-3 py-6 text-xs text-muted-foreground text-center">
                          No items in this category.
                        </li>
                      ) : null}
                    </ul>
                  </div>

                  {/* Item detail form */}
                  {selectedItem ? (
                    <div className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">Item detail</p>
                          <p className="text-xs text-muted-foreground">
                            List shows name, notes, price. Modal uses all fields below.
                          </p>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {selectedCategory.label}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Name">
                          <Input
                            value={selectedItem.name}
                            onChange={(e) =>
                              updateItem(selectedCategory.id, selectedItem.id, {
                                ...selectedItem,
                                name: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Price">
                          <Input
                            value={selectedItem.price}
                            onChange={(e) =>
                              updateItem(selectedCategory.id, selectedItem.id, {
                                ...selectedItem,
                                price: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Notes">
                        <Input
                          value={selectedItem.notes}
                          onChange={(e) =>
                            updateItem(selectedCategory.id, selectedItem.id, {
                              ...selectedItem,
                              notes: e.target.value,
                            })
                          }
                          placeholder="Aged balsamic · Basil oil · Sea salt"
                        />
                      </Field>
                      <ImageField
                        label="Image"
                        value={selectedItem.image}
                        onChange={(image) =>
                          updateItem(selectedCategory.id, selectedItem.id, {
                            ...selectedItem,
                            image,
                          })
                        }
                      />
                      <Field label="Blurb" hint="Hover + modal">
                        <Textarea
                          rows={2}
                          value={selectedItem.blurb}
                          onChange={(e) =>
                            updateItem(selectedCategory.id, selectedItem.id, {
                              ...selectedItem,
                              blurb: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="Preparation" hint="Modal only">
                        <Textarea
                          rows={2}
                          value={selectedItem.preparation}
                          onChange={(e) =>
                            updateItem(selectedCategory.id, selectedItem.id, {
                              ...selectedItem,
                              preparation: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Pairing" hint="Perfect pair">
                          <Input
                            value={selectedItem.pairing}
                            onChange={(e) =>
                              updateItem(selectedCategory.id, selectedItem.id, {
                                ...selectedItem,
                                pairing: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Allergens" hint="Modal only">
                          <Input
                            value={selectedItem.allergens}
                            onChange={(e) =>
                              updateItem(selectedCategory.id, selectedItem.id, {
                                ...selectedItem,
                                allergens: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Availability">
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                updateItem(selectedCategory.id, selectedItem.id, {
                                  ...selectedItem,
                                  status: opt.value,
                                })
                              }
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                                selectedItem.status === opt.value
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card border-border text-foreground/70 hover:bg-muted",
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                      Select an item to edit full detail fields.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <ImagePlus className="h-6 w-6 opacity-50" />
                  <p className="text-sm">Select or add a category to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 3. Shared signature dishes */}
      <SharedDishesSection
        priority="Low"
        note="Shared source with Homepage — one edit updates both."
      />
    </EditorShell>
  );
}

function StatusBadge({ status }: { status: MenuItemStatus }) {
  const map = {
    available: "bg-emerald-100 text-emerald-700",
    sold_out: "bg-amber-100 text-amber-800",
    hidden: "bg-muted text-muted-foreground",
  } as const;
  const label = {
    available: "Available",
    sold_out: "Sold out",
    hidden: "Hidden",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", map[status])}>
      {label[status]}
    </span>
  );
}
