import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EditorShell,
  Field,
  ImageField,
  LinkFields,
  SectionCard,
} from "@/components/cms/fields";
import {
  CONTACT_SECTIONS,
  DEFAULT_CONTACT,
  type ContactContent,
} from "@/data/contact-content";
import {
  getSiteSettings,
  hydrateSiteSettings,
  useSharedSiteSettings,
} from "@/data/shared-site-settings";
import { loadContactCms, saveContactCms } from "@/lib/contact-cms";
import { toast } from "sonner";

export default function ContactEditor() {
  const [content, setContent] = useState<ContactContent>(DEFAULT_CONTACT);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_CONTACT));
  const [active, setActive] = useState("settings");
  const { settings, setSettings, dirty: settingsDirty, save: saveSettingsLocal } = useSharedSiteSettings();
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(content) !== savedSnapshot || settingsDirty;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadContactCms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
        hydrateSiteSettings(bundle.settings);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Contact from Supabase");
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
      await saveContactCms({
        content,
        settings: getSiteSettings(),
        pageId,
      });
      const refreshed = await loadContactCms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      hydrateSiteSettings(refreshed.settings);
      saveSettingsLocal();
      toast.success("Contact page saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Contact page");
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
      title="Contact content"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Site-wide settings and Contact page media/copy."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={CONTACT_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Site settings */}
      <SectionCard
        id="settings"
        title="Site settings"
        layout="Address · phone · email · hours · maps — used site-wide"
        priority="High"
      >
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-xs text-muted-foreground">
          These values power the Contact info grid, footer Contact block, footer map, and opening hours on the public site.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Address line 1">
            <Input
              value={settings.addressLine1}
              onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
            />
          </Field>
          <Field label="Address line 2">
            <Input
              value={settings.addressLine2}
              onChange={(e) => setSettings({ ...settings, addressLine2: e.target.value })}
            />
          </Field>
          <Field label="City">
            <Input
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
            />
          </Field>
          <Field label="State">
            <Input
              value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
            />
          </Field>
          <Field label="Pincode">
            <Input
              value={settings.pincode}
              onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
            />
          </Field>
          <Field label="Phone display">
            <Input
              value={settings.phoneDisplay}
              onChange={(e) => setSettings({ ...settings, phoneDisplay: e.target.value })}
            />
          </Field>
          <Field label="Phone primary" hint="Digits for tel: link">
            <Input
              value={settings.phonePrimary}
              onChange={(e) => setSettings({ ...settings, phonePrimary: e.target.value })}
            />
          </Field>
          <Field label="Email primary">
            <Input
              value={settings.emailPrimary}
              onChange={(e) => setSettings({ ...settings, emailPrimary: e.target.value })}
            />
          </Field>
          <Field label="Contact page hours" className="sm:col-span-2" hint="Info grid — e.g. 12:00 PM – 11:00 PM (All Days)">
            <Input
              value={settings.hoursText}
              onChange={(e) => setSettings({ ...settings, hoursText: e.target.value })}
            />
          </Field>
          <Field label="Footer hours — Mon–Thu" hint="Opening Hours column">
            <Input
              value={settings.footerHoursWeekday}
              onChange={(e) => setSettings({ ...settings, footerHoursWeekday: e.target.value })}
            />
          </Field>
          <Field label="Footer hours — Fri–Sun" hint="Opening Hours column">
            <Input
              value={settings.footerHoursWeekend}
              onChange={(e) => setSettings({ ...settings, footerHoursWeekend: e.target.value })}
            />
          </Field>
          <Field label="Google Maps URL" className="sm:col-span-2">
            <Input
              value={settings.googleMapsUrl}
              onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })}
            />
          </Field>
          <Field label="Google Maps embed URL" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={settings.googleMapsEmbedUrl}
              onChange={(e) => setSettings({ ...settings, googleMapsEmbedUrl: e.target.value })}
            />
          </Field>
          <Field label="Enquiry confirmation message" className="sm:col-span-2" hint="Global">
            <Textarea
              rows={2}
              value={settings.enquiryConfirmationMessage}
              onChange={(e) =>
                setSettings({ ...settings, enquiryConfirmationMessage: e.target.value })
              }
            />
          </Field>
        </div>
      </SectionCard>

      {/* 2. Hero + info labels */}
      <SectionCard
        id="hero"
        title="Hero & info grid"
        layout="Large image + left/bottom text · 4 info columns"
        priority="High"
      >
        <ImageField
          label="Hero image"
          folder="contact"
          value={content.hero.image}
          onChange={(image) => setContent((c) => ({ ...c, hero: { ...c.hero, image } }))}
        />
        <Field label="Headline">
          <Input
            value={content.hero.headline}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))
            }
          />
        </Field>
        <Field label="Body">
          <Textarea
            rows={2}
            value={content.hero.body}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, body: e.target.value } }))
            }
          />
        </Field>

        <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
          <p className="text-sm font-medium">Info column labels</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Location">
              <Input
                value={content.infoLabels.location}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    infoLabels: { ...c.infoLabels, location: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                value={content.infoLabels.phone}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    infoLabels: { ...c.infoLabels, phone: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Email">
              <Input
                value={content.infoLabels.email}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    infoLabels: { ...c.infoLabels, email: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Hours">
              <Input
                value={content.infoLabels.hours}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    infoLabels: { ...c.infoLabels, hours: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground/80">Live preview from site settings</p>
            <p>
              {settings.addressLine1}, {settings.addressLine2}
            </p>
            <p>
              {settings.city} · {settings.state} · {settings.pincode}
            </p>
            <p>{settings.phoneDisplay}</p>
            <p>{settings.emailPrimary}</p>
            <p>Contact hours: {settings.hoursText}</p>
            <p>
              Footer: Mon–Thu {settings.footerHoursWeekday} · Fri–Sun {settings.footerHoursWeekend}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 3. Map */}
      <SectionCard
        id="map"
        title="Map"
        layout="Full-width embed + pin overlay"
        priority="High"
      >
        <Field label="Embed URL">
          <Textarea
            rows={2}
            value={settings.googleMapsEmbedUrl}
            onChange={(e) => setSettings({ ...settings, googleMapsEmbedUrl: e.target.value })}
          />
        </Field>
        <Field label="Click-through URL">
          <Input
            value={settings.googleMapsUrl}
            onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Pin label">
            <Input
              value={content.map.pinLabel}
              onChange={(e) =>
                setContent((c) => ({ ...c, map: { ...c.map, pinLabel: e.target.value } }))
              }
            />
          </Field>
          <Field label="Iframe title" hint="Optional">
            <Input
              value={content.map.iframeTitle}
              onChange={(e) =>
                setContent((c) => ({ ...c, map: { ...c.map, iframeTitle: e.target.value } }))
              }
            />
          </Field>
        </div>
      </SectionCard>

      {/* 4. Panels */}
      <SectionCard
        id="panels"
        title="Ending section"
        layout="Two alternating panels — Reserve a Table · Private Enquiry"
        priority="High"
      >
        <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
          <p className="text-sm font-medium">Panel A — Reserve a Table</p>
          <ImageField
            label="Image"
            folder="contact"
            value={content.reservePanel.image}
            onChange={(image) =>
              setContent((c) => ({
                ...c,
                reservePanel: { ...c.reservePanel, image },
              }))
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Eyebrow">
              <Input
                value={content.reservePanel.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    reservePanel: { ...c.reservePanel, eyebrow: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Headline">
              <Input
                value={content.reservePanel.headline}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    reservePanel: { ...c.reservePanel, headline: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Body">
            <Textarea
              rows={2}
              value={content.reservePanel.body}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  reservePanel: { ...c.reservePanel, body: e.target.value },
                }))
              }
            />
          </Field>
          <LinkFields
            label="Button"
            value={content.reservePanel.button}
            onChange={(button) =>
              setContent((c) => ({
                ...c,
                reservePanel: { ...c.reservePanel, button },
              }))
            }
          />
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
          <p className="text-sm font-medium">Panel B — Private Enquiry</p>
          <ImageField
            label="Background image"
            folder="contact"
            value={content.enquiryPanel.background}
            onChange={(background) =>
              setContent((c) => ({
                ...c,
                enquiryPanel: { ...c.enquiryPanel, background },
              }))
            }
          />
          <ImageField
            label="Leaf decor"
            folder="contact"
            value={content.enquiryPanel.leafDecor}
            onChange={(leafDecor) =>
              setContent((c) => ({
                ...c,
                enquiryPanel: { ...c.enquiryPanel, leafDecor },
              }))
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Eyebrow">
              <Input
                value={content.enquiryPanel.eyebrow}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    enquiryPanel: { ...c.enquiryPanel, eyebrow: e.target.value },
                  }))
                }
              />
            </Field>
            <Field label="Headline">
              <Input
                value={content.enquiryPanel.headline}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    enquiryPanel: { ...c.enquiryPanel, headline: e.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Body">
            <Textarea
              rows={2}
              value={content.enquiryPanel.body}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  enquiryPanel: { ...c.enquiryPanel, body: e.target.value },
                }))
              }
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Email & phone shown on this panel come from site settings ({settings.emailPrimary} ·{" "}
            {settings.phoneDisplay}).
          </p>
        </div>
      </SectionCard>

      {/* 5. Form */}
      <SectionCard
        id="form"
        title="Enquiry form"
        layout="Placeholders · submit states · success template"
        priority="Medium"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name placeholder">
            <Input
              value={content.form.namePlaceholder}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, namePlaceholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Email placeholder">
            <Input
              value={content.form.emailPlaceholder}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, emailPlaceholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Occasion placeholder">
            <Input
              value={content.form.occasionPlaceholder}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, occasionPlaceholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Date placeholder">
            <Input
              value={content.form.datePlaceholder}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, datePlaceholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Guests placeholder">
            <Input
              value={content.form.guestsPlaceholder}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, guestsPlaceholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Submit button">
            <Input
              value={content.form.submitLabel}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, submitLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Message placeholder" className="sm:col-span-2">
            <Input
              value={content.form.messagePlaceholder}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, messagePlaceholder: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Loading text">
            <Input
              value={content.form.loadingText}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, loadingText: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Error message">
            <Input
              value={content.form.errorMessage}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, errorMessage: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Success headline">
            <Input
              value={content.form.successHeadline}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, successHeadline: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Success body" hint="Token: {name}">
            <Input
              value={content.form.successBodyTemplate}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  form: { ...c.form, successBodyTemplate: e.target.value },
                }))
              }
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Live form opens WhatsApp. Level 5 can prefill via{" "}
          <code className="text-[11px]">sessionStorage.level5-enquiry</code>.
        </p>
      </SectionCard>
    </EditorShell>
  );
}
