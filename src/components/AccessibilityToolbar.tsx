// Toolbar Accessibilità - Cambio tema, dimensione testo, riduzione movimento
// Fissa in basso a destra, pannello espandibile

'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon,
  Eye,
  Type,
  Accessibility,
  X,
  Minus,
  Plus,
  Wind,
} from 'lucide-react';

export default function AccessibilityToolbar() {
  const {
    tema: temaCorrente,
    impostaTema,
    dimensioneTesto,
    impostaDimensioneTesto,
    riduzioneAnimazioni: riduzioneMovimento,
    impostaRiduzioneAnimazioni: impostaRiduzioneMovimento,
  } = useStore();

  const [aperto, setAperto] = useState(false);

  // Applica il tema al documento
  useEffect(() => {
    const root = document.documentElement;
    // Rimuovi tutte le classi tema
    root.classList.remove('dark', 'alto-contrasto');

    if (temaCorrente === 'scuro') {
      root.classList.add('dark');
    } else if (temaCorrente === 'alto-contrasto') {
      root.classList.add('alto-contrasto');
    }

    // Salva in localStorage
    localStorage.setItem('naro4z-tema', temaCorrente);
  }, [temaCorrente]);

  // Applica dimensione testo
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('testo-normale', 'testo-grande', 'testo-molto-grande');

    if (dimensioneTesto === 'grande') {
      root.classList.add('testo-grande');
    } else if (dimensioneTesto === 'molto-grande') {
      root.classList.add('testo-molto-grande');
    } else {
      root.classList.add('testo-normale');
    }

    localStorage.setItem('naro4z-dim-testo', dimensioneTesto);
  }, [dimensioneTesto]);

  // Applica riduzione movimento
  useEffect(() => {
    const root = document.documentElement;
    if (riduzioneMovimento) {
      root.classList.add('riduzione-movimento');
    } else {
      root.classList.remove('riduzione-movimento');
    }
    localStorage.setItem('naro4z-riduzione-mov', String(riduzioneMovimento));
  }, [riduzioneMovimento]);

  // Carica preferenze da localStorage al mount
  useEffect(() => {
    const tema = localStorage.getItem('naro4z-tema') as 'chiaro' | 'scuro' | 'alto-contrasto' | null;
    const dimTesto = localStorage.getItem('naro4z-dim-testo') as 'normale' | 'grande' | 'molto-grande' | null;
    const ridMov = localStorage.getItem('naro4z-riduzione-mov');

    if (tema) impostaTema(tema);
    if (dimTesto) impostaDimensioneTesto(dimTesto);
    if (ridMov !== null) impostaRiduzioneMovimento(ridMov === 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const temi = [
    { id: 'chiaro' as const, icona: Sun, etichetta: 'Chiaro' },
    { id: 'scuro' as const, icona: Moon, etichetta: 'Scuro' },
    { id: 'alto-contrasto' as const, icona: Eye, etichetta: 'Alto Contrasto' },
  ];

  const dimensioni = [
    { id: 'normale' as const, etichetta: 'A' },
    { id: 'grande' as const, etichetta: 'A+' },
    { id: 'molto-grande' as const, etichetta: 'A++' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {/* Pannello espandibile */}
      {aperto && (
        <div className="mb-2 w-64 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-amber-200/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
              <Accessibility className="h-4 w-4" />
              Accessibilità
            </h3>
            <button
              onClick={() => setAperto(false)}
              className="text-amber-400 hover:text-amber-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-amber-600">Tema</span>
            <div className="grid grid-cols-3 gap-1.5">
              {temi.map((t) => {
                const IconaT = t.icona;
                return (
                  <button
                    key={t.id}
                    onClick={() => impostaTema(t.id)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all ${
                      temaCorrente === t.id
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                        : 'bg-amber-50/50 text-amber-600 border border-amber-100 hover:bg-amber-100'
                    }`}
                  >
                    <IconaT className="h-4 w-4" />
                    {t.etichetta}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimensione testo */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              <Type className="h-3 w-3" />
              Dimensione Testo
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {dimensioni.map((d) => (
                <button
                  key={d.id}
                  onClick={() => impostaDimensioneTesto(d.id)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                    dimensioneTesto === d.id
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                      : 'bg-amber-50/50 text-amber-600 border border-amber-100 hover:bg-amber-100'
                  }`}
                >
                  {d.etichetta}
                </button>
              ))}
            </div>
          </div>

          {/* Riduzione movimento */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
              <Wind className="h-3 w-3" />
              Riduzione Movimento
            </span>
            <button
              onClick={() => impostaRiduzioneMovimento(!riduzioneMovimento)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                riduzioneMovimento ? 'bg-amber-500' : 'bg-amber-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  riduzioneMovimento ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Pulsante floating */}
      <Button
        onClick={() => setAperto(!aperto)}
        className={`h-11 w-11 rounded-full shadow-lg transition-all duration-300 ${
          aperto
            ? 'bg-amber-700 hover:bg-amber-800 text-white rotate-45'
            : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-110'
        }`}
        size="icon"
      >
        {aperto ? <Plus className="h-5 w-5" /> : <Accessibility className="h-5 w-5" />}
      </Button>
    </div>
  );
}
