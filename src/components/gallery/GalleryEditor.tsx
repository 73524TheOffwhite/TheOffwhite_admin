import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  EditorShell,
  Field,
  ImageField,
  ItemToolbar,
  SectionCard,
  moveItem,
  uid,
} from "@/components/cms/fields";
import {
  DEFAULT_GALLERY,
  GALLERY_SECTIONS,
  type GalleryCategory,
  type GalleryContent,
  type GalleryPhoto,
  type TourHotspot,
  type TourScene,
} from "@/data/gallery-content";
import { loadGalleryCms, saveGalleryCms } from "@/lib/gallery-cms";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function GalleryEditor() {
  const [content, setContent] = useState<GalleryContent>(DEFAULT_GALLERY);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_GALLERY));
  const [active, setActive] = useState("header");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<string>("all");
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    DEFAULT_GALLERY.photos[0]?.id ?? null,
  );
  const [selectedSceneId, setSelectedSceneId] = useState(
    DEFAULT_GALLERY.tour.scenes[0]?.id ?? "",
  );

  const dirty = JSON.stringify(content) !== savedSnapshot;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadGalleryCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
        setSelectedPhotoId(bundle.content.photos[0]?.id ?? null);
        setSelectedSceneId(bundle.content.tour.scenes[0]?.id ?? "");
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Gallery from Supabase");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterableCategories = useMemo(
    () => content.categories.filter((c) => c.key !== "all" && c.key !== "tour360"),
    [content.categories],
  );

  const categoryOptions = useMemo(
    () => content.categories.filter((c) => c.key !== "all"),
    [content.categories],
  );

  const visiblePhotos = useMemo(() => {
    const list = [...content.photos].sort((a, b) => a.sortOrder - b.sortOrder);
    if (photoFilter === "all") return list;
    return list.filter((p) => p.category === photoFilter);
  }, [content.photos, photoFilter]);

  const selectedPhoto = content.photos.find((p) => p.id === selectedPhotoId) ?? null;
  const selectedScene = content.tour.scenes.find((s) => s.id === selectedSceneId) ?? null;

  const save = async () => {
    setSaving(true);
    try {
      await saveGalleryCms({ content, pageId });
      const refreshed = await loadGalleryCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      toast.success("Gallery saved — changes are stored in Supabase");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Gallery");
    } finally {
      setSaving(false);
    }
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const photoById = (id: string) => content.photos.find((p) => p.id === id);

  return (
    <EditorShell
      title="Gallery content"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "One CMS library for photos, filter tabs, preview sets, and the 360° tour."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={GALLERY_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Header */}
      <SectionCard
        id="header"
        title="Page header"
        layout="Left-aligned title only (no hero image)"
        priority="Medium"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.header.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, header: { ...c.header, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="Headline">
            <Input
              value={content.header.headline}
              onChange={(e) =>
                setContent((c) => ({ ...c, header: { ...c.header, headline: e.target.value } }))
              }
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Collapsed toggle label">
            <Input
              value={content.toggle.expandLabel}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  toggle: { ...c.toggle, expandLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Expanded toggle label">
            <Input
              value={content.toggle.collapseLabel}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  toggle: { ...c.toggle, collapseLabel: e.target.value },
                }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      {/* 2. Categories */}
      <SectionCard
        id="categories"
        title="Filter tabs"
        layout="Horizontal category buttons — keep keys stable when linked to photos"
        priority="High"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Categories</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const key = `cat-${uid().slice(0, 6)}`;
              setContent((c) => ({
                ...c,
                categories: [...c.categories, { key, label: "New tab", hidden: false }],
                previewSets: { ...c.previewSets, [key]: [] },
              }));
            }}
          >
            <Plus className="h-4 w-4" /> Add category
          </Button>
        </div>
        <div className="space-y-2">
          {content.categories.map((cat, index) => (
            <CategoryRow
              key={cat.key}
              category={cat}
              index={index}
              total={content.categories.length}
              lockKey={cat.key === "all" || cat.key === "tour360"}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  categories: c.categories.map((x) => (x.key === cat.key ? next : x)),
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  categories: moveItem(c.categories, index, dir),
                }))
              }
              onRemove={() => {
                if (cat.key === "all" || cat.key === "tour360") return;
                setContent((c) => {
                  const { [cat.key]: _, ...restPreviews } = c.previewSets;
                  return {
                    ...c,
                    categories: c.categories.filter((x) => x.key !== cat.key),
                    previewSets: restPreviews,
                    photos: c.photos.map((p) =>
                      p.category === cat.key ? { ...p, category: "level4", active: false } : p,
                    ),
                  };
                });
              }}
            />
          ))}
        </div>
      </SectionCard>

      {/* 3. Photos */}
      <SectionCard
        id="photos"
        title="Photo library"
        layout="All photos · category · label · sort · featured · active. Events: 1800×2400 px (3:4), JPEG, under 5 MB."
        priority="High"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              active={photoFilter === "all"}
              onClick={() => setPhotoFilter("all")}
              label="All photos"
            />
            {categoryOptions.map((cat) => (
              <FilterChip
                key={cat.key}
                active={photoFilter === cat.key}
                onClick={() => setPhotoFilter(cat.key)}
                label={cat.label}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const id = uid();
              const category =
                photoFilter !== "all" && photoFilter !== "tour360"
                  ? photoFilter
                  : (filterableCategories[0]?.key ?? "food");
              const next: GalleryPhoto = {
                id,
                image: { name: "new-photo.jpg" },
                label: "New photo",
                category,
                sortOrder: content.photos.length + 1,
                featured: false,
                active: true,
              };
              setContent((c) => ({ ...c, photos: [...c.photos, next] }));
              setSelectedPhotoId(id);
            }}
          >
            <Plus className="h-4 w-4" /> Add photo
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_110px_70px_80px_70px_88px] gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 border-b border-border">
            <span>Label</span>
            <span>Category</span>
            <span>Sort</span>
            <span>Featured</span>
            <span>Active</span>
            <span className="text-right">Order</span>
          </div>
          <ul className="divide-y divide-border max-h-[360px] overflow-y-auto">
            {visiblePhotos.map((photo) => {
              const globalIndex = content.photos.findIndex((p) => p.id === photo.id);
              return (
                <li key={photo.id}>
                  <div
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_110px_70px_80px_70px_88px] gap-2 px-3 py-2.5 items-center cursor-pointer",
                      selectedPhotoId === photo.id ? "bg-primary/5" : "hover:bg-muted/40",
                      !photo.active && "opacity-50",
                    )}
                    onClick={() => setSelectedPhotoId(photo.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-12 rounded-md bg-muted overflow-hidden shrink-0 grid place-items-center">
                        {photo.image.previewUrl ? (
                          <img src={photo.image.previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-muted-foreground px-0.5 truncate">
                            {photo.image.name.split("/").pop()?.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{photo.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{photo.image.name}</p>
                      </div>
                    </div>
                    <p className="text-xs">
                      {content.categories.find((c) => c.key === photo.category)?.label ?? photo.category}
                    </p>
                    <p className="text-xs font-medium">{photo.sortOrder}</p>
                    <p className="text-xs">{photo.featured ? "Yes" : "—"}</p>
                    <p className="text-xs">{photo.active ? "Show" : "Hide"}</p>
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <ItemToolbar
                        onUp={() => {
                          if (globalIndex < 0) return;
                          setContent((c) => ({
                            ...c,
                            photos: moveItem(c.photos, globalIndex, -1),
                          }));
                        }}
                        onDown={() => {
                          if (globalIndex < 0) return;
                          setContent((c) => ({
                            ...c,
                            photos: moveItem(c.photos, globalIndex, 1),
                          }));
                        }}
                        onRemove={() => {
                          setContent((c) => ({
                            ...c,
                            photos: c.photos.filter((p) => p.id !== photo.id),
                            previewSets: Object.fromEntries(
                              Object.entries(c.previewSets).map(([k, ids]) => [
                                k,
                                ids.filter((id) => id !== photo.id),
                              ]),
                            ),
                          }));
                          if (selectedPhotoId === photo.id) setSelectedPhotoId(null);
                        }}
                        disableUp={globalIndex <= 0}
                        disableDown={globalIndex < 0 || globalIndex >= content.photos.length - 1}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
            {visiblePhotos.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-muted-foreground">No photos in this filter.</li>
            ) : null}
          </ul>
        </div>

        {selectedPhoto ? (
          <div className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4 space-y-3">
            <p className="text-sm font-semibold">Photo detail</p>
            <ImageField
              label="Image"
              folder={selectedPhoto.category === "events" ? "gallery/events" : "gallery"}
              maxBytes={selectedPhoto.category === "events" ? 5 * 1024 * 1024 : undefined}
              recommended={
                selectedPhoto.category === "events"
                  ? "Events: 1800×2400 (3:4 portrait), JPEG, under 5 MB — click to upload"
                  : undefined
              }
              value={selectedPhoto.image}
              onChange={(image) =>
                setContent((c) => ({
                  ...c,
                  photos: c.photos.map((p) => (p.id === selectedPhoto.id ? { ...p, image } : p)),
                }))
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Label / alt">
                <Input
                  value={selectedPhoto.label}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      photos: c.photos.map((p) =>
                        p.id === selectedPhoto.id ? { ...p, label: e.target.value } : p,
                      ),
                    }))
                  }
                />
              </Field>
              <Field label="Category">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedPhoto.category}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      photos: c.photos.map((p) =>
                        p.id === selectedPhoto.id ? { ...p, category: e.target.value } : p,
                      ),
                    }))
                  }
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={selectedPhoto.sortOrder}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      photos: c.photos.map((p) =>
                        p.id === selectedPhoto.id
                          ? { ...p, sortOrder: Number(e.target.value) || 0 }
                          : p,
                      ),
                    }))
                  }
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={selectedPhoto.featured}
                  onCheckedChange={(featured) =>
                    setContent((c) => ({
                      ...c,
                      photos: c.photos.map((p) =>
                        p.id === selectedPhoto.id ? { ...p, featured } : p,
                      ),
                    }))
                  }
                />
                Featured flag
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={selectedPhoto.active}
                  onCheckedChange={(active) =>
                    setContent((c) => ({
                      ...c,
                      photos: c.photos.map((p) =>
                        p.id === selectedPhoto.id ? { ...p, active } : p,
                      ),
                    }))
                  }
                />
                Active (show on site)
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lightbox uses this image + label as caption. Prev/next is UI behaviour on the public site.
            </p>
          </div>
        ) : null}
      </SectionCard>

      {/* 4. Preview sets */}
      <SectionCard
        id="previews"
        title="Preview sets"
        layout="Collapsed view shows 4 fixed picks per tab (360° shows tour instead)"
        priority="High"
      >
        <div className="space-y-4">
          {content.categories
            .filter((c) => c.key !== "tour360")
            .map((cat) => {
              const picks = content.previewSets[cat.key] ?? [];
              const eligible =
                cat.key === "all"
                  ? content.photos.filter((p) => p.active)
                  : content.photos.filter((p) => p.active && p.category === cat.key);
              return (
                <div key={cat.key} className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{cat.label} · 4 preview slots</p>
                    <span className="text-[11px] text-muted-foreground">
                      {picks.filter(Boolean).length}/4 filled
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((slot) => {
                      const pickId = picks[slot] ?? "";
                      const picked = pickId ? photoById(pickId) : null;
                      return (
                        <div key={slot} className="rounded-lg border border-border p-2 space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground">Slot {slot + 1}</p>
                          <select
                            className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                            value={pickId}
                            onChange={(e) => {
                              const next = [...(content.previewSets[cat.key] ?? [])];
                              while (next.length < 4) next.push("");
                              next[slot] = e.target.value;
                              setContent((c) => ({
                                ...c,
                                previewSets: {
                                  ...c.previewSets,
                                  [cat.key]: next.slice(0, 4),
                                },
                              }));
                            }}
                          >
                            <option value="">— empty —</option>
                            {eligible.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                          {picked ? (
                            <p className="text-[10px] text-muted-foreground truncate">{picked.image.name}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          <p className="text-xs text-muted-foreground">
            360° view tab does not use a photo preview grid — it opens the VirtualTour360 viewer.
          </p>
        </div>
      </SectionCard>

      {/* 5. 360 Tour */}
      <SectionCard
        id="tour"
        title="360° Tour"
        layout="Scenes · panoramas · thumbnails · hotspots"
        priority="High"
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          Current panoramas are Poly Haven demo placeholders — replace with real Off White equirectangular shots.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Tour scenes</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const id = uid().slice(0, 8);
              const scene: TourScene = {
                id,
                name: "New",
                label: "New scene",
                panorama: { name: "" },
                thumbnail: { name: "thumb.jpg" },
                hotspots: [],
              };
              setContent((c) => ({
                ...c,
                tour: { scenes: [...c.tour.scenes, scene] },
              }));
              setSelectedSceneId(id);
            }}
          >
            <Plus className="h-4 w-4" /> Add scene
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-3">
          <aside className="space-y-1 rounded-xl border border-border p-2 bg-background/50">
            {content.tour.scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={cn(
                  "rounded-lg border",
                  selectedSceneId === scene.id ? "border-primary/30 bg-primary/5" : "border-transparent",
                )}
              >
                <button
                  type="button"
                  className="w-full text-left px-2.5 py-2"
                  onClick={() => setSelectedSceneId(scene.id)}
                >
                  <p className="text-sm font-medium">{scene.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{scene.label}</p>
                </button>
                <div className="flex justify-end px-1 pb-1">
                  <ItemToolbar
                    onUp={() =>
                      setContent((c) => ({
                        ...c,
                        tour: { scenes: moveItem(c.tour.scenes, index, -1) },
                      }))
                    }
                    onDown={() =>
                      setContent((c) => ({
                        ...c,
                        tour: { scenes: moveItem(c.tour.scenes, index, 1) },
                      }))
                    }
                    onRemove={() => {
                      const next = content.tour.scenes.filter((s) => s.id !== scene.id);
                      setContent((c) => ({ ...c, tour: { scenes: next } }));
                      if (selectedSceneId === scene.id) setSelectedSceneId(next[0]?.id ?? "");
                    }}
                    disableUp={index === 0}
                    disableDown={index === content.tour.scenes.length - 1}
                  />
                </div>
              </div>
            ))}
          </aside>

          <div className="min-w-0">
            {selectedScene ? (
              <SceneEditor
                scene={selectedScene}
                allScenes={content.tour.scenes}
                onChange={(next) => {
                  setContent((c) => ({
                    ...c,
                    tour: {
                      scenes: c.tour.scenes.map((s) => (s.id === selectedScene.id ? next : s)),
                    },
                  }));
                  if (next.id !== selectedScene.id) setSelectedSceneId(next.id);
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">Select or add a scene.</p>
            )}
          </div>
        </div>
      </SectionCard>
    </EditorShell>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-foreground/70 hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function CategoryRow({
  category,
  index,
  total,
  lockKey,
  onChange,
  onMove,
  onRemove,
}: {
  category: GalleryCategory;
  index: number;
  total: number;
  lockKey: boolean;
  onChange: (next: GalleryCategory) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 flex flex-wrap items-end gap-3">
      <Field label="Key" className="w-28">
        <Input
          value={category.key}
          disabled={lockKey}
          onChange={(e) => onChange({ ...category, key: e.target.value.trim() || category.key })}
        />
      </Field>
      <Field label="Label" className="flex-1 min-w-[140px]">
        <Input
          value={category.label}
          onChange={(e) => onChange({ ...category, label: e.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm pb-2">
        <Switch
          checked={!category.hidden}
          onCheckedChange={(shown) => onChange({ ...category, hidden: !shown })}
        />
        Visible
      </label>
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

function SceneEditor({
  scene,
  allScenes,
  onChange,
}: {
  scene: TourScene;
  allScenes: TourScene[];
  onChange: (next: TourScene) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Scene ID">
          <Input
            value={scene.id}
            onChange={(e) => onChange({ ...scene, id: e.target.value.trim() || scene.id })}
          />
        </Field>
        <Field label="Name">
          <Input value={scene.name} onChange={(e) => onChange({ ...scene, name: e.target.value })} />
        </Field>
        <Field label="Label / caption">
          <Input value={scene.label} onChange={(e) => onChange({ ...scene, label: e.target.value })} />
        </Field>
      </div>
      <Field label="360 panorama (URL or file name)">
        <Input
          value={scene.panorama.name}
          onChange={(e) => onChange({ ...scene, panorama: { ...scene.panorama, name: e.target.value } })}
          placeholder="Equirectangular image URL or path"
        />
      </Field>
      <ImageField
        label="Or upload panorama"
        folder="gallery"
        value={scene.panorama}
        onChange={(panorama) => onChange({ ...scene, panorama })}
      />
      <ImageField
        label="Thumbnail"
        folder="gallery"
        value={scene.thumbnail}
        onChange={(thumbnail) => onChange({ ...scene, thumbnail })}
      />

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Hotspots</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const target = allScenes.find((s) => s.id !== scene.id)?.id ?? "";
              const hs: TourHotspot = {
                id: uid(),
                targetSceneId: target,
                linkName: "Go to",
                yaw: 0,
                pitch: 0,
              };
              onChange({ ...scene, hotspots: [...scene.hotspots, hs] });
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add hotspot
          </Button>
        </div>
        {scene.hotspots.map((hs, index) => (
          <div key={hs.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Hotspot {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-600 h-7"
                onClick={() =>
                  onChange({
                    ...scene,
                    hotspots: scene.hotspots.filter((h) => h.id !== hs.id),
                  })
                }
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Link name">
                <Input
                  value={hs.linkName}
                  onChange={(e) =>
                    onChange({
                      ...scene,
                      hotspots: scene.hotspots.map((h) =>
                        h.id === hs.id ? { ...h, linkName: e.target.value } : h,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Target scene">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={hs.targetSceneId}
                  onChange={(e) =>
                    onChange({
                      ...scene,
                      hotspots: scene.hotspots.map((h) =>
                        h.id === hs.id ? { ...h, targetSceneId: e.target.value } : h,
                      ),
                    })
                  }
                >
                  {allScenes
                    .filter((s) => s.id !== scene.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.label}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Yaw">
                <Input
                  type="number"
                  value={hs.yaw}
                  onChange={(e) =>
                    onChange({
                      ...scene,
                      hotspots: scene.hotspots.map((h) =>
                        h.id === hs.id ? { ...h, yaw: Number(e.target.value) || 0 } : h,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Pitch">
                <Input
                  type="number"
                  value={hs.pitch}
                  onChange={(e) =>
                    onChange({
                      ...scene,
                      hotspots: scene.hotspots.map((h) =>
                        h.id === hs.id ? { ...h, pitch: Number(e.target.value) || 0 } : h,
                      ),
                    })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
        {scene.hotspots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hotspots yet.</p>
        ) : null}
      </div>
    </div>
  );
}
