// Componente ToolbarAccessibilita - Strumenti per portatori di handicap
// Permette cambio tema, dimensione testo e riduzione animazioni
// Flottante in basso a sinistra con pulsante di apertura/chiusura

'use client';

import { useStore, type Tema, type DimensioneTesto } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accessibility,
  Sun,
  Moon,
  Contrast,
  Type,
  Minus,
  Plus,
  Sparkles,
  X,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mappa tema → icona e etichetta
const opzioniTema: { valore: Tema; etichetta: string; icona: React.ReactNode; descrizione: string }[] = [
  { valore: 'chiaro', etichetta: 'Chiaro', icona: <Sun className="h-5 w-5" />, descrizione: 'Tema chiaro con sfondo chiaro e testo scuro' },
  { valore: 'scuro', etichetta: 'Scuro', icona: <Moon className="h-5 w-5" />, descrizione: 'Tema scuro con sfondo scuro e testo chiaro, riduce l\'affaticamento visivo' },
  { valore: 'alto-contrasto', etichetta: 'Alto Contrasto', icona: <Contrast className="h-5 w-5" />, descrizione: 'Contrasto elevato per ipovedenti, bordi spessi e colori decisi' },
];

// Dimensioni testo
const opzioniDimensione: { valore: DimensioneTesto; etichetta: string; descrizione: string }[] = [
  { valore: 'normale', etichetta: 'A', descrizione: 'Dimensione testo standard (16px)' },
  { valore: 'grande', etichetta: 'A+', descrizione: 'Testo grande (18px) - adatto per lievi difficolta\' visive' },
  { valore: 'molto-grande', etichetta: 'A++', descrizione: 'Testo molto grande (20px) - per difficolta\' visive moderate' },
  { valore: 'extra-grande', etichetta: 'A+++', descrizione: 'Testo extra grande (24px) - per gravi difficolta\' visive' },
];

