import { Edit, Loader2, Trash2 } from 'lucide-react';
import { HouseCard } from '@/components/HouseCard';
import { PropertyInspectionActions } from '@/components/landlord/PropertyInspectionActions';
import { PhotoLocationVerificationPanel } from '@/components/verification/PhotoLocationVerificationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { House } from '@/types';

interface LandlordListingsGridProps {
  houses: House[];
  isLoading: boolean;
  gpsVerifyPropertyId: string | null;
  onGpsVerifyPropertyIdChange: (id: string | null) => void;
  onEdit: (house: House) => void;
  onDelete: (houseId: string) => void;
  onListingsUpdated: () => void;
}

export function LandlordListingsGrid({
  houses,
  isLoading,
  gpsVerifyPropertyId,
  onGpsVerifyPropertyIdChange,
  onEdit,
  onDelete,
  onListingsUpdated,
}: LandlordListingsGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Listings</h2>
        <Badge variant="secondary" className="text-sm">
          {houses.length} {houses.length === 1 ? 'property' : 'properties'}
        </Badge>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : houses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-xl text-muted-foreground">No listings yet</p>
            <p className="text-muted-foreground">
              Create your first property listing to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {gpsVerifyPropertyId && (
            <div className="mb-8">
              <PhotoLocationVerificationPanel
                propertyId={gpsVerifyPropertyId}
                title="Verify listing photo location (GPS + Google Maps)"
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => onGpsVerifyPropertyIdChange(null)}
              >
                Close verification
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {houses.map((house) => (
              <div key={house.id} className="relative group flex flex-col">
                <HouseCard house={house} />
                <PropertyInspectionActions house={house} onUpdated={onListingsUpdated} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => onGpsVerifyPropertyIdChange(house.id)}
                >
                  Verify photo GPS
                </Button>
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => onEdit(house)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => onDelete(house.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
