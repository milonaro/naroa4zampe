// Vista Home - Pagina principale con hero, statistiche e segnalazioni recenti
// Design migliorato con animazioni fluide, micro-interazioni e glassmorphism

'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dog,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  ArrowRight,
  Sparkles,
  PawPrint,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface Segnalazione {
  id: string;
  titolo: string;
  descrizione: string;
  urgenza: string;
  stato: string;
  latitudine: number;
  longitudine: number;
  indirizzo?: string;
  createdAt: string;
}

interface Statistiche {
  totale: number;
  recenti: number;
  perStato: Record<string, number>;
  perUrgenza: Record<string, number>;
  notificheNonLette: number;
}

const coloriUrgenza: Record<string, string> = { bassa: 'bg-green-100 text-green-800', media: 'bg-yellow-100 text-yellow-800', alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800' };
const coloriStato: Record<string, string> = { ricevuta: 'bg-sky-100 text-sky-800', in_lavorazione: 'bg-amber-100 text-amber-800', risolta: 'bg-emerald-100 text-emerald-800', archiviata: 'bg-gray-100 text-gray-800' };
const etichetteUrgenza: Record<string, string> = { bassa: 'Bassa', media: 'Media', alta: 'Alta', critica: 'Critica' };
const etichetteStato: Record<string, string> = { ricevuta: 'Ricevuta', in_lavorazione: 'In lavorazione', risolta: 'Risolta', archiviata: 'Archiviata' };

const classeUrgenzaBordo: Record<string, string> = {
  bassa: 'bordo-urgenza-bassa',
  media: 'bordo-urgenza-media',
  alta: 'bordo-urgenza-alta',
  critica: 'bordo-urgenza-critica',
};

const contenitoreVariante = { nascosto: { opacity: 0 }, visibile: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const elementoVariante = { nascosto: { opacity: 0, y: 20 }, visibile: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Componente contatore animato
function ContatoreAnimato({ valore, durata = 1200 }: { valore: number; durata?: number }) {
  const [mostrato, setMostrato] = useState(() => valore);
  const rifRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = valore;
    const durataMs = durata;
    let startTime: number | null = null;
    let rafId: number;

    const anima = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progresso = Math.min((timestamp - startTime) / durataMs, 1);
      // Easing: ease-out
      const eased = 1 - Math.pow(1 - progresso, 3);
      setMostrato(Math.round(fine * eased));
      if (progresso < 1) {
        rafId = requestAnimationFrame(anima);
      }
    };

    rafId = requestAnimationFrame(anima);
    return () => { cancelAnimationFrame(rafId); };
  }, [valore, durata]);

  return (
    <span
      ref={rifRef}
      className="inline-block"
      style={{ animation: 'conta-su 0.5s ease-out' }}
    >
      {mostrato}
    </span>
  );
}

