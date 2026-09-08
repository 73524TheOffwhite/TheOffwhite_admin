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
import {
  DEFAULT_LEVEL4,
  LEVEL4_SECTIONS,
  type Level4Content,
} from "@/data/level4-content";
import { loadLevel4Cms, saveLevel4Cms } from "@/lib/level4-cms";
import { toast } from "sonner";

export default function Level4Editor() {
  const [content, setContent] = useState<Level4Content>(DEFAULT_LEVEL4);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(DEFAULT_LEVEL4));
  const [active, setActive] = useState("hero");
  const [pageId, setPageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(content) !== savedSnapshot;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadLevel4Cms();
        if (cancelled) return;
        setContent(bundle.content);
        setSavedSnapshot(JSON.stringify(bundle.content));
        setPageId(bundle.pageId);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load Level 4 from Supabase");
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
      await saveLevel4Cms({ content, pageId });
      const refreshed = await loadLevel4Cms();
      setContent(refreshed.content);
      setSavedSnapshot(JSON.stringify(refreshed.content));
      setPageId(refreshed.pageId);
      toast.success("Level 4 saved — live site will use these changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Level 4 page");
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
      title="Level 4 content"
      subtitle={
        loading
          ? "Loading from Supabase…"
          : saving
            ? "Saving…"
            : "Hero collage, mood block, and fine-dining story for the Level 4 page."
      }
      dirty={dirty}
      busy={loading || saving}
      onSave={() => void save()}
      sections={LEVEL4_SECTIONS}
      active={active}
      onNavigate={scrollTo}
    >
      {/* 1. Hero + collage */}
      <SectionCard
        id="hero"
        title="Hero collage"
        layout="Asymmetrical grid — copy + 3 fixed image slots"
        priority="High"
      >
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
        <Field label="Body">
          <Textarea
            rows={3}
            value={content.hero.body}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, body: e.target.value } }))
            }
          />
        </Field>
        <Field label="Button label" hint="Scrolls to mood block">
          <Input
            value={content.hero.buttonLabel}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, buttonLabel: e.target.value } }))
            }
          />
        </Field>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Collage images</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fixed slots — replace image and edit alt only.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {content.collage.map((slot) => (
              <div
                key={slot.id}
                className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3"
              >
                <p className="text-xs font-semibold text-muted-foreground">{slot.label}</p>
                <ImageField
                  label="Image"
                  folder="level-4"
                  value={slot.image}
                  onChange={(image) =>
                    setContent((c) => ({
                      ...c,
                      collage: c.collage.map((s) => (s.id === slot.id ? { ...s, image } : s)),
                    }))
                  }
                />
                <Field label="Alt text">
                  <Input
                    value={slot.alt}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        collage: c.collage.map((s) =>
                          s.id === slot.id ? { ...s, alt: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 2. Mood */}
      <SectionCard
        id="mood"
        title="Mood block"
        layout="Icon · quote lines · Discover More CTA"
        priority="Medium"
      >
        <p className="text-xs text-muted-foreground -mt-1">
          Sunflower icon is decorative layout chrome — optional swap later.
        </p>
        <StringListEditor
          title="Quote lines"
          addLabel="Add line"
          values={content.mood.quoteLines}
          onChange={(quoteLines) =>
            setContent((c) => ({ ...c, mood: { ...c.mood, quoteLines } }))
          }
          placeholder="The light changes."
        />
        <LinkFields
          label="Button"
          value={content.mood.button}
          onChange={(button) => setContent((c) => ({ ...c, mood: { ...c.mood, button } }))}
        />
      </SectionCard>

      {/* 3. Story */}
      <SectionCard
        id="story"
        title="Story / description"
        layout="Centered long-form text + feature pills"
        priority="High"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Eyebrow">
            <Input
              value={content.story.eyebrow}
              onChange={(e) =>
                setContent((c) => ({ ...c, story: { ...c.story, eyebrow: e.target.value } }))
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={content.story.title}
              onChange={(e) =>
                setContent((c) => ({ ...c, story: { ...c.story, title: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Intro">
          <Textarea
            rows={2}
            value={content.story.intro}
            onChange={(e) =>
              setContent((c) => ({ ...c, story: { ...c.story, intro: e.target.value } }))
            }
          />
        </Field>

        <StringListEditor
          title="Body paragraphs"
          addLabel="Add paragraph"
          multiline
          values={content.story.paragraphs}
          onChange={(paragraphs) =>
            setContent((c) => ({ ...c, story: { ...c.story, paragraphs } }))
          }
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Feature pills</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  story: {
                    ...c.story,
                    features: [...c.story.features, { id: uid(), label: "New feature" }],
                  },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add feature
            </Button>
          </div>
          {content.story.features.map((feature, index) => (
            <div
              key={feature.id}
              className="rounded-xl border border-border bg-background/60 p-3 flex flex-wrap items-end gap-3"
            >
              <Field label="Label" className="flex-1 min-w-[180px]">
                <Input
                  value={feature.label}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      story: {
                        ...c.story,
                        features: c.story.features.map((f) =>
                          f.id === feature.id ? { ...f, label: e.target.value } : f,
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
                    story: {
                      ...c.story,
                      features: moveItem(c.story.features, index, -1),
                    },
                  }))
                }
                onDown={() =>
                  setContent((c) => ({
                    ...c,
                    story: {
                      ...c.story,
                      features: moveItem(c.story.features, index, 1),
                    },
                  }))
                }
                onRemove={() =>
                  setContent((c) => ({
                    ...c,
                    story: {
                      ...c.story,
                      features: c.story.features.filter((f) => f.id !== feature.id),
                    },
                  }))
                }
                disableUp={index === 0}
                disableDown={index === content.story.features.length - 1}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </EditorShell>
  );
}
