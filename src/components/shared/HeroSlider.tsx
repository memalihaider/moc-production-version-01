'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HeroSlide } from '@/stores/cms.store';
import { cn } from '@/lib/utils';

interface HeroSliderProps {
  slides: HeroSlide[];
  children: React.ReactNode; // Hero content overlay
}

export function HeroSlider({ slides, children }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const totalSlides = slides.length;

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      setIsTransitioning(false);
    }, 600);
  }, [totalSlides]);

  // Auto-advance
  useEffect(() => {
    if (totalSlides <= 1) return;
    timerRef.current = setInterval(goToNext, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goToNext, totalSlides]);

  // Play/pause videos based on active slide
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      if (slides[currentIndex]?.id === id) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex, slides]);

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 600);
    timerRef.current = setInterval(goToNext, 6000);
  };

  // Fallback for no slides
  if (totalSlides === 0) {
    return (
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden mt-[3.5rem]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-zoom"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/70 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden mt-[3.5rem]">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-in-out',
            index === currentIndex && !isTransitioning ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
          )}
        >
          {slide.type === 'video' ? (
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(slide.id, el);
              }}
              src={slide.url}
              className="absolute inset-0 w-full h-full object-cover scale-105"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-zoom"
              style={{ backgroundImage: `url('${slide.url}')` }}
            />
          )}
          {/* Overlays */}
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/70 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Dots indicator */}
      {totalSlides > 1 && (
        <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                'transition-all duration-300 rounded-full',
                index === currentIndex
                  ? 'w-8 h-2 bg-secondary'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-20">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
          <div className="w-1 h-2 bg-secondary rounded-full" />
        </div>
      </div>
    </section>
  );
}
