import { House } from '@/types';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bed, Bath, Maximize, MapPin, Heart, Eye, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { VerificationBadge } from '@/components/VerificationBadge';
import { api } from '@/lib/api';

interface HouseCardProps {
  house: House;
}

export const HouseCard = ({ house }: HouseCardProps) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isAuthenticated, user } = useAuth();
  const isHouseFavorite = isFavorite(house.id);
  
  // Only users (not agents/landlords) can favorite properties
  const canFavorite = isAuthenticated && user?.role === 'user';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const phone = house.agent?.phone?.replace(/\s/g, '') || '';
    if (!phone) return;
    
    // Build comprehensive message with property details
    const propertyUrl = `${window.location.origin}/house/${house.id}`;
    const imageLinks = house.images?.slice(0, 3).map(img => img).join('\n') || '';
    
    let message = `🏠 *Property Inquiry*\n\n`;
    message += `*${house.title}*\n\n`;
    message += `📍 Location: ${house.location}\n`;
    message += `💰 Price: ${formatPrice(house.price)}\n`;
    if (house.bedrooms) message += `🛏️ Bedrooms: ${house.bedrooms}\n`;
    if (house.bathrooms) message += `🚿 Bathrooms: ${house.bathrooms}\n`;
    if (house.area) message += `📐 Area: ${house.area}m²\n`;
    message += `\n${house.description?.substring(0, 200)}${house.description && house.description.length > 200 ? '...' : ''}\n\n`;
    if (imageLinks) {
      message += `📸 View Images:\n${imageLinks}\n\n`;
    }
    message += `🔗 View Full Details: ${propertyUrl}\n\n`;
    message += `Hi, I'm interested in this property. Please provide more information.`;
    
    const encodedMessage = encodeURIComponent(message);
    
    // Track WhatsApp click
    if (house.id) {
      api.houses.trackWhatsAppClick(house.id).catch(console.error);
    }
    
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (house.coordinates?.lat && house.coordinates?.lng) {
      navigate(`/search-map?houseId=${house.id}&lat=${house.coordinates.lat}&lng=${house.coordinates.lng}`);
    } else {
      navigate(`/search-map?houseId=${house.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(house.id);
  };

  const imageSrc = house.images?.[0] ?? '/placeholder.svg';

  return (
    <Link to={`/house/${house.id}`} className="block h-full">
      <Card className="group overflow-hidden hover:shadow-hover transition-all duration-300 h-full hover:scale-[1.02] active:scale-[0.98]">
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={imageSrc}
            alt={house.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-smooth"
          />
          {canFavorite && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg z-10"
            >
              <Heart
                className={`h-5 w-5 transition-all duration-300 ${
                  isHouseFavorite ? 'fill-primary text-primary scale-110' : 'text-foreground'
                }`}
              />
            </button>
          )}
          {house.featured && (
            <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
          <Badge className="absolute bottom-4 left-4 bg-background/90 text-foreground capitalize">
            {house.type}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {house.title}
            </h3>
            <button
              onClick={handleLocationClick}
              className="flex items-center text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer group"
            >
              <MapPin className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-1">{house.location}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{house.bedrooms ?? '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{house.bathrooms ?? '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{house.area ? `${house.area}m²` : '-'}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
          <div className="w-full flex items-center justify-between">
            <p className="text-2xl font-bold text-primary">{formatPrice(house.price)}</p>
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              {house.viewCount || 0}
            </Badge>
          </div>
          
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {house.agent?.name || 'Agent'}
              </p>
              <VerificationBadge verified={house.agent?.verified} size="sm" />
            </div>
            {house.agent && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/agents/${house.agentId}/catalogue`);
                }}
              >
                <Home className="h-3 w-3 mr-1" />
                View All
              </Button>
            )}
          </div>

          {isAuthenticated && (
            <Button
              onClick={handleWhatsAppClick}
              size="sm"
              disabled={!house.agent?.phone}
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {house.agent?.role === 'landlord' ? 'WhatsApp Landlord' : 'WhatsApp Agent'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
