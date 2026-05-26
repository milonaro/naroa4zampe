'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { ChevronLeft, ChevronRight, PawPrint, FileText, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Vista } from '@/lib/store';
import { getSubtitleSlider } from '@/lib/tenant';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaVista: Vista;
  emoji: string;
  icon: React.ElementType;
  image: string;
  overlay: string;
}

// ─── Static slide parts (no config dependency) ────────────────────────────

const staticSlides = [
  {
    id: 1,
    ctaLabel: 'Invia Segnalazione',
    ctaVista: 'segnala' as Vista,
    emoji: '🐕',
    icon: FileText,
    image: '/images/slide-1.jpg',
    overlay: 'from-yellow-900/70 via-yellow-800/50 to-yellow-900/60',
  },
  {
    id: 2,
    title: 'La Tua Voce Conta',
    subtitle: 'Ogni segnalazione aiuta a proteggere cittadini e animali',
    ctaLabel: 'Scopri Come',
    ctaVista: 'mappa' as Vista,
    emoji: '🐾',
    icon: MapPin,
    image: '/images/slide-2.jpg',
    overlay: 'from-yellow-900/70 via-amber-900/50 to-yellow-900/60',
  },
  {
    id: 3,
    title: 'Insieme per gli Animali',
    subtitle: "Accedi alla tua area personale per gestire le segnalazioni",
    ctaLabel: 'Area Personale',
    ctaVista: 'area-personale' as Vista,
    emoji: '🐾',
    icon: User,
    image: '/images/slide-3.jpg',
    overlay: 'from-amber-900/70 via-yellow-900/50 to-amber-900/60',
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
  const { impostaVista, configComune } = useStore();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Build slides with dynamic comune config ────────────────────────────
  const slides: SlideData[] = staticSlides.map((s, i) => {
    if (i === 0) {
      return {
        ...s,
        title: configComune.nomeApp,
        subtitle: getSubtitleSlider(configComune),
      } as SlideData;
    }
    return s as SlideData;
  });

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

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer, current]);

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

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

  const slide = slides[current];
  const CtaIcon = slide.icon;

  return (
    <section
      className="relative w-screen -ml-[calc((100vw-100%)/2)] h-[60vh] md:h-[75vh] lg:h-[85vh] overflow-hidden select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-roledescription="carousel"
      aria-label="Banner principale"
    >
      {/* ── Slides con immagini reali ────────────────────────────────────── */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
          className="absolute inset-0"
        >
          {/* Immagine di sfondo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Overlay gradiente scuro per leggibilità testo */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`} />

          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span
              className="absolute -top-6 -right-4 text-[10rem] md:text-[14rem] leading-none opacity-[0.07] select-none"
              aria-hidden="true"
            >
              {slide.emoji}
            </span>
            <PawPrint className="absolute bottom-8 left-8 h-16 w-16 md:h-20 md:w-20 opacity-[0.06]" />
            <PawPrint
              className="absolute top-14 right-[35%] h-8 w-8 md:h-10 md:w-10 opacity-[0.04]"
              style={{ animationDelay: '1.2s' }}
            />
            <PawPrint
              className="absolute bottom-14 right-16 h-10 w-10 md:h-14 md:w-14 opacity-[0.05]"
              style={{ animationDelay: '2.5s' }}
            />
          </div>

          {/* ── Content ─────────────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-16 lg:px-24 max-w-3xl">
            <h2 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
              {slide.title}
            </h2>
            <p className="mt-3 md:mt-4 text-base md:text-xl lg:text-2xl text-white/90 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)] max-w-xl">
              {slide.subtitle}
            </p>
            <div className="mt-5 md:mt-8">
              <button
                type="button"
                onClick={() => impostaVista(slide.ctaVista)}
                className="cursor-pointer inline-flex items-center gap-2 bg-white text-yellow-700 font-semibold text-sm md:text-base px-5 py-2.5 md:px-6 md:py-3 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-700"
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
        className="cursor-pointer absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Slide precedente"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="cursor-pointer absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
                cursor-pointer rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                ${
                  isActive
                    ? 'h-3 w-6 md:h-3.5 md:w-7 bg-yellow-300 shadow-sm shadow-yellow-400/40'
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