export default function ToolbarAccessibilita() {
  const {
    tema,
    dimensioneTesto,
    riduzioneAnimazioni,
    toolbarAccessibilitaAperta,
    impostaTema,
    impostaDimensioneTesto,
    impostaRiduzioneAnimazioni,
    impostaToolbarAccessibilita,
  } = useStore();

  // Reset alle impostazioni predefinite
  const resetImpostazioni = () => {
    impostaTema('chiaro');
    impostaDimensioneTesto('normale');
    impostaRiduzioneAnimazioni(false);
  };

  // Aumenta/diminuisci dimensione testo
  const indiceDim = opzioniDimensione.findIndex(d => d.valore === dimensioneTesto);
  const aumentaTesto = () => {
    if (indiceDim < opzioniDimensione.length - 1) {
      impostaDimensioneTesto(opzioniDimensione[indiceDim + 1].valore);
    }
  };
  const diminuisciTesto = () => {
    if (indiceDim > 0) {
      impostaDimensioneTesto(opzioniDimensione[indiceDim - 1].valore);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col items-start gap-2">
      {/* Pannello accessibilità */}
      <AnimatePresence>
        {toolbarAccessibilitaAperta && (
          <motion.div
            key="toolbar-panel"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-900 high-contrast:bg-white rounded-2xl shadow-2xl border border-sand-200 dark:border-gray-700 high-contrast:border-black p-5 w-80 max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-label="Strumenti di accessibilità"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Accessibility className="h-6 w-6 text-sand-600" />
                <h3 className="text-lg font-bold text-sand-800 dark:text-sand-300 high-contrast:text-black">
                  Accessibilità
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetImpostazioni}
                      className="h-8 w-8 text-sand-500 hover:text-sand-700 hover:bg-sand-50"
                      aria-label="Ripristina impostazioni predefinite"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Ripristina impostazioni</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => impostaToolbarAccessibilita(false)}
                  className="h-8 w-8 text-sand-500 hover:text-sand-700 hover:bg-sand-50"
                  aria-label="Chiudi pannello accessibilità"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sezione Tema */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-sand-700 dark:text-sand-400 high-contrast:text-black mb-2 flex items-center gap-1.5">
                <Sun className="h-4 w-4" />
                Tema
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {opzioniTema.map((opzione) => (
                  <Tooltip key={opzione.valore}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => impostaTema(opzione.valore)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                          tema === opzione.valore
                            ? 'border-sand-500 bg-sand-50 dark:border-sand-400 dark:bg-sand-900/30 high-contrast:border-black high-contrast:bg-sand-100 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 high-contrast:border-gray-400 bg-white dark:bg-gray-800 high-contrast:bg-white hover:border-sand-300 dark:hover:border-sand-600'
                        }`}
                        aria-pressed={tema === opzione.valore}
                        aria-label={opzione.etichetta}
                      >
                        <span className={`${
                          tema === opzione.valore
                            ? 'text-sand-700 dark:text-sand-300 high-contrast:text-black'
                            : 'text-gray-500 dark:text-gray-400 high-contrast:text-gray-700'
                        }`}>
                          {opzione.icona}
                        </span>
                        <span className={`text-xs font-semibold ${
                          tema === opzione.valore
                            ? 'text-sand-700 dark:text-sand-300 high-contrast:text-black'
                            : 'text-gray-500 dark:text-gray-400 high-contrast:text-gray-700'
                        }`}>
                          {opzione.etichetta}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p>{opzione.descrizione}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Sezione Dimensione Testo */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-sand-700 dark:text-sand-400 high-contrast:text-black mb-2 flex items-center gap-1.5">
                <Type className="h-4 w-4" />
                Dimensione Testo
              </h4>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={diminuisciTesto}
                      disabled={indiceDim === 0}
                      className="h-10 w-10 border-sand-300 dark:border-sand-600 high-contrast:border-black"
                      aria-label="Diminuisci dimensione testo"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Diminuisci testo</TooltipContent>
                </Tooltip>

                <div className="flex-1 flex flex-col items-center">
                  <span className={`font-bold ${
                    dimensioneTesto === 'extra-grande' ? 'text-2xl' :
                    dimensioneTesto === 'molto-grande' ? 'text-xl' :
                    dimensioneTesto === 'grande' ? 'text-lg' : 'text-base'
                  } text-sand-700 dark:text-sand-300 high-contrast:text-black`}>
                    Aa
                  </span>
                  <span className="text-[11px] text-sand-500 dark:text-sand-400 high-contrast:text-gray-600 mt-0.5">
                    {opzioniDimensione[indiceDim]?.descrizione.split('(')[0].trim()}
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={aumentaTesto}
                      disabled={indiceDim === opzioniDimensione.length - 1}
                      className="h-10 w-10 border-sand-300 dark:border-sand-600 high-contrast:border-black"
                      aria-label="Aumenta dimensione testo"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Aumenta testo</TooltipContent>
                </Tooltip>
              </div>

              {/* Barra indicatore dimensione */}
              <div className="flex gap-1 mt-2">
                {opzioniDimensione.map((opz, i) => (
                  <div
                    key={opz.valore}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= indiceDim ? 'bg-sand-500' : 'bg-sand-200 dark:bg-gray-700 high-contrast:bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Sezione Animazioni */}
            <div>
              <h4 className="text-sm font-bold text-sand-700 dark:text-sand-400 high-contrast:text-black mb-2 flex items-center gap-1.5">
                {riduzioneAnimazioni ? <Sparkles className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                Animazioni
              </h4>
              <button
                onClick={() => impostaRiduzioneAnimazioni(!riduzioneAnimazioni)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 ${
                  riduzioneAnimazioni
                    ? 'border-sand-500 bg-sand-50 dark:border-sand-400 dark:bg-sand-900/30 high-contrast:border-black high-contrast:bg-sand-100'
                    : 'border-gray-200 dark:border-gray-700 high-contrast:border-gray-400 bg-white dark:bg-gray-800 high-contrast:bg-white hover:border-sand-300 dark:hover:border-sand-600'
                }`}
                role="switch"
                aria-checked={riduzioneAnimazioni}
                aria-label="Riduci animazioni"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sand-600 dark:text-sand-400 high-contrast:text-black" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-sand-700 dark:text-sand-300 high-contrast:text-black">
                      Riduci animazioni
                    </p>
                    <p className="text-[11px] text-sand-500 dark:text-sand-400 high-contrast:text-gray-600">
                      Disattiva movimenti e transizioni
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <div className={`relative h-6 w-11 rounded-full transition-colors ${
                  riduzioneAnimazioni
                    ? 'bg-sand-500 dark:bg-sand-400 high-contrast:bg-black'
                    : 'bg-gray-300 dark:bg-gray-600 high-contrast:bg-gray-400'
                }`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    riduzioneAnimazioni ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsante flottante per aprire la toolbar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => impostaToolbarAccessibilita(!toolbarAccessibilitaAperta)}
            className={`flex items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 focus-visible:ring-4 focus-visible:ring-sand-400 ${
              toolbarAccessibilitaAperta
                ? 'h-14 w-14 bg-sand-700 text-white'
                : 'h-14 w-14 bg-sand-600 text-white hover:bg-sand-700'
            }`}
            aria-label={toolbarAccessibilitaAperta ? 'Chiudi strumenti accessibilità' : 'Apri strumenti accessibilità'}
            aria-expanded={toolbarAccessibilitaAperta}
          >
            <Accessibility className="h-7 w-7" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Strumenti di accessibilità</p>
          <p className="text-[11px] opacity-70">Tema, dimensione testo, animazioni</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
