import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Pause, 
  RotateCcw, Camera, Grid3X3, X, Move3D
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface VirtualTourProps {
  images: string[];
  propertyTitle: string;
}

export const VirtualTour = ({ images, propertyTitle }: VirtualTourProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAutoPlay && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlay, currentIndex, images.length]);

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrev = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToImage = (index: number) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape' && isFullscreen) document.exitFullscreen();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!images || images.length === 0) {
    return null;
  }

  const TourContent = ({ inDialog = false }: { inDialog?: boolean }) => (
    <div
      ref={!inDialog ? containerRef : undefined}
      className={cn(
        'relative bg-black rounded-xl overflow-hidden group',
        inDialog ? 'h-full' : 'aspect-[16/10]'
      )}
    >
      {/* Main Image */}
      <div
        className={cn(
          'relative w-full h-full cursor-crosshair transition-all duration-300',
          isTransitioning && 'opacity-0 scale-105'
        )}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={images[currentIndex]}
          alt={`${propertyTitle} - View ${currentIndex + 1}`}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            isZoomed && 'scale-150'
          )}
          style={isZoomed ? {
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
          } : undefined}
          draggable={false}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-none text-white">
          <Camera className="h-3 w-3 mr-1" />
          {currentIndex + 1} / {images.length}
        </Badge>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
            onClick={() => setShowThumbnails(!showThumbnails)}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          {!inDialog && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Close Button for Dialog */}
      {inDialog && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-20 h-10 w-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full"
          onClick={() => {
            // Find and close the parent dialog
            const closeButton = document.querySelector('[data-radix-collection-item]')?.closest('[role="dialog"]')?.querySelector('[aria-label="Close"]') as HTMLButtonElement;
            closeButton?.click();
          }}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Playback Controls */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
            >
              {isAutoPlay ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Auto Tour
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
              onClick={() => setCurrentIndex(0)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restart
            </Button>
          </div>
        )}

        {/* Thumbnail Strip */}
        {showThumbnails && images.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-200',
                  currentIndex === index
                    ? 'ring-2 ring-white scale-110 z-10'
                    : 'opacity-60 hover:opacity-100'
                )}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {images.length > 1 && (
          <div className="flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'flex-1 h-1 rounded-full transition-all duration-300',
                  currentIndex === index
                    ? 'bg-white'
                    : 'bg-white/30 hover:bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zoom Indicator */}
      {isZoomed && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
            <Move3D className="h-4 w-4" />
            Move to pan
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Inline Tour */}
      <TourContent />

      {/* Fullscreen Dialog Option */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Maximize2 className="mr-2 h-4 w-4" />
            Open Immersive Virtual Tour
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="absolute top-4 left-4 z-20">
            <DialogTitle className="text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              {propertyTitle} - Virtual Tour
            </DialogTitle>
          </DialogHeader>
          <TourContent inDialog />
          {/* Explicit Close Button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 z-20"
            onClick={() => {
              const closeBtn = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
              closeBtn?.click();
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Close Tour
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">←→</kbd> Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd> Auto-tour
        </span>
        <span className="flex items-center gap-1">
          Click to zoom & pan
        </span>
      </div>
    </div>
  );
};
