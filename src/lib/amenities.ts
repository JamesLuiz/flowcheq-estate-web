/** Normalized amenity slugs — must match backend `House.amenities` */
export const PROPERTY_AMENITIES = [
  { slug: 'electricity', label: 'Electricity / PHCN', icon: '⚡' },
  { slug: 'shared_transformer', label: 'Shared transformer', icon: '🔌' },
  { slug: 'prepaid_meter', label: 'Prepaid meter', icon: '📟' },
  { slug: 'water', label: 'Running water', icon: '💧' },
  { slug: 'borehole', label: 'Borehole', icon: '🪣' },
  { slug: 'generator', label: 'Generator', icon: '🔋' },
  { slug: 'inverter', label: 'Inverter / solar', icon: '☀️' },
  { slug: 'parking', label: 'Parking', icon: '🅿️' },
  { slug: 'security', label: 'Security / gate', icon: '🛡️' },
  { slug: 'cctv', label: 'CCTV', icon: '📹' },
  { slug: 'wifi', label: 'Wi‑Fi / internet', icon: '📶' },
  { slug: 'furnished', label: 'Furnished', icon: '🛋️' },
  { slug: 'air_conditioning', label: 'Air conditioning', icon: '❄️' },
  { slug: 'pool', label: 'Swimming pool', icon: '🏊' },
  { slug: 'gym', label: 'Gym', icon: '🏋️' },
  { slug: 'elevator', label: 'Elevator', icon: '🛗' },
  { slug: 'serviced', label: 'Serviced / estate', icon: '🏘️' },
  { slug: 'tarred_road', label: 'Tarred road access', icon: '🛣️' },
] as const;

export type AmenitySlug = (typeof PROPERTY_AMENITIES)[number]['slug'];

export function amenityLabel(slug: string): string {
  return PROPERTY_AMENITIES.find((a) => a.slug === slug)?.label ?? slug.replace(/_/g, ' ');
}
