// Vista Home - Pagina principale con hero, statistiche e segnalazioni recenti

'use client';

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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Interfaccia per una segnalazione
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

// Interfaccia per le statistiche
interface Statistiche {
  totale: number;
  recenti: number;
  perStato: Record<string, number>;
  perUrgenza: Record<string, number>;
  notificheNonLette: number;
}

// Colori per l'urgenza
const coloriUrgenza: Record<string, string> = {
  bassa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

// Colori per lo stato
const coloriStato: Record<string, string> = {
  ricevuta: 'bg-sky-100 text-sky-800',
  in_lavorazione: 'bg-amber-100 text-amber-800',
  risolta: 'bg-emerald-100 text-emerald-800',
  archiviata: 'bg-gray-100 text-gray-800',
};

// Etichette in italiano
const etichetteUrgenza: Record<string, string> = {
  bassa: 'Bassa',
  media: 'Media',
  alta: 'Alta',
  critica: 'Critica',
};

const etichetteStato: Record<string, string> = {
  ricevuta: 'Ricevuta',
  in_lavorazione: 'In lavorazione',
  risolta: 'Risolta',
  archiviata: 'Archiviata',
};

export default function HomeView() {
  const { impostaVista, selezionaSegnalazione } = useStore();

  // Recupero statistiche
  const { data: statistiche, isLoading: caricamentoStats } = useQuery<Statistiche>({
    queryKey: ['statistiche'],
    queryFn: async () => {
      const risposta = await fetch('/api/segnalazioni/stats');
      return risposta.json();
    },
  });

  // Recupero segnalazioni recenti
  const { data: datiRecenti, isLoading: caricamentoRecenti } = useQuery<{
    segnalazioni: Segnalazione[];
  }>({
    queryKey: ['segnalazioni-recenti'],
    queryFn: async () => {
      const risposta = await fetch('/api/segnalazioni?perPagina=5');
      return risposta.json();
    },
  });

  // Varianti di animazione
  const contenitoreVariante = {
    nascosto: { opacity: 0 },
    visibile: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const elementoVariante = {
    nascosto: { opacity: 0, y: 20 },
    visibile: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Sezione Hero */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 md:p-10 text-white"
      >
        {/* Sfondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-[12rem] leading-none">🐕</div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            Segnala Cani Randagi a Naro
          </h1>
          <p className="text-amber-100 text-base md:text-lg max-w-2xl mb-6">
            Aiuta il Comune di Naro a monitorare e gestire la presenza di cani randagi sul territorio.
            Ogni segnalazione è importante per garantire la sicurezza dei cittadini e il benessere degli animali.
          </p>
          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-amber-50 font-semibold"
            onClick={() => impostaVista('segnala')}
          >
            <FileText className="mr-2 h-5 w-5" />
            Invia una Segnalazione
          </Button>
        </div>
      </motion.section>

      {/* Sezione Statistiche */}
      <motion.section
        variants={contenitoreVariante}
        initial="nascosto"
        animate="visibile"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={elementoVariante}>
          <Card className="border-amber-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Totale Segnalazioni</CardTitle>
              <FileText className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">
                {caricamentoStats ? '...' : statistiche?.totale || 0}
              </div>
              <p className="text-xs text-amber-600 mt-1">ultimi 90 giorni</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={elementoVariante}>
          <Card className="border-sky-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-700">In Attesa</CardTitle>
              <Clock className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-800">
                {caricamentoStats
                  ? '...'
                  : (statistiche?.perStato?.ricevuta || 0) +
                    (statistiche?.perStato?.in_lavorazione || 0)}
              </div>
              <p className="text-xs text-sky-600 mt-1">ricevute + in lavorazione</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={elementoVariante}>
          <Card className="border-emerald-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Risolte</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800">
                {caricamentoStats ? '...' : statistiche?.perStato?.risolta || 0}
              </div>
              <p className="text-xs text-emerald-600 mt-1">casi chiusi</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={elementoVariante}>
          <Card className="border-red-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Urgenza Critica</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">
                {caricamentoStats ? '...' : statistiche?.perUrgenza?.critica || 0}
              </div>
              <p className="text-xs text-red-600 mt-1">richiedono intervento immediato</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Sezione Segnalazioni Recenti */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-amber-800">Segnalazioni Recenti</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => impostaVista('mappa')}
            >
              Vedi tutte
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {caricamentoRecenti ? (
              // Skeleton di caricamento
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg">
                    <div className="h-10 w-10 bg-amber-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-amber-100 rounded w-2/3" />
                      <div className="h-3 bg-amber-50 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : datiRecenti?.segnalazioni?.length === 0 ? (
              <div className="text-center py-8 text-amber-600">
                <Dog className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nessuna segnalazione trovata</p>
                <p className="text-sm text-amber-500">Sii il primo a segnalare un cane randagio!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {datiRecenti?.segnalazioni?.map((segnalazione) => (
                  <div
                    key={segnalazione.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50/50 cursor-pointer transition-colors"
                    onClick={() => {
                      selezionaSegnalazione(segnalazione.id);
                    }}
                  >
                    {/* Icona urgenza */}
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      segnalazione.urgenza === 'critica'
                        ? 'bg-red-100'
                        : segnalazione.urgenza === 'alta'
                        ? 'bg-orange-100'
                        : segnalazione.urgenza === 'media'
                        ? 'bg-yellow-100'
                        : 'bg-green-100'
                    }`}>
                      <Dog className={`h-5 w-5 ${
                        segnalazione.urgenza === 'critica'
                          ? 'text-red-600'
                          : segnalazione.urgenza === 'alta'
                          ? 'text-orange-600'
                          : segnalazione.urgenza === 'media'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`} />
                    </div>

                    {/* Dettagli segnalazione */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900 truncate">
                        {segnalazione.titolo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {segnalazione.indirizzo && (
                          <span className="text-xs text-amber-600 flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {segnalazione.indirizzo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge urgenza e stato */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={`${coloriUrgenza[segnalazione.urgenza]} text-[10px] px-1.5 py-0 border-0`}>
                        {etichetteUrgenza[segnalazione.urgenza] || segnalazione.urgenza}
                      </Badge>
                      <Badge className={`${coloriStato[segnalazione.stato]} text-[10px] px-1.5 py-0 border-0`}>
                        {etichetteStato[segnalazione.stato] || segnalazione.stato}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Sezione Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-amber-800">
                Hai visto un cane randagio?
              </h3>
              <p className="text-amber-600 text-sm mt-1">
                La tua segnalazione può fare la differenza. Aiutaci a proteggere cittadini e animali.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => impostaVista('segnala')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Segnala Ora
              </Button>
              <Button
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => impostaVista('mappa')}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Vedi Mappa
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
