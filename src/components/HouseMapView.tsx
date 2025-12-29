import { Map } from './Map';
import { House } from '@/types';
import { Card, CardContent } from './ui/card';

interface HouseMapViewProps {
  house: House;
  className?: string;
}

export const HouseMapView = ({ house, className }: HouseMapViewProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Use house coordinates or default to Abuja, Nigeria
  const latitude = house.coordinates?.lat ?? 9.0765;
  const longitude = house.coordinates?.lng ?? 7.3986;

  const marker = {
    lat: latitude,
    lng: longitude,
    label: `${house.title} - ${formatPrice(house.price)}`,
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="space-y-4 p-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">{house.title}</h3>
            <p className="text-sm text-muted-foreground">{house.location}</p>
            <p className="text-lg font-bold text-primary mt-2">
              {formatPrice(house.price)}
            </p>
          </div>
        </div>
        <Map
          latitude={latitude}
          longitude={longitude}
          zoom={14}
          markers={[marker]}
          className="h-[300px] md:h-[400px]"
        />
      </CardContent>
    </Card>
  );
};

