import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Promotion {
  id: string;
  houseId: string;
  house: {
    id: string;
    title: string;
    price: number;
    location: string;
    images: string[];
    agent?: {
      name: string;
      phone?: string;
    };
  };
  bannerImage: string;
  startDate: string;
  endDate: string;
  days: number;
  amount: number;
  clicks: number;
}

export const FeaturedBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/promotions/active`);
      if (!response.ok) return [];
      return response.json() as Promise<Promotion[]>;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (!promotions || promotions.length === 0 || !autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [promotions, autoPlay]);

  const handleBannerClick = async (promotion: Promotion) => {
    // Track click
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/promotions/${promotion.id}/click`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }

    // Open WhatsApp if agent has phone
    if (promotion.house?.agent?.phone) {
      const phone = promotion.house.agent.phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(
        `Hello! I'm interested in this property: ${promotion.house.title} - ${promotion.house.location}`
      );
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      // Fallback to property page
      window.location.href = `/house/${promotion.houseId}`;
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000); // Resume autoplay after 10 seconds
  };

  const nextSlide = () => {
    if (!promotions) return;
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const prevSlide = () => {
    if (!promotions) return;
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-muted flex items-center justify-center rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const currentPromotion = promotions[currentIndex];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg group">
      {/* Banner Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
        style={{
          backgroundImage: `url(${currentPromotion.bannerImage})`,
          transform: `scale(${autoPlay ? '1.05' : '1'})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 text-white">
        <div className="max-w-2xl">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground rounded-full text-sm font-semibold">
              Featured Property
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 line-clamp-2">
            {currentPromotion.house.title}
          </h2>
          <p className="text-lg md:text-xl mb-4 text-white/90">
            {currentPromotion.house.location}
          </p>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-2xl md:text-3xl font-bold">
              ₦{currentPromotion.house.price.toLocaleString()}
            </span>
          </div>
          <Button
            size="lg"
            onClick={() => handleBannerClick(currentPromotion)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Contact Agent
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {promotions.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Next banner"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {promotions.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

