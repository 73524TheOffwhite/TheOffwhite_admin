import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  ImageField,
  ItemToolbar,
  SectionCard,
  moveItem,
  uid,
} from "@/components/cms/fields";
import { useSharedTestimonials } from "@/data/shared-testimonials";
import type { Testimonial } from "@/data/homepage-content";

export default function SharedTestimonialsSection({
  priority = "Low",
  note,
}: {
  priority?: "High" | "Medium" | "Low";
  note?: string;
}) {
  const { testimonials, setTestimonials } = useSharedTestimonials();

  return (
    <SectionCard
      id="testimonials"
      title="Testimonials"
      layout="Shared with Homepage — edits update both pages"
      priority={priority}
    >
      {note ? <p className="text-xs text-muted-foreground -mt-2">{note}</p> : null}
      <Field label="Eyebrow">
        <Input
          value={testimonials.eyebrow}
          onChange={(e) => setTestimonials({ ...testimonials, eyebrow: e.target.value })}
        />
      </Field>
      <Field label="Rating line">
        <Input
          value={testimonials.ratingLine}
          onChange={(e) => setTestimonials({ ...testimonials, ratingLine: e.target.value })}
        />
      </Field>
      <ImageField
        label="Decor image"
        value={testimonials.decorImage}
        onChange={(decorImage) => setTestimonials({ ...testimonials, decorImage })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Button label">
          <Input
            value={testimonials.buttonLabel}
            onChange={(e) => setTestimonials({ ...testimonials, buttonLabel: e.target.value })}
          />
        </Field>
        <Field label="Google URL">
          <Input
            value={testimonials.googleUrl}
            onChange={(e) => setTestimonials({ ...testimonials, googleUrl: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Reviews</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setTestimonials({
                ...testimonials,
                reviews: [
                  ...testimonials.reviews,
                  {
                    id: uid(),
                    quote: "",
                    author: "Guest",
                    meta: "",
                    postedWhen: "Just now",
                    rating: 5,
                    showOnHome: true,
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add review
          </Button>
        </div>
        {testimonials.reviews.map((review, index) => (
          <ReviewEditor
            key={review.id}
            review={review}
            index={index}
            total={testimonials.reviews.length}
            onChange={(next) =>
              setTestimonials({
                ...testimonials,
                reviews: testimonials.reviews.map((r) => (r.id === review.id ? next : r)),
              })
            }
            onMove={(dir) =>
              setTestimonials({
                ...testimonials,
                reviews: moveItem(testimonials.reviews, index, dir),
              })
            }
            onRemove={() =>
              setTestimonials({
                ...testimonials,
                reviews: testimonials.reviews.filter((r) => r.id !== review.id),
              })
            }
          />
        ))}
      </div>
    </SectionCard>
  );
}

function ReviewEditor({
  review,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  review: Testimonial;
  index: number;
  total: number;
  onChange: (next: Testimonial) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Review {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <Field label="Quote">
        <Textarea rows={3} value={review.quote} onChange={(e) => onChange({ ...review, quote: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Author">
          <Input value={review.author} onChange={(e) => onChange({ ...review, author: e.target.value })} />
        </Field>
        <Field label="Meta">
          <Input
            value={review.meta}
            onChange={(e) => onChange({ ...review, meta: e.target.value })}
            placeholder="Dinner · Anniversary"
          />
        </Field>
        <Field label="Posted when">
          <Input value={review.postedWhen} onChange={(e) => onChange({ ...review, postedWhen: e.target.value })} />
        </Field>
        <Field label="Rating (1–5)">
          <Input
            type="number"
            min={1}
            max={5}
            value={review.rating}
            onChange={(e) =>
              onChange({ ...review, rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })
            }
          />
        </Field>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Show on homepage</p>
          <p className="text-xs text-muted-foreground">Also controls About visibility</p>
        </div>
        <Switch
          checked={review.showOnHome}
          onCheckedChange={(showOnHome) => onChange({ ...review, showOnHome })}
        />
      </div>
    </div>
  );
}
