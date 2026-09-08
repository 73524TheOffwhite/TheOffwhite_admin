import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  ImageField,
  ItemToolbar,
  LinkFields,
  SectionCard,
  moveItem,
  uid,
} from "@/components/cms/fields";
import { useSharedSignatureDishes } from "@/data/shared-dishes";
import type { DishCard } from "@/data/homepage-content";

export default function SharedDishesSection({
  priority = "Low",
  note,
}: {
  priority?: "High" | "Medium" | "Low";
  note?: string;
}) {
  const { dishes, setDishes } = useSharedSignatureDishes();

  return (
    <SectionCard
      id="dishes"
      title="Signature Dishes"
      layout="Shared with Homepage — edits update both pages"
      priority={priority}
    >
      {note ? <p className="text-xs text-muted-foreground -mt-2">{note}</p> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Eyebrow">
          <Input
            value={dishes.eyebrow}
            onChange={(e) => setDishes({ ...dishes, eyebrow: e.target.value })}
          />
        </Field>
        <Field label="Headline">
          <Input
            value={dishes.headline}
            onChange={(e) => setDishes({ ...dishes, headline: e.target.value })}
          />
        </Field>
      </div>
      <LinkFields
        label="Section button"
        value={dishes.button}
        onChange={(button) => setDishes({ ...dishes, button })}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Dish cards</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setDishes({
                ...dishes,
                cards: [
                  ...dishes.cards,
                  { id: uid(), image: { name: "new-dish.png" }, name: "New dish", notes: "" },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add dish
          </Button>
        </div>
        {dishes.cards.map((card, index) => (
          <DishEditor
            key={card.id}
            card={card}
            index={index}
            total={dishes.cards.length}
            onChange={(next) =>
              setDishes({
                ...dishes,
                cards: dishes.cards.map((d) => (d.id === card.id ? next : d)),
              })
            }
            onMove={(dir) =>
              setDishes({ ...dishes, cards: moveItem(dishes.cards, index, dir) })
            }
            onRemove={() =>
              setDishes({
                ...dishes,
                cards: dishes.cards.filter((d) => d.id !== card.id),
              })
            }
          />
        ))}
      </div>
    </SectionCard>
  );
}

function DishEditor({
  card,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  card: DishCard;
  index: number;
  total: number;
  onChange: (next: DishCard) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Dish {index + 1}</p>
        <ItemToolbar
          onUp={() => onMove(-1)}
          onDown={() => onMove(1)}
          onRemove={onRemove}
          disableUp={index === 0}
          disableDown={index === total - 1}
        />
      </div>
      <ImageField label="Image" value={card.image} onChange={(image) => onChange({ ...card, image })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={card.name} onChange={(e) => onChange({ ...card, name: e.target.value })} />
        </Field>
        <Field label="Notes">
          <Input value={card.notes} onChange={(e) => onChange({ ...card, notes: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}
