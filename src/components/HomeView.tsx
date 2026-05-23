// Vista Home - Pagina principale con hero slider, statistiche e segnalazioni recenti
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
  Send,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// Importazione dinamica dello slider
const HeroSlider = dynamic(() => import('./HeroSlider'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] md:h-[370px] bg-gradient-to-br from-amber-600 via-orange-500 to-red-600 animate-pulse rounded-2xl" />
  ),
});

interface Segnalazione {
  id: string;
  titolo: string;
  descrizione: string;
  urgenza: string;
  stato: string;
  motivazione: string;
  tipoAnimale: string;
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
  perMotivazione: Record<string, number>;
  perTipoAnimale: Record<string, number>;
  notificheNonLette: number;
}

const coloriUrgenza: Record<string, string> = { bassa: 'bg-green-100 text-green-800', media: 'bg-yellow-100 text-yellow-800', alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800' };
const coloriStato: Record<string, string> = { ricevuta: 'bg-sky-100 text-sky-800', in_lavorazione: 'bg-amber-100 text-amber-800', risolta: 'bg-emerald-100 text-emerald-800', archiviata: 'bg-gray-100 text-gray-800' };
const etichetteUrgenza: Record<string, string> = { bassa: 'Bassa', media: 'Media', alta: 'Alta', critica: 'Critica' };
const etichetteStato: Record<string, string> = { ricevuta: 'Ricevuta', in_lavorazione: 'In lavorazione', risolta: 'Risolta', archiviata: 'Archiviata' };
const etichetteMotivazione: Record<string, string> = { randagismo: 'Randagismo', abbandono: 'Abbandono', maltrattamento: 'Maltrattamento', smarrimento: 'Smarrimento', rinvenimento: 'Rinvenimento', altro: 'Altro' };
const etichetteTipo: Record<string, string> = { cane: 'Cane 🐕', gatto: 'Gatto 🐈', altro: 'Altro 🐾' };
const coloriMotivazione: Record<string, string> = { randagismo: 'bg-amber-100 text-amber-800', abbandono: 'bg-red-100 text-red-800', maltrattamento: 'bg-purple-100 text-purple-800', smarrimento: 'bg-sky-100 text-sky-800', rinvenimento: 'bg-teal-100 text-teal-800', altro: 'bg-gray-100 text-gray-800' };
const coloriTipo: Record<string, string> = { cane: 'bg-orange-100 text-orange-800', gatto: 'bg-indigo-100 text-indigo-800', altro: 'bg-slate-100 text-slate-800' };

const contenitoreVariante = { nascosto: { opacity: 0 }, visibile: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const elementoVariante = { nascosto: { opacity: 0, y: 20 }, visibile: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Componente contatore animato
function ContatoreAnimato({ valore, durata = 1200 }: { valore: number; durata?: number }) {
  const [mostrato, setMostrato] = useState(() => valore);

  useEffect(() => {
    const fine = valore;
    const durataMs = durata;
    let startTime: number | null = null;
    let rafId: number;

    const anima = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progresso = Math.min((timestamp - startTime) / durataMs, 1);
      const eased = 1 - Math.pow(1 - progresso, 3);
      setMostrato(Math.round(fine * eased));
      if (progresso < 1) {
        rafId = requestAnimationFrame(anima);
      }
    };

    rafId = requestAnimationFrame(anima);
    return () => { cancelAnimationFrame(rafId); };
  }, [valore, durata]);

  return <span className="inline-block">{mostrato}</span>;
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

  // 3 step cards
  const stepCards = [
    { numero: 1, titolo: 'Segnala', descrizione: 'Compila il form con la posizione e i dettagli dell\'animale', icona: <MapPin className="h-6 w-6 text-amber-600" /> },
    { numero: 2, titolo: 'Monitora', descrizione: 'Segui lo stato della tua segnalazione dall\'area personale', icona: <Search className="h-6 w-6 text-amber-600" /> },
    { numero: 3, titolo: 'Risolvi', descrizione: 'Le autorità competenti intervengono e chiudono il caso', icona: <CheckCircle className="h-6 w-6 text-amber-600" /> },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Slider */}
      <HeroSlider />

      {/* 3 Step Cards */}
      <motion.section
        variants={contenitoreVariante}
        initial="nascosto"
        animate="visibile"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {stepCards.map((step) => (
          <motion.div key={step.numero} variants={elementoVariante}>
            <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group">
              {/* Icona decorativa di sfondo */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-300">
                <div className="text-[6rem]">{step.numero === 1 ? '📍' : step.numero === 2 ? '🔍' : '✅'}</div>
              </div>
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-600 text-white font-bold text-lg shadow-md shadow-amber-600/30">
                    {step.numero}
                  </div>
                  {step.icona}
                </div>
                <h3 className="text-lg font-bold text-amber-800">{step.titolo}</h3>
                <p className="text-sm text-amber-600 mt-1">{step.descrizione}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
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
              <Card className={`${scheda.bordo} bg-gradient-to-br ${scheda.gradiente} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden`}>
                {/* Icona decorativa di sfondo */}
                <div className="absolute -right-2 -bottom-2 opacity-[0.08]">
                  <Icona className="h-16 w-16" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-xs sm:text-sm font-medium text-amber-700">{scheda.titolo}</CardTitle>
                  <Icona className={`h-4 w-4 ${scheda.coloreIcona}`} />
                </CardHeader>
                <CardContent className="relative z-10">
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
        <Card className="border-amber-100 shadow-sm overflow-hidden max-w-3xl">
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
                    className="flex items-center gap-3 p-3 rounded-xl border border-amber-100/80 hover:bg-amber-50/50 hover:border-amber-200 cursor-pointer transition-all duration-200"
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
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge className={`${coloriMotivazione[seg.motivazione] || coloriMotivazione.altro} text-[10px] px-1.5 py-0 border-0`}>
                          {etichetteMotivazione[seg.motivazione] || seg.motivazione}
                        </Badge>
                        <Badge className={`${coloriTipo[seg.tipoAnimale] || coloriTipo.altro} text-[10px] px-1.5 py-0 border-0`}>
                          {etichetteTipo[seg.tipoAnimale] || seg.tipoAnimale}
                        </Badge>
                        {seg.indirizzo && (
                          <span className="text-xs text-amber-500 flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {seg.indirizzo}
                          </span>
                        )}
                      </div>
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
        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
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
                  <Send className="mr-2 h-4 w-4" />
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
