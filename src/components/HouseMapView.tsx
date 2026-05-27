import { Map } from './Map';
import { House } from '@/types';
import { Card, CardContent } from './ui/card';
import { formatPriceNgn } from '@/lib/format';

interface HouseMapViewProps {
  house: House;
  className?: string;
}

export const HouseMapView = ({ house, className }: HouseMapViewProps) => {
  const latitude = house.coordinates?.lat ?? 9.0765;
  const longitude = house.coordinates?.lng ?? 7.3986;

  const marker = {
    lat: latitude,
    lng: longitude,
    label: `${house.title} - ${formatPriceNgn(house.price)}`,
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="space-y-4 p-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">{house.title}</h3>
            <p className="text-sm text-muted-foreground">{house.location}</p>
            <p className="text-lg font-bold text-primary mt-2">
              {formatPriceNgn(house.price)}
            </p>
          </div>
        </div>
        <Map
          latitude={latitude}
          longitude={longitude}
          zoom={16}
          markers={[{ ...marker, variant: 'property' }]}
          defaultMapType="satellite"
          enableDirections
          directionsDestination={{ lat: latitude, lng: longitude }}
          className="h-[300px] md:h-[400px]"
        />
      </CardContent>
    </Card>
  );
};

