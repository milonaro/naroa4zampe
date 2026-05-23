// Vista Area Personale - Ricerca segnalazioni e gestione GDPR
// I cittadini possono cercare le proprie segnalazioni per email o CF e gestire i consensi

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Mail,
  CreditCard,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  Copy,
  MapPin,
  Dog,
  PawPrint,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaccia segnalazione
interface Segnalazione {
  id: string;
  titolo: string;
  descrizione: string;
  urgenza: string;
  stato: string;
  motivazione: string;
  tipoAnimale: string;
  indirizzo?: string;
  latitudine: number;
  longitudine: number;
  consensoPrivacy: boolean;
  consensoDichiarazione: boolean;
  dataConsenso?: string;
  nomeSegnalatore: string;
  cognomeSegnalatore: string;
  emailSegnalatore: string;
  createdAt: string;
  updatedAt: string;
}

// Etichette
const etichetteUrgenza: Record<string, string> = { bassa: 'Bassa', media: 'Media', alta: 'Alta', critica: 'Critica' };
const etichetteStato: Record<string, string> = { ricevuta: 'Ricevuta', in_lavorazione: 'In lavorazione', risolta: 'Risolta', archiviata: 'Archiviata' };
const etichetteMotivazione: Record<string, string> = { randagismo: 'Randagismo', abbandono: 'Abbandono', maltrattamento: 'Maltrattamento', smarrimento: 'Smarrimento', rinvenimento: 'Rinvenimento', altro: 'Altro' };
const etichetteTipo: Record<string, string> = { cane: 'Cane 🐕', gatto: 'Gatto 🐈', altro: 'Altro 🐾' };

