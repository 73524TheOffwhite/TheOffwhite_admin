import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EditorShell,
  Field,
  ImageField,
  SectionCard,
} from "@/components/cms/fields";
import {
  DEFAULT_RESERVATIONS,
  RESERVATIONS_SECTIONS,
  type ReservationsContent,
} from "@/data/reservations-content";
import {
  getAvailability,
  hydrateAvailability,
  useSharedAvailability,
} from "@/data/shared-availability";
import { loadReservationsCms, saveReservationsCms } from "@/lib/reservations-cms";
import { toast } from "sonner";

export default function ReservationsEditor() {
  const [content, setContent] = useState<ReservationsContent>(DEFAULT_RESERVATIONS);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_RESERVATIONS));
  const [active, setActive] = useState("hero");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { dirty: availDirty, save: saveAvail } = useSharedAvailability();

  const dirty = JSON.stringify(content) !== savedSnapshot || availDirty;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadReservationsCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
        hydrateAvailability(bundle.availability);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Reservations from Supabase");
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
      await saveReservationsCms({
        content,
        availability: getAvailability(),
        pageId,
      });
      const refreshed = await loadReservationsCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      hydrateAvailability(refreshed.availability);
      saveAvail();
      toast.success("Reservations page saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Reservations page");
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
      title="Reservations"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Live page hero + WhatsApp (number also updates footer phone display)."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={RESERVATIONS_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      <SectionCard
        id="hero"
        title="Hero"
        layout="Full-bleed image · eyebrow · headline · tagline · WhatsApp CTA · trust line"
        priority="High"
      >
        <ImageField
          label="Hero image"
          folder="reservations"
          value={content.hero.image}
          onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.hero.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="WhatsApp button label">
            <Input
              value={content.hero.button2Label}
              onChange={(e) =>
                setContent((c) => ({ ...c, hero: { ...c.hero, button2Label: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Headline">
          <Input
            value={content.hero.headline}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Tagline">
          <Textarea
            rows={2}
            value={content.hero.tagline}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, tagline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Trust line" hint="Shown under the WhatsApp button">
          <Input
            value={content.hero.trustLine}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, trustLine: e.target.value } }))
            }
          />
        </Field>
      </SectionCard>

      <SectionCard
        id="whatsapp"
        title="WhatsApp"
        layout="Site-wide number · display · prefill — used on Reservations CTA, float, footer phone"
        priority="High"
      >
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-xs text-muted-foreground">
          Changing the display number updates the Reservations WhatsApp CTA and the footer phone. The
          digit number powers <code className="text-[11px]">wa.me</code> links site-wide.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="WhatsApp number" hint="Digits only for wa.me — e.g. 918767811778">
            <Input
              value={content.settings.whatsappNumber}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  settings: { ...c.settings, whatsappNumber: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Display phone" hint="Shown under WhatsApp Concierge + footer">
            <Input
              value={content.settings.whatsappDisplay}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  settings: { ...c.settings, whatsappDisplay: e.target.value },
                }))
              }
            />
          </Field>
        </div>
        <Field
          label="WhatsApp prefill message"
          hint="Used by the floating WhatsApp button site-wide"
        >
          <Textarea
            rows={3}
            value={content.settings.whatsappPrefill}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                settings: { ...c.settings, whatsappPrefill: e.target.value },
              }))
            }
          />
        </Field>
      </SectionCard>
    </EditorShell>
  );
}
