import { Dispatch, SetStateAction, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { NIGERIAN_STATES } from '@/data/nigerianStates';
import type { LandlordListingFormState } from './landlordListingFormState';

type LandlordListingFormFieldsProps = {
  idPrefix?: string;
  formState: LandlordListingFormState;
  setFormState: Dispatch<SetStateAction<LandlordListingFormState>>;
  mode: 'create' | 'edit';
};

export function LandlordListingFormFields({
  idPrefix = '',
  formState,
  setFormState,
  mode,
}: LandlordListingFormFieldsProps) {
  const [stateOpen, setStateOpen] = useState(false);
  const p = (name: string) => `${idPrefix}${name}`;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={p('title')}>Property Title</Label>
        <Input
          id={p('title')}
          placeholder="e.g., Modern 4-Bedroom Duplex"
          value={formState.title}
          onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('description')}>Description</Label>
        <RichTextEditor
          value={formState.description}
          onChange={(value) => setFormState((prev) => ({ ...prev, description: value }))}
          placeholder="Describe your property with rich formatting (bold, italic, lists, etc.)..."
        />
        <p className="text-xs text-muted-foreground">
          Use the toolbar to format your description with bold, italic, bullet points, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('price')}>Price (₦)</Label>
          <Input
            id={p('price')}
            type="number"
            placeholder="45000000"
            value={formState.price}
            onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('type')}>Property Type</Label>
          <Select
            value={formState.type}
            onValueChange={(value) => setFormState((prev) => ({ ...prev, type: value }))}
            required
          >
            <SelectTrigger id={p('type')}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="duplex">Duplex</SelectItem>
              <SelectItem value="self-con">Self-Con</SelectItem>
              <SelectItem value="bungalow">Bungalow</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="mansion">Mansion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('listingType')}>Listing Type</Label>
          <Select
            value={formState.listingType}
            onValueChange={(value: 'rent' | 'buy') =>
              setFormState((prev) => ({ ...prev, listingType: value }))
            }
            required
          >
            <SelectTrigger id={p('listingType')}>
              <SelectValue placeholder="Select listing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={p('streetAddress')}>Street Address</Label>
          <Input
            id={p('streetAddress')}
            placeholder="e.g., 123 Main Street"
            value={formState.streetAddress}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, streetAddress: event.target.value }))
            }
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={p('city')}>City</Label>
            <Input
              id={p('city')}
              placeholder="e.g., Wuse 2, Garki"
              value={formState.city}
              onChange={(event) => setFormState((prev) => ({ ...prev, city: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={p('state')}>State</Label>
            <Popover open={stateOpen} onOpenChange={setStateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stateOpen}
                  className="w-full justify-between"
                >
                  {formState.state || 'Select state...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search state..." />
                  <CommandList>
                    <CommandEmpty>No state found.</CommandEmpty>
                    <CommandGroup>
                      {NIGERIAN_STATES.map((state) => (
                        <CommandItem
                          key={state}
                          value={state}
                          onSelect={() => {
                            setFormState((prev) => ({ ...prev, state }));
                            setStateOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formState.state === state ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          {state}
                          {state === 'FCT' && ' (Abuja)'}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('postalCode')}>Postal Code (Optional)</Label>
          <Input
            id={p('postalCode')}
            placeholder="e.g., 900001"
            value={formState.postalCode}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, postalCode: event.target.value }))
            }
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Enter the property address details. Coordinates will be automatically{' '}
          {mode === 'create' ? 'added' : 'updated'} for accurate map navigation.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('bedrooms')}>Bedrooms</Label>
          <Input
            id={p('bedrooms')}
            type="number"
            placeholder="4"
            value={formState.bedrooms}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, bedrooms: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={p('bathrooms')}>Bathrooms</Label>
          <Input
            id={p('bathrooms')}
            type="number"
            placeholder="4"
            value={formState.bathrooms}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, bathrooms: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={p('area')}>Area (m²)</Label>
          <Input
            id={p('area')}
            type="number"
            placeholder="350"
            value={formState.area}
            onChange={(event) => setFormState((prev) => ({ ...prev, area: event.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
        <Label htmlFor={p('viewingFee')}>Inspection Fee (₦)</Label>
        <Input
          id={p('viewingFee')}
          type="number"
          min="0"
          placeholder="e.g., 5000 (leave empty for free viewing)"
          value={formState.viewingFee}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, viewingFee: event.target.value }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Set an inspection fee that users must pay to schedule a property tour. Leave empty for free
          viewings.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={p('featured')}
          type="checkbox"
          checked={formState.featured}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, featured: event.target.checked }))
          }
        />
        <Label htmlFor={p('featured')} className="text-sm">
          Mark as featured property
        </Label>
      </div>

      {mode === 'create' && (
        <>
          <div className="flex items-center gap-2">
            <input
              id={p('isAirbnb')}
              type="checkbox"
              checked={formState.isAirbnb}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, isAirbnb: event.target.checked }))
              }
            />
            <Label htmlFor={p('isAirbnb')} className="text-sm">
              🏨 List as Airbnb/Short-term rental
            </Label>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <input
                id={p('isShared')}
                type="checkbox"
                checked={formState.isShared}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isShared: event.target.checked,
                    totalSlots: event.target.checked ? '2' : '',
                  }))
                }
              />
              <Label htmlFor={p('isShared')} className="text-sm font-medium">
                🤝 Shared Property (2-to-Tango)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Enable this if the property can be rented by multiple tenants in separate slots.
            </p>

            {formState.isShared && (
              <div className="space-y-2">
                <Label htmlFor={p('totalSlots')}>Number of Slots Available</Label>
                <Input
                  id={p('totalSlots')}
                  type="number"
                  min="2"
                  max="10"
                  placeholder="2"
                  value={formState.totalSlots}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, totalSlots: event.target.value }))
                  }
                  required={formState.isShared}
                />
                <p className="text-xs text-muted-foreground">
                  How many tenants can share this property? (2-10)
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
