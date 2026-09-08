import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
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
import {
  DEFAULT_INBOX,
  DEFAULT_RESERVATIONS,
  RESERVATIONS_SECTIONS,
  type LocationOption,
  type OccasionChip,
  type ReservationSubmission,
  type ReservationsContent,
} from "@/data/reservations-content";
import {
  getAvailability,
  hydrateAvailability,
  useSharedAvailability,
} from "@/data/shared-availability";
import { loadReservationsCms, saveReservationsCms } from "@/lib/reservations-cms";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReservationsEditor() {
  const [content, setContent] = useState<ReservationsContent>(DEFAULT_RESERVATIONS);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_RESERVATIONS));
  const [inbox, setInbox] = useState<ReservationSubmission[]>(DEFAULT_INBOX);
  const [active, setActive] = useState("hero");
  const [inboxFilter, setInboxFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { availability, setAvailability, dirty: availDirty, save: saveAvail } = useSharedAvailability();

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

  const filteredInbox = inbox.filter((r) => inboxFilter === "all" || r.status === inboxFilter);

  const locationLabel = (id: string) =>
    content.step1.locations.find((l) => l.id === id)?.label ?? id;

  return (
    <EditorShell
      title="Reservations"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Page copy, availability ops (shared with Home mini-form), and submissions inbox."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={RESERVATIONS_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Hero */}
      <SectionCard
        id="hero"
        title="Hero"
        layout="Full-bleed image · left text · 2 CTAs"
        priority="High"
      >
        <ImageField
          label="Image"
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
          <Field label="Headline">
            <Input
              value={content.hero.headline}
              onChange={(e) =>
                setContent((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Tagline">
          <Input
            value={content.hero.tagline}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, tagline: e.target.value } }))
            }
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Button 1 · label" hint="Scrolls to #book">
            <Input
              value={content.hero.button1Label}
              onChange={(e) =>
                setContent((c) => ({ ...c, hero: { ...c.hero, button1Label: e.target.value } }))
              }
            />
          </Field>
          <Field label="Button 2 · WhatsApp label">
            <Input
              value={content.hero.button2Label}
              onChange={(e) =>
                setContent((c) => ({ ...c, hero: { ...c.hero, button2Label: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Trust line">
          <Input
            value={content.hero.trustLine}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, trustLine: e.target.value } }))
            }
          />
        </Field>
      </SectionCard>

      {/* 2. Step copy */}
      <SectionCard
        id="steps"
        title="Step copy & form labels"
        layout="Step indicator · Step 1 & Step 2 marketing copy"
        priority="Medium"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Step 01 label">
            <Input
              value={content.steps.step1Label}
              onChange={(e) =>
                setContent((c) => ({ ...c, steps: { ...c.steps, step1Label: e.target.value } }))
              }
            />
          </Field>
          <Field label="Step 02 label">
            <Input
              value={content.steps.step2Label}
              onChange={(e) =>
                setContent((c) => ({ ...c, steps: { ...c.steps, step2Label: e.target.value } }))
              }
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <p className="text-sm font-medium">Step 1 — Book Your Table</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Step title">
              <Input
                value={content.step1.title}
                onChange={(e) =>
                  setContent((c) => ({ ...c, step1: { ...c.step1, title: e.target.value } }))
                }
              />
            </Field>
            <Field label="Continue button">
              <Input
                value={content.step1.continueLabel}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step1: { ...c.step1, continueLabel: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Unavailable / blocked message">
            <Input
              value={content.step1.unavailableMessage}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  step1: { ...c.step1, unavailableMessage: e.target.value },
                }))
              }
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <p className="text-sm font-medium">Step 2 — Confirm & Reserve</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Headline">
              <Input
                value={content.step2.headline}
                onChange={(e) =>
                  setContent((c) => ({ ...c, step2: { ...c.step2, headline: e.target.value } }))
                }
              />
            </Field>
            <Field label="Summary title">
              <Input
                value={content.step2.summaryTitle}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, summaryTitle: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Body">
            <Textarea
              rows={2}
              value={content.step2.body}
              onChange={(e) =>
                setContent((c) => ({ ...c, step2: { ...c.step2, body: e.target.value } }))
              }
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Edit button">
              <Input
                value={content.step2.editButtonLabel}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, editButtonLabel: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Submit button">
              <Input
                value={content.step2.submitLabel}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, submitLabel: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Name placeholder">
              <Input
                value={content.step2.namePlaceholder}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, namePlaceholder: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Phone placeholder">
              <Input
                value={content.step2.phonePlaceholder}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, phonePlaceholder: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Special request placeholder" className="sm:col-span-2">
              <Input
                value={content.step2.specialRequestPlaceholder}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, specialRequestPlaceholder: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Loading text">
              <Input
                value={content.step2.loadingText}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, loadingText: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="WhatsApp alt CTA" hint="Use {phone}">
              <Input
                value={content.step2.whatsappAltLabel}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, whatsappAltLabel: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Error message" className="sm:col-span-2">
              <Input
                value={content.step2.errorMessage}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    step2: { ...c.step2, errorMessage: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* 3. Availability — shared */}
      <SectionCard
        id="availability"
        title="Availability (shared)"
        layout="Time slots · max guests · blackouts — also used by Home mini-form"
        priority="High"
      >
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-xs text-muted-foreground">
          Shared ops settings. Changes here apply to both the Reservations page and the Homepage mini booking form.
        </div>

        <Field label="Max guests">
          <Input
            type="number"
            min={1}
            max={50}
            className="max-w-[140px]"
            value={availability.maxGuests}
            onChange={(e) =>
              setAvailability({
                ...availability,
                maxGuests: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Time slots</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setAvailability({
                  ...availability,
                  timeSlots: [
                    ...availability.timeSlots,
                    { id: uid(), label: "7:00 PM", locationIds: [] },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" /> Add slot
            </Button>
          </div>
          {availability.timeSlots.map((slot, index) => (
            <div
              key={slot.id}
              className="rounded-xl border border-border bg-background/60 p-3 flex flex-wrap items-end gap-3"
            >
              <Field label="Time label" className="flex-1 min-w-[120px]">
                <Input
                  value={slot.label}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      timeSlots: availability.timeSlots.map((s) =>
                        s.id === slot.id ? { ...s, label: e.target.value } : s,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Locations" hint="Empty = all" className="flex-1 min-w-[180px]">
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {content.step1.locations.map((loc) => {
                    const on = slot.locationIds.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          const locationIds = on
                            ? slot.locationIds.filter((id) => id !== loc.id)
                            : [...slot.locationIds, loc.id];
                          setAvailability({
                            ...availability,
                            timeSlots: availability.timeSlots.map((s) =>
                              s.id === slot.id ? { ...s, locationIds } : s,
                            ),
                          });
                        }}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium border",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-foreground/70",
                        )}
                      >
                        {loc.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <ItemToolbar
                onUp={() =>
                  setAvailability({
                    ...availability,
                    timeSlots: moveItem(availability.timeSlots, index, -1),
                  })
                }
                onDown={() =>
                  setAvailability({
                    ...availability,
                    timeSlots: moveItem(availability.timeSlots, index, 1),
                  })
                }
                onRemove={() =>
                  setAvailability({
                    ...availability,
                    timeSlots: availability.timeSlots.filter((s) => s.id !== slot.id),
                  })
                }
                disableUp={index === 0}
                disableDown={index === availability.timeSlots.length - 1}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Blackout dates</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setAvailability({
                  ...availability,
                  blackouts: [
                    ...availability.blackouts,
                    {
                      id: uid(),
                      date: new Date().toISOString().slice(0, 10),
                      locationIds: [],
                      note: "",
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" /> Add blackout
            </Button>
          </div>
          {availability.blackouts.map((bo) => (
            <div
              key={bo.id}
              className="rounded-xl border border-border bg-background/60 p-3 grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 items-end"
            >
              <Field label="Date">
                <Input
                  type="date"
                  value={bo.date}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      blackouts: availability.blackouts.map((b) =>
                        b.id === bo.id ? { ...b, date: e.target.value } : b,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Note">
                <Input
                  value={bo.note}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      blackouts: availability.blackouts.map((b) =>
                        b.id === bo.id ? { ...b, note: e.target.value } : b,
                      ),
                    })
                  }
                  placeholder="Optional reason"
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-rose-600"
                onClick={() =>
                  setAvailability({
                    ...availability,
                    blackouts: availability.blackouts.filter((b) => b.id !== bo.id),
                  })
                }
              >
                <X className="h-4 w-4" />
              </Button>
              <Field label="Scope" hint="Empty = all locations" className="sm:col-span-3">
                <div className="flex flex-wrap gap-1.5">
                  {content.step1.locations.map((loc) => {
                    const on = bo.locationIds.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          const locationIds = on
                            ? bo.locationIds.filter((id) => id !== loc.id)
                            : [...bo.locationIds, loc.id];
                          setAvailability({
                            ...availability,
                            blackouts: availability.blackouts.map((b) =>
                              b.id === bo.id ? { ...b, locationIds } : b,
                            ),
                          });
                        }}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium border",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-foreground/70",
                        )}
                      >
                        {loc.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          ))}
          {availability.blackouts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No blackout dates.</p>
          ) : null}
        </div>
      </SectionCard>

      {/* 4. Locations & occasions */}
      <SectionCard
        id="locations"
        title="Locations & occasions"
        layout="Location cards · occasion chips"
        priority="High"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Location cards</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  step1: {
                    ...c.step1,
                    locations: [
                      ...c.step1.locations,
                      { id: `loc-${uid().slice(0, 6)}`, label: "NEW LEVEL", sub: "Description" },
                    ],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add location
            </Button>
          </div>
          {content.step1.locations.map((loc, index) => (
            <LocationEditor
              key={loc.id}
              location={loc}
              index={index}
              total={content.step1.locations.length}
              onChange={(next) =>
                setContent((c) => ({
                  ...c,
                  step1: {
                    ...c.step1,
                    locations: c.step1.locations.map((l) => (l.id === loc.id ? next : l)),
                  },
                }))
              }
              onMove={(dir) =>
                setContent((c) => ({
                  ...c,
                  step1: {
                    ...c.step1,
                    locations: moveItem(c.step1.locations, index, dir),
                  },
                }))
              }
              onRemove={() =>
                setContent((c) => ({
                  ...c,
                  step1: {
                    ...c.step1,
                    locations: c.step1.locations.filter((l) => l.id !== loc.id),
                  },
                }))
              }
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Occasion chips</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  step1: {
                    ...c.step1,
                    occasions: [...c.step1.occasions, { id: uid(), label: "New occasion" }],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add occasion
            </Button>
          </div>
          {content.step1.occasions.map((occ, index) => (
            <div
              key={occ.id}
              className="rounded-xl border border-border bg-background/60 p-3 flex flex-wrap items-end gap-3"
            >
              <Field label="Label" className="flex-1 min-w-[160px]">
                <Input
                  value={occ.label}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      step1: {
                        ...c.step1,
                        occasions: c.step1.occasions.map((o) =>
                          o.id === occ.id ? { ...o, label: e.target.value } : o,
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
                    step1: {
                      ...c.step1,
                      occasions: moveItem(c.step1.occasions, index, -1),
                    },
                  }))
                }
                onDown={() =>
                  setContent((c) => ({
                    ...c,
                    step1: {
                      ...c.step1,
                      occasions: moveItem(c.step1.occasions, index, 1),
                    },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    step1: {
                      ...c.step1,
                      occasions: c.step1.occasions.filter((o) => o.id !== occ.id),
                    },
                  }))
                }
                disableUp={index === 0}
                disableDown={index === content.step1.occasions.length - 1}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 5. Success & WhatsApp */}
      <SectionCard
        id="success"
        title="Success & WhatsApp settings"
        layout="Success copy · global WhatsApp · confirmation message"
        priority="Medium"
      >
        <Field label="Success headline">
          <Input
            value={content.success.headline}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                success: { ...c.success, headline: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Success body template" hint="Tokens: {name} {date} {time} {phone}">
          <Textarea
            rows={3}
            value={content.success.bodyTemplate}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                success: { ...c.success, bodyTemplate: e.target.value },
              }))
            }
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="WhatsApp number" hint="Digits only, with country code">
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
          <Field label="WhatsApp phone display">
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
        <Field label="WhatsApp prefill message">
          <Textarea
            rows={2}
            value={content.settings.whatsappPrefill}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                settings: { ...c.settings, whatsappPrefill: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Global confirmation message" hint="reservation_confirmation_message">
          <Textarea
            rows={2}
            value={content.settings.confirmationMessage}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                settings: { ...c.settings, confirmationMessage: e.target.value },
              }))
            }
          />
        </Field>
      </SectionCard>

      {/* 6. Inbox */}
      <SectionCard
        id="inbox"
        title="Reservations inbox"
        layout="View submissions · confirm / cancel (staff workflow)"
        priority="High"
      >
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
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
              {f !== "all" ? (
                <span className="ml-1 opacity-70">
                  ({inbox.filter((r) => r.status === f).length})
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <ul className="divide-y divide-border">
            {filteredInbox.map((row) => (
              <li key={row.id} className="p-3 sm:p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      +91 {row.phone} · {row.source === "home_mini" ? "Home mini" : "Full form"}
                    </p>
                  </div>
                  <StatusPill status={row.status} />
                </div>
                <p className="text-sm">
                  {row.date} · {row.time} · {row.guests} guests · {locationLabel(row.locationId)}
                  {row.occasion ? ` · ${row.occasion}` : ""}
                </p>
                {row.specialRequest ? (
                  <p className="text-xs text-muted-foreground">{row.specialRequest}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={row.status === "confirmed"}
                    onClick={() =>
                      setInbox((list) =>
                        list.map((r) => (r.id === row.id ? { ...r, status: "confirmed" } : r)),
                      )
                    }
                  >
                    <Check className="h-3.5 w-3.5" /> Confirm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    disabled={row.status === "cancelled"}
                    onClick={() =>
                      setInbox((list) =>
                        list.map((r) => (r.id === row.id ? { ...r, status: "cancelled" } : r)),
                      )
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </li>
            ))}
            {filteredInbox.length === 0 ? (
              <li className="px-4 py-10 text-center text-xs text-muted-foreground">
                No reservations in this filter.
              </li>
            ) : null}
          </ul>
        </div>
      </SectionCard>
    </EditorShell>
  );
}

function StatusPill({ status }: { status: ReservationSubmission["status"] }) {
  const map = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
  } as const;
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize", map[status])}>
      {status}
    </span>
  );
}

function LocationEditor({
  location,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  location: LocationOption;
  index: number;
  total: number;
  onChange: (next: LocationOption) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Location {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="ID">
          <Input
            value={location.id}
            onChange={(e) => onChange({ ...location, id: e.target.value.trim() || location.id })}
          />
        </Field>
        <Field label="Label">
          <Input
            value={location.label}
            onChange={(e) => onChange({ ...location, label: e.target.value })}
          />
        </Field>
        <Field label="Sub">
          <Input
            value={location.sub}
            onChange={(e) => onChange({ ...location, sub: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
