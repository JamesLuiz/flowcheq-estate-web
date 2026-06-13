import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { FilterParams } from '@/types';
import { PROPERTY_AMENITIES } from '@/lib/amenities';
import { Checkbox } from './ui/checkbox';

interface SearchFiltersProps {
  onFilterChange: (filters: FilterParams) => void;
}

export const SearchFilters = ({ onFilterChange }: SearchFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  const handleFilterChange = (
    key: keyof FilterParams,
    value: string | number | string[] | undefined,
  ) => {
    if (Array.isArray(value)) {
      const nextFilters: FilterParams = { ...filters };
      if (value.length === 0) delete nextFilters[key];
      else nextFilters[key] = value as never;
      setFilters(nextFilters);
      onFilterChange(nextFilters);
      return;
    }

    let normalized: string | number | boolean | undefined = value;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      normalized = trimmed === '' ? undefined : trimmed;
    }

    if (typeof value === 'number') {
      normalized = Number.isNaN(value) ? undefined : value;
    }

    if (typeof value === 'boolean') {
      normalized = value;
    }

    const nextFilters: FilterParams = { ...filters };

    if (normalized === undefined) {
      delete nextFilters[key];
    } else {
      nextFilters[key] = normalized as never;
    }

    setFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const handleNumberChange = (
    key: keyof FilterParams,
    inputValue: string,
  ) => {
    if (inputValue === '') {
      handleFilterChange(key, undefined);
      return;
    }

    handleFilterChange(key, Number(inputValue));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by title or location..."
            className="pl-10"
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters((prev) => !prev)}
          className="sm:w-auto w-full"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Property Type</label>
            <Select onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
                <SelectItem value="self-con">Self-Con</SelectItem>
                <SelectItem value="bungalow">Bungalow</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="mansion">Mansion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Min Price (₦)</label>
            <Input
              type="number"
              placeholder="0"
              onChange={(e) => handleNumberChange('minPrice', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Price (₦)</label>
            <Input
              type="number"
              placeholder="Any"
              onChange={(e) => handleNumberChange('maxPrice', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="e.g., Lekki, Ikeja"
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Listing Type</label>
            <Select onValueChange={(value) => handleFilterChange('listingType', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All listings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All listings</SelectItem>
                <SelectItem value="buy">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-4">
            <label className="text-sm font-medium">Amenities & utilities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {PROPERTY_AMENITIES.slice(0, 12).map((amenity) => {
                const selected = filters.amenities ?? [];
                const checked = selected.includes(amenity.slug);
                return (
                  <label
                    key={amenity.slug}
                    className="flex items-center gap-2 text-sm rounded-md border bg-background px-2 py-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        const next = checked
                          ? selected.filter((a) => a !== amenity.slug)
                          : [...selected, amenity.slug];
                        handleFilterChange('amenities', next.length ? next : undefined);
                      }}
                    />
                    <span className="truncate">{amenity.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
