import { useId, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, GripVertical, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MediaRef } from "@/data/homepage-content";
import { uploadMediaFile } from "@/lib/media";
import { toast } from "sonner";

export function uid() {
  return crypto.randomUUID();
}

export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

export function PriorityPill({ priority }: { priority: "High" | "Medium" | "Low" }) {
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

export function Field({
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

export function SectionCard({
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

export function ImageField({
  label,
  value,
  onChange,
  folder = "homepage",
  maxBytes,
  recommended,
}: {
  label: string;
  value: MediaRef;
  onChange: (next: MediaRef) => void;
  folder?: string;
  maxBytes?: number;
  recommended?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (maxBytes && file.size > maxBytes) {
      toast.error(
        `Image is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Use a file under ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const localPreview = URL.createObjectURL(file);
    onChange({ name: file.name, previewUrl: localPreview, path: value.path });
    setUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, folder);
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
              {uploading
                ? "Uploading to storage…"
                : recommended
                  ? recommended
                  : "Click to replace image"}
            </p>
          </div>
        </div>
      </button>
    </Field>
  );
}

export function LinkFields({
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
        <Input value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
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

export function ItemToolbar({
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

export function StringListEditor({
  title,
  addLabel = "Add item",
  values,
  onChange,
  multiline = false,
  placeholder = "",
}: {
  title: string;
  addLabel?: string;
  values: string[];
  onChange: (next: string[]) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...values, ""])}>
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
      </div>
      {values.map((value, i) => (
        <div key={i} className="flex gap-2 items-start">
          {multiline ? (
            <textarea
              className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
          ) : (
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-rose-600"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {values.length === 0 ? (
        <p className="text-xs text-muted-foreground">No items yet.</p>
      ) : null}
    </div>
  );
}

export function EditorShell({
  title,
  subtitle,
  dirty,
  onSave,
  sections,
  active,
  onNavigate,
  children,
  busy = false,
}: {
  title: string;
  subtitle: string;
  dirty: boolean;
  onSave: () => void;
  sections: readonly { id: string; label: string; priority: "High" | "Medium" | "Low" }[];
  active: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="sticky top-0 z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 sm:py-0 sm:static bg-mesh/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitle} {dirty ? "You have unsaved changes." : "All changes saved."}
            </p>
          </div>
          <Button type="button" onClick={onSave} disabled={!dirty || busy} className="shrink-0">
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-4 sm:gap-5">
        <nav className="xl:sticky xl:top-4 self-start rounded-2xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sections
          </p>
          <ul className="flex xl:flex-col gap-1 overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(s.id)}
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
        <div className="space-y-4 sm:space-y-5 min-w-0">{children}</div>
      </div>
    </div>
  );
}