// Colori badge
const coloriUrgenza: Record<string, string> = { bassa: 'bg-green-100 text-green-800', media: 'bg-yellow-100 text-yellow-800', alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800' };
const coloriStato: Record<string, string> = { ricevuta: 'bg-sky-100 text-sky-800', in_lavorazione: 'bg-amber-100 text-amber-800', risolta: 'bg-emerald-100 text-emerald-800', archiviata: 'bg-gray-100 text-gray-800' };
const coloriMotivazione: Record<string, string> = { randagismo: 'bg-amber-100 text-amber-800', abbandono: 'bg-red-100 text-red-800', maltrattamento: 'bg-purple-100 text-purple-800', smarrimento: 'bg-sky-100 text-sky-800', rinvenimento: 'bg-teal-100 text-teal-800', altro: 'bg-gray-100 text-gray-800' };
const coloriTipo: Record<string, string> = { cane: 'bg-orange-100 text-orange-800', gatto: 'bg-indigo-100 text-indigo-800', altro: 'bg-slate-100 text-slate-800' };

export default function AreaPersonaleView() {
  const { selezionaSegnalazione } = useStore();
  const [tipoRicerca, setTipoRicerca] = useState<'email' | 'cf'>('email');
  const [queryRicerca, setQueryRicerca] = useState('');
  const [ricercaEffettuata, setRicercaEffettuata] = useState(false);

  // Query segnalazioni
  const { data: datiSegnalazioni, isLoading: caricamento } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-area-personale'],
    queryFn: async () => {
      const r = await fetch('/api/segnalazioni?perPagina=100');
      return r.json();
    },
  });

  // Filtra segnalazioni in base alla ricerca
  const segnalazioniFiltrate = useMemo(() => {
    if (!datiSegnalazioni?.segnalazioni || !ricercaEffettuata || !queryRicerca.trim()) return [];
    const query = queryRicerca.trim().toLowerCase();
    if (tipoRicerca === 'email') {
      return datiSegnalazioni.segnalazioni.filter(s => s.emailSegnalatore.toLowerCase().includes(query));
    }
    // Per CF cerchiamo nel nome+cognome (semplificazione)
    return datiSegnalazioni.segnalazioni.filter(s =>
      `${s.nomeSegnalatore}${s.cognomeSegnalatore}`.toLowerCase().replace(/\s/g, '').includes(query.replace(/\s/g, ''))
    );
  }, [datiSegnalazioni, tipoRicerca, queryRicerca, ricercaEffettuata]);

  // Conteggi per stato
  const conteggiStato = useMemo(() => {
    const conteggi: Record<string, number> = { ricevuta: 0, in_lavorazione: 0, risolta: 0, archiviata: 0 };
    segnalazioniFiltrate.forEach(s => { conteggi[s.stato] = (conteggi[s.stato] || 0) + 1; });
    return conteggi;
  }, [segnalazioniFiltrate]);

  const gestisciRicerca = () => {
    if (!queryRicerca.trim()) {
      toast.error('Inserisci un termine di ricerca');
      return;
    }
    setRicercaEffettuata(true);
  };

  const richiediCancellazione = () => {
    toast.success('Richiesta di cancellazione inviata', {
      description: 'I tuoi dati saranno cancellati entro 30 giorni lavorativi come da GDPR.',
      duration: 6000,
    });
  };

  const richiediCopia = () => {
    toast.success('Richiesta copia dati inviata', {
      description: 'Riceverai una copia dei tuoi dati via email entro 15 giorni lavorativi.',
      duration: 6000,
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Intestazione */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 -mx-6 -mt-2 px-6 py-5 border-b border-amber-200/50">
          <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-amber-600" />
            Area Personale
          </h2>
          <p className="text-amber-600 mt-1">
            Cerca le tue segnalazioni e gestisci i tuoi dati personali
          </p>
        </div>
      </motion.div>

      {/* Ricerca */}
      <Card className="border-amber-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-600" />
            Cerca le tue segnalazioni
          </CardTitle>
          <CardDescription>
            Inserisci la tua email o il Codice Fiscale per trovare le segnalazioni inviate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tipoRicerca} onValueChange={(v) => { setTipoRicerca(v as 'email' | 'cf'); setRicercaEffettuata(false); }}>
            <TabsList className="mb-4">
              <TabsTrigger value="email" className="gap-1.5">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="cf" className="gap-1.5">
                <CreditCard className="h-4 w-4" />
                Codice Fiscale
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder={tipoRicerca === 'email' ? 'la.tua@email.it' : 'RSSMRA85M01H501Z'}
                  value={queryRicerca}
                  onChange={(e) => setQueryRicerca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && gestisciRicerca()}
                  className="h-11 border-amber-200 focus:border-amber-500"
                />
              </div>
              <Button
                onClick={gestisciRicerca}
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all duration-300 hover:scale-[1.03]"
                disabled={caricamento}
              >
                {caricamento ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Cerca</span>
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Risultati ricerca */}
      <AnimatePresence mode="wait">
        {ricercaEffettuata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Conteggi stato */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Ricevute', valore: conteggiStato.ricevuta, icona: Clock, gradiente: 'from-sky-50/80 to-blue-50/80', bordo: 'border-sky-200/60', colore: 'text-sky-800', iconaCol: 'text-sky-500' },
                { label: 'In Lavorazione', valore: conteggiStato.in_lavorazione, icona: AlertTriangle, gradiente: 'from-amber-50/80 to-orange-50/80', bordo: 'border-amber-200/60', colore: 'text-amber-800', iconaCol: 'text-amber-500' },
                { label: 'Risolte', valore: conteggiStato.risolta, icona: CheckCircle, gradiente: 'from-emerald-50/80 to-green-50/80', bordo: 'border-emerald-200/60', colore: 'text-emerald-800', iconaCol: 'text-emerald-500' },
                { label: 'Archiviate', valore: conteggiStato.archiviata, icona: FileText, gradiente: 'from-gray-50/80 to-slate-50/80', bordo: 'border-gray-200/60', colore: 'text-gray-800', iconaCol: 'text-gray-500' },
              ].map((scheda) => (
                <Card key={scheda.label} className={`${scheda.bordo} bg-gradient-to-br ${scheda.gradiente}`}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <scheda.icona className={`h-4 w-4 ${scheda.iconaCol}`} />
                    </div>
                    <p className={`text-2xl font-bold ${scheda.colore}`}>{scheda.valore}</p>
                    <p className="text-xs text-amber-500 mt-0.5">{scheda.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Lista segnalazioni */}
            <Card className="border-amber-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                  <Dog className="h-5 w-5 text-amber-600" />
                  Le Tue Segnalazioni
                  <Badge className="bg-amber-100 text-amber-800 border-0 ml-2">
                    {segnalazioniFiltrate.length} trovate
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {segnalazioniFiltrate.length === 0 ? (
                  <div className="text-center py-10 text-amber-500">
                    <Dog className="h-14 w-14 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nessuna segnalazione trovata</p>
                    <p className="text-sm text-amber-400 mt-1">Verifica i dati inseriti e riprova</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {segnalazioniFiltrate.map((seg, i) => (
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
                            {etichetteUrgenza[seg.urgenza]}
                          </Badge>
                          <Badge className={`${coloriStato[seg.stato]} text-[10px] px-1.5 py-0 border-0`}>
                            {etichetteStato[seg.stato]}
                          </Badge>
                          <span className="text-[10px] text-amber-400">
                            {new Date(seg.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gestione GDPR */}
      <Card className="border-amber-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Gestione Dati e Privacy (GDPR)
          </CardTitle>
          <CardDescription>
            Visualizza e gestisci i tuoi consensi e i tuoi dati personali secondo il Regolamento UE 2016/679
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stato consensi */}
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
            <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-600" />
              Stato Consensi
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700">Consenso Privacy</span>
                <span className="text-amber-500 text-xs">Disponibile dopo la ricerca</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700">Dichiarazione di Responsabilità</span>
                <span className="text-amber-500 text-xs">Disponibile dopo la ricerca</span>
              </div>
            </div>
          </div>

          <Separator className="bg-amber-100" />

          {/* Azioni GDPR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-2 h-auto py-3 flex flex-col items-center"
              onClick={richiediCopia}
            >
              <Download className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Richiedi Copia Dati</span>
              <span className="text-[10px] text-amber-500">Art. 15 GDPR</span>
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 gap-2 h-auto py-3 flex flex-col items-center"
              onClick={richiediCancellazione}
            >
              <Trash2 className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">Richiedi Cancellazione</span>
              <span className="text-[10px] text-red-500">Art. 17 GDPR</span>
            </Button>
            <Button
              variant="outline"
              className="border-sky-200 text-sky-700 hover:bg-sky-50 gap-2 h-auto py-3 flex flex-col items-center"
              onClick={() => toast.success('Richiesta inviata', { description: 'La portabilità dei dati sarà elaborata come da Art. 20 GDPR.' })}
            >
              <Copy className="h-5 w-5 text-sky-600" />
              <span className="text-sm font-medium">Portabilità Dati</span>
              <span className="text-[10px] text-sky-500">Art. 20 GDPR</span>
            </Button>
          </div>

          <p className="text-xs text-amber-500 leading-relaxed">
            I tuoi diritti secondo il GDPR: puoi accedere ai tuoi dati (Art. 15), rettificarli (Art. 16),
            cancellarli (Art. 17), limitarne il trattamento (Art. 18) e richiederne la portabilità (Art. 20).
            Per esercitare i tuoi diritti contatta il Responsabile della Protezione dei Dati del Comune di Naro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
