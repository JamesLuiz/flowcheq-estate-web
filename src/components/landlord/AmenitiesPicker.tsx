import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PROPERTY_AMENITIES } from '@/lib/amenities';

type AmenitiesPickerProps = {
  value: string[];
  onChange: (amenities: string[]) => void;
  idPrefix?: string;
};

export function AmenitiesPicker({ value, onChange, idPrefix = '' }: AmenitiesPickerProps) {
  const toggle = (slug: string) => {
    if (value.includes(slug)) {
      onChange(value.filter((a) => a !== slug));
    } else {
      onChange([...value, slug]);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div>
        <Label className="text-sm font-medium">Amenities & utilities</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Select what the property includes — tenants can search by these.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROPERTY_AMENITIES.map((amenity) => {
          const id = `${idPrefix}amenity-${amenity.slug}`;
          const checked = value.includes(amenity.slug);
          return (
            <label
              key={amenity.slug}
              htmlFor={id}
              className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 cursor-pointer hover:border-primary/40"
            >
              <Checkbox id={id} checked={checked} onCheckedChange={() => toggle(amenity.slug)} />
              <span className="text-sm">
                <span className="mr-1.5">{amenity.icon}</span>
                {amenity.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
