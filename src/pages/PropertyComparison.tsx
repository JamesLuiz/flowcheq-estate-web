import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);

const PropertyComparison = () => {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids')?.split(',').map((id) => id.trim()) ?? [];
  const idsSet = useMemo(() => new Set(ids), [ids]);

  const housesQuery = useQuery({
    queryKey: ['comparison-houses'],
    queryFn: () => api.houses.list(),
  });

  const comparedHouses = useMemo(
    () => (housesQuery.data?.data ?? []).filter((house) => idsSet.has(house.id)),
    [housesQuery.data, idsSet],
  );

  if (housesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (comparedHouses.length < 2) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Select at least 2 properties to compare</h1>
          <Link to="/user-dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/user-dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Property Comparison</h1>
          <p className="text-muted-foreground">Compare properties side by side</p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-6 pb-4 min-w-full">
            {comparedHouses.map((house) => (
              <Card key={house.id} className="flex-1 min-w-[300px] md:min-w-[350px]">
                <div className="relative aspect-video">
                  <img
                    src={house.images?.[0] ?? '/placeholder.svg'}
                    alt={house.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  {house.featured && (
                    <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                      Featured
                    </Badge>
                  )}
                </div>

                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2">{house.title}</h3>
                    <div className="flex items-center text-muted-foreground text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{house.location}</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatPrice(house.price)}</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="secondary" className="capitalize">
                        {house.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bedrooms</span>
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span className="font-medium">{house.bedrooms ?? '-'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bathrooms</span>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span className="font-medium">{house.bathrooms ?? '-'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Area</span>
                      <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4" />
                        <span className="font-medium">
                          {house.area ? `${house.area}m²` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price per m²</span>
                      <span className="font-medium">
                        {house.area ? formatPrice(Math.round(house.price / house.area)) : '—'}
                      </span>
                    </div>
                  </div>

                  <Link to={`/house/${house.id}`} className="block">
                    <Button className="w-full" size="lg">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyComparison;