export default function HomeView() {
  const { impostaVista, selezionaSegnalazione } = useStore();

  const { data: statistiche, isLoading: caricamentoStats } = useQuery<Statistiche>({
    queryKey: ['statistiche'],
    queryFn: async () => { const r = await fetch('/api/segnalazioni/stats'); return r.json(); },
  });

  const { data: datiRecenti, isLoading: caricamentoRecenti } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-recenti'],
    queryFn: async () => { const r = await fetch('/api/segnalazioni?perPagina=5'); return r.json(); },
  });

  const schedeStats = [
    { titolo: 'Totale Segnalazioni', valore: statistiche?.totale || 0, sottotitolo: 'ultimi 90 giorni', Icona: FileText, gradiente: 'from-amber-50/80 to-orange-50/80', bordo: 'border-amber-200/60', coloreTesto: 'text-amber-800', coloreIcona: 'text-amber-500' },
    { titolo: 'In Attesa', valore: (statistiche?.perStato?.ricevuta || 0) + (statistiche?.perStato?.in_lavorazione || 0), sottotitolo: 'ricevute + in lavorazione', Icona: Clock, gradiente: 'from-sky-50/80 to-blue-50/80', bordo: 'border-sky-200/60', coloreTesto: 'text-sky-800', coloreIcona: 'text-sky-500' },
    { titolo: 'Risolte', valore: statistiche?.perStato?.risolta || 0, sottotitolo: 'casi chiusi', Icona: CheckCircle, gradiente: 'from-emerald-50/80 to-green-50/80', bordo: 'border-emerald-200/60', coloreTesto: 'text-emerald-800', coloreIcona: 'text-emerald-500' },
    { titolo: 'Urgenza Critica', valore: statistiche?.perUrgenza?.critica || 0, sottotitolo: 'intervento immediato', Icona: AlertTriangle, gradiente: 'from-red-50/80 to-orange-50/80', bordo: 'border-red-200/60', coloreTesto: 'text-red-800', coloreIcona: 'text-red-500' },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-red-600 p-6 md:p-10 text-white shadow-xl shadow-amber-500/20"
      >
        {/* Pattern griglia sottile nello sfondo */}
        <div className="absolute inset-0 pattern-griglia opacity-60" />

        {/* Decorazioni sfondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-[15%] text-[8rem] leading-none opacity-[0.06] select-none">🐕</div>
          <PawPrint className="absolute bottom-6 left-8 h-20 w-20 opacity-[0.06] paw-fluttuante" />
          <PawPrint className="absolute top-12 right-[40%] h-10 w-10 opacity-[0.04] paw-fluttuante" style={{ animationDelay: '1.5s' }} />
          <PawPrint className="absolute bottom-16 right-20 h-14 w-14 opacity-[0.05] paw-fluttuante" style={{ animationDelay: '2.8s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-200" />
            <span className="text-amber-200 text-sm font-medium">Comune di Naro</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight titolo-glow">
            Naro a 4 Zampe
          </h1>
          <p className="text-amber-100 text-base md:text-lg max-w-2xl mb-6 leading-relaxed">
            Aiuta il Comune di Naro a monitorare e gestire la presenza di animali randagi sul territorio.
            Ogni segnalazione è importante per la sicurezza dei cittadini e il benessere degli animali.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-lg shadow-amber-800/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-amber-800/30"
              onClick={() => impostaVista('segnala')}
            >
              <FileText className="mr-2 h-5 w-5" />
              Invia una Segnalazione
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/15 font-medium transition-all duration-300 hover:border-white/50 hover:scale-[1.02]"
              onClick={() => impostaVista('mappa')}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Vedi Mappa
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Statistiche */}
      <motion.section
        variants={contenitoreVariante}
        initial="nascosto"
        animate="visibile"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {schedeStats.map((scheda) => {
          const Icona = scheda.Icona;
          return (
            <motion.div key={scheda.titolo} variants={elementoVariante}>
              <Card className={`${scheda.bordo} bg-gradient-to-br ${scheda.gradiente} glassmorphism hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 scheda-glow`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-amber-700">{scheda.titolo}</CardTitle>
                  <Icona className={`h-4 w-4 ${scheda.coloreIcona}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl sm:text-3xl font-bold ${scheda.coloreTesto}`}>
                    {caricamentoStats ? (
                      <span className="inline-block w-10 h-8 bg-amber-200/50 animate-pulse rounded" />
                    ) : (
                      <ContatoreAnimato valore={scheda.valore} />
                    )}
                  </div>
                  <p className="text-[11px] text-amber-500 mt-1">{scheda.sottotitolo}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Segnalazioni Recenti */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-amber-100 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
            <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
              <Dog className="h-5 w-5 text-amber-500" />
              Segnalazioni Recenti
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
              onClick={() => impostaVista('mappa')}
            >
              Vedi tutte
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {caricamentoRecenti ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl">
                    <div className="h-10 w-10 bg-amber-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-amber-100 rounded w-2/3" />
                      <div className="h-3 bg-amber-50 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : datiRecenti?.segnalazioni?.length === 0 ? (
              <div className="text-center py-10 text-amber-500">
                <Dog className="h-14 w-14 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nessuna segnalazione trovata</p>
                <p className="text-sm text-amber-400 mt-1">Sii il primo a segnalare un animale randagio!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {datiRecenti?.segnalazioni?.map((seg, i) => (
                  <motion.div
                    key={seg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-amber-100/80 hover:bg-amber-50/50 hover:border-amber-200 cursor-pointer transition-all duration-200 entrata-scheda ${classeUrgenzaBordo[seg.urgenza] || ''}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                    onClick={() => selezionaSegnalazione(seg.id)}
                  >
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                      seg.urgenza === 'critica' ? 'bg-red-100' : seg.urgenza === 'alta' ? 'bg-orange-100' : seg.urgenza === 'media' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <Dog className={`h-5 w-5 ${
                        seg.urgenza === 'critica' ? 'text-red-600' : seg.urgenza === 'alta' ? 'text-orange-600' : seg.urgenza === 'media' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900 truncate">{seg.titolo}</p>
                      {seg.indirizzo && (
                        <span className="text-xs text-amber-500 flex items-center gap-0.5 truncate mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {seg.indirizzo}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`${coloriUrgenza[seg.urgenza]} text-[10px] px-1.5 py-0 border-0`}>
                        {etichetteUrgenza[seg.urgenza] || seg.urgenza}
                      </Badge>
                      <Badge className={`${coloriStato[seg.stato]} text-[10px] px-1.5 py-0 border-0`}>
                        {etichetteStato[seg.stato] || seg.stato}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="rounded-2xl p-[2px] bordo-gradiente-animato">
          <Card className="border-0 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-sm overflow-hidden relative rounded-[14px]">
            <div className="absolute -right-8 -bottom-8 text-[8rem] opacity-[0.06] select-none">🐾</div>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-amber-500" />
                  Hai visto un animale randagio?
                </h3>
                <p className="text-amber-600 text-sm mt-1 max-w-md">
                  La tua segnalazione può fare la differenza. Aiutaci a proteggere cittadini e animali del nostro territorio.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-600/30" onClick={() => impostaVista('segnala')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Segnala Ora
                </Button>
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 transition-all duration-200 hover:scale-[1.02]" onClick={() => impostaVista('mappa')}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Vedi Mappa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  );
}
