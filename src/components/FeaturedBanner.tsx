import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPriceNgn } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/api';
import {
  isPromotionsCacheStale,
  readPromotionsCache,
  writePromotionsCache,
  PROMOTIONS_STALE_MS,
} from '@/lib/listingCache';

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

async function fetchActivePromotions(): Promise<Promotion[]> {
  const response = await fetch(`${getApiBaseUrl()}/promotions/active`);
  if (!response.ok) return [];
  const data = (await response.json()) as Promotion[];
  writePromotionsCache(data);
  return data;
}

export const FeaturedBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const cached = readPromotionsCache();
  const hasCachedPromotions = Boolean(cached?.data?.length);

  const { data: promotions } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: fetchActivePromotions,
    initialData: hasCachedPromotions ? (cached!.data as Promotion[]) : undefined,
    staleTime: PROMOTIONS_STALE_MS,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: !hasCachedPromotions,
    refetchInterval: hasCachedPromotions ? false : PROMOTIONS_STALE_MS,
  });

  useEffect(() => {
    if (!hasCachedPromotions || !isPromotionsCacheStale()) return;
    void fetchActivePromotions();
  }, [hasCachedPromotions]);

  useEffect(() => {
    if (!promotions || promotions.length === 0 || !autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promotions, autoPlay]);

  const handleBannerClick = async (promotion: Promotion) => {
    try {
      await fetch(`${getApiBaseUrl()}/promotions/${promotion.id}/click`, {
        method: 'POST',
      });
    } catch {
      // non-blocking analytics
    }

    if (promotion.house?.agent?.phone) {
      const phone = promotion.house.agent.phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(
        `Hello! I'm interested in this property: ${promotion.house.title} - ${promotion.house.location}`,
      );
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      window.location.href = `/house/${promotion.houseId}`;
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
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

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const currentPromotion = promotions[currentIndex];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg group">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
        style={{
          backgroundImage: `url(${currentPromotion.bannerImage})`,
          transform: `scale(${autoPlay ? '1.05' : '1'})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

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
              {formatPriceNgn(currentPromotion.house.price)}
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

      {promotions.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75',
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
