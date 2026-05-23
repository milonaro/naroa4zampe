'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, PawPrint, FileText, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Vista } from '@/lib/store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaVista: Vista;
  gradient: string;
  emoji: string;
  icon: React.ElementType;
}

// ─── Slide definitions ───────────────────────────────────────────────────────

const slides: SlideData[] = [
  {
    id: 1,
    title: 'Naro a 4 Zampe',
    subtitle: 'Segnala animali randagi nel territorio di Naro',
    ctaLabel: 'Invia Segnalazione',
    ctaVista: 'segnala',
    gradient: 'from-amber-600 via-orange-500 to-amber-700',
    emoji: '🐕',
    icon: FileText,
  },
  {
    id: 2,
    title: 'La Tua Voce Conta',
    subtitle: 'Ogni segnalazione aiuta a proteggere cittadini e animali',
    ctaLabel: 'Scopri Come',
    ctaVista: 'mappa',
    gradient: 'from-orange-600 via-red-500 to-orange-700',
    emoji: '🐾',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'Insieme per gli Animali',
    subtitle: "Accedi alla tua area personale per gestire le segnalazioni",
    ctaLabel: 'Area Personale',
    ctaVista: 'area-personale',
    gradient: 'from-red-600 via-amber-600 to-orange-600',
    emoji: '🐾',
    icon: User,
  },
];

// ─── Animation variants ─────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.3 },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HeroSlider() {
  const { impostaVista } = useStore();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSlides = slides.length;

  // ── Navigate helpers ─────────────────────────────────────────────────────

  const goTo = useCallback(
    (index: number, dir?: number) => {
      setDirection(dir ?? (index > current ? 1 : -1));
      setCurrent(index);
    },
    [current],
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // ── Auto-rotate with pause-on-hover ─────────────────────────────────────

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isPaused) {
      timerRef.current = setTimeout(() => {
        goNext();
      }, 5000);
    }
  }, [isPaused, goNext]);

  // Start / restart timer whenever slide changes or pause state changes
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer, current]);

  // ── Hover handlers ──────────────────────────────────────────────────────

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
    // Timer will restart via the useEffect above
  }, []);

  // ── Manual nav (resets timer) ───────────────────────────────────────────

  const handleDotClick = useCallback(
    (index: number) => {
      goTo(index);
    },
    [goTo],
  );

  const handlePrev = useCallback(() => {
    goPrev();
  }, [goPrev]);

  const handleNext = useCallback(() => {
    goNext();
  }, [goNext]);

  // ── Current slide data ──────────────────────────────────────────────────

  const slide = slides[current];
  const CtaIcon = slide.icon;

  return (
    <section
      className="relative w-full h-[280px] md:h-[370px] overflow-hidden rounded-2xl shadow-xl shadow-amber-500/20 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-roledescription="carousel"
      aria-label="Banner principale"
    >
      {/* ── Slides ──────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large emoji */}
            <span
              className="absolute -top-6 -right-4 text-[10rem] md:text-[14rem] leading-none opacity-[0.07] select-none"
              aria-hidden="true"
            >
              {slide.emoji}
            </span>
            {/* Floating paw prints */}
            <PawPrint className="absolute bottom-8 left-8 h-16 w-16 md:h-20 md:w-20 opacity-[0.06]" />
            <PawPrint
              className="absolute top-14 right-[35%] h-8 w-8 md:h-10 md:w-10 opacity-[0.04]"
              style={{ animationDelay: '1.2s' }}
            />
            <PawPrint
              className="absolute bottom-14 right-16 h-10 w-10 md:h-14 md:w-14 opacity-[0.05]"
              style={{ animationDelay: '2.5s' }}
            />
            {/* Glow blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* ── Content ─────────────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-12 lg:px-16 max-w-3xl">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
              {slide.title}
            </h2>
            <p className="mt-2 md:mt-3 text-sm md:text-lg text-white/90 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)] max-w-xl">
              {slide.subtitle}
            </p>
            <div className="mt-4 md:mt-6">
              <button
                type="button"
                onClick={() => impostaVista(slide.ctaVista)}
                className="inline-flex items-center gap-2 bg-white text-amber-700 font-semibold text-sm md:text-base px-5 py-2.5 md:px-6 md:py-3 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-amber-600"
              >
                <CtaIcon className="h-4 w-4 md:h-5 md:w-5" />
                {slide.ctaLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation arrows ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Slide precedente"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Slide successiva"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* ── Dot indicators ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
        role="tablist"
        aria-label="Seleziona slide"
      >
        {slides.map((s, i) => {
          const isActive = i === current;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Slide ${i + 1} di ${totalSlides}: ${s.title}`}
              onClick={() => handleDotClick(i)}
              className={`
                rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                ${
                  isActive
                    ? 'h-3 w-6 md:h-3.5 md:w-7 bg-amber-300 shadow-sm shadow-amber-400/40'
                    : 'h-2.5 w-2.5 md:h-3 md:w-3 bg-white/40 hover:bg-white/60'
                }
              `}
            />
          );
        })}
      </div>
    </section>
  );
}
