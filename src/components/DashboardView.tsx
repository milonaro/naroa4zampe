// Vista Dashboard - Pannello amministrativo con statistiche e gestione segnalazioni
// Accessibile solo dopo autenticazione

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle,
  Archive,
  AlertTriangle,
  Bell,
  BellOff,
  Dog,
  TrendingUp,
  Shield,
  Activity,
} from 'lucide-react';
import { useStore } from '@/lib/store';

// Interfacce
interface Segnalazione {
  id: string;
  titolo: string;
  descrizione: string;
  latitudine: number;
  longitudine: number;
  indirizzo?: string;
  razza?: string;
  colore?: string;
  taglia?: string;
  urgenza: string;
  stato: string;
  nomeSegnalatore: string;
  cognomeSegnalatore: string;
  emailSegnalatore: string;
  telefonoSegnalatore?: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistiche {
  totale: number;
  recenti: number;
  perStato: Record<string, number>;
  perUrgenza: Record<string, number>;
  perMese: Record<string, number>;
  notificheNonLette: number;
}

interface Notifica {
  id: string;
  messaggio: string;
  tipo: string;
  letta: boolean;
  segnalazioneId: string;
  segnalazione: { id: string; titolo: string; urgenza: string };
  createdAt: string;
}

// Costanti
const COLORI_URGENZA: Record<string, string> = {
  bassa: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
};

const etichetteUrgenza: Record<string, string> = { bassa: 'Bassa', media: 'Media', alta: 'Alta', critica: 'Critica' };
const etichetteStato: Record<string, string> = { ricevuta: 'Ricevuta', in_lavorazione: 'In lavorazione', risolta: 'Risolta', archiviata: 'Archiviata' };
const coloriStato: Record<string, string> = { ricevuta: 'bg-sky-100 text-sky-800', in_lavorazione: 'bg-amber-100 text-amber-800', risolta: 'bg-emerald-100 text-emerald-800', archiviata: 'bg-gray-100 text-gray-800' };
const coloriUrgenza: Record<string, string> = { bassa: 'bg-green-100 text-green-800', media: 'bg-yellow-100 text-yellow-800', alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800' };

// Varianti animazione
const contenitoreVariante = { nascosto: { opacity: 0 }, visibile: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const elementoVariante = { nascosto: { opacity: 0, y: 16 }, visibile: { opacity: 1, y: 0 } };

export default function DashboardView() {
  const queryClient = useQueryClient();
  const { selezionaSegnalazione, adminNome } = useStore();
  const [tabAttiva, setTabAttiva] = useState('panoramica');

  const { data: statistiche, isLoading: caricamentoStats } = useQuery<Statistiche>({
    queryKey: ['statistiche'],
    queryFn: async () => { const r = await fetch('/api/segnalazioni/stats'); return r.json(); },
  });

  const { data: datiSegnalazioni, isLoading: caricamentoSegnalazioni } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-dashboard'],
    queryFn: async () => { const r = await fetch('/api/segnalazioni?perPagina=50'); return r.json(); },
  });

  const { data: datiNotifiche } = useQuery<{ notifiche: Notifica[]; nonLette: number }>({
    queryKey: ['notifiche'],
    queryFn: async () => { const r = await fetch('/api/notifiche?limite=20'); return r.json(); },
  });

  const aggiornaStato = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const r = await fetch(`/api/segnalazioni/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stato }) });
      if (!r.ok) throw new Error('Errore');
      return r.json();
    },
    onSuccess: () => {
      toast.success('Stato aggiornato');
      queryClient.invalidateQueries({ queryKey: ['segnalazioni'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
      queryClient.invalidateQueries({ queryKey: ['notifiche'] });
    },
    onError: () => { toast.error('Errore aggiornamento stato'); },
  });

  const segnaNotificheLette = useMutation({
    mutationFn: async (ids?: string[]) => {
      const r = await fetch('/api/notifiche', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids ? { ids } : { segnaTutte: true }) });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifiche'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
    },
  });

  const datiMese = statistiche?.perMese
    ? Object.entries(statistiche.perMese).sort(([a], [b]) => a.localeCompare(b)).map(([mese, count]) => ({
        mese: new Date(mese + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        segnalazioni: count,
      }))
    : [];

  const datiUrgenza = statistiche?.perUrgenza
    ? Object.entries(statistiche.perUrgenza).map(([urg, count]) => ({
        name: etichetteUrgenza[urg] || urg, value: count, colore: COLORI_URGENZA[urg] || '#999',
      }))
    : [];

  const segnalazioni = datiSegnalazioni?.segnalazioni || [];
  const notifiche = datiNotifiche?.notifiche || [];

  // Schede statistiche con animazioni
  const schedeStats = [
    { titolo: 'Totale', valore: statistiche?.totale || 0, icona: FileText, colore: 'amber', sfondo: 'from-amber-50 to-orange-50', bordo: 'border-amber-200' },
    { titolo: 'Ricevute', valore: statistiche?.perStato?.ricevuta || 0, icona: Clock, colore: 'sky', sfondo: 'from-sky-50 to-blue-50', bordo: 'border-sky-200' },
    { titolo: 'In Lavorazione', valore: statistiche?.perStato?.in_lavorazione || 0, icona: TrendingUp, colore: 'amber', sfondo: 'from-amber-50 to-yellow-50', bordo: 'border-amber-200' },
    { titolo: 'Risolte', valore: statistiche?.perStato?.risolta || 0, icona: CheckCircle, colore: 'emerald', sfondo: 'from-emerald-50 to-green-50', bordo: 'border-emerald-200' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Intestazione con info admin */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-2">
              <Activity className="h-6 w-6 text-amber-600" />
              Dashboard Amministrativa
            </h2>
            <p className="text-amber-600 mt-1 text-sm">
              Panoramica e gestione delle segnalazioni
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">{adminNome}</span>
          </div>
        </div>
      </motion.div>

      {/* Schede statistiche animate */}
      <motion.div
        variants={contenitoreVariante}
        initial="nascosto"
        animate="visibile"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {schedeStats.map((scheda) => {
          const Icona = scheda.icona;
          return (
            <motion.div key={scheda.titolo} variants={elementoVariante}>
              <Card className={`${scheda.bordo} bg-gradient-to-br ${scheda.sfondo} hover:shadow-md transition-all duration-200`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700">{scheda.titolo}</CardTitle>
                  <Icona className={`h-4 w-4 text-${scheda.colore}-500`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-${scheda.colore}-800`}>
                    {caricamentoStats ? <span className="inline-block w-8 h-7 bg-amber-200/50 animate-pulse rounded" /> : scheda.valore}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tab con grafici e tabelle */}
      <Tabs value={tabAttiva} onValueChange={setTabAttiva}>
        <TabsList className="bg-amber-50/80 p-1">
          <TabsTrigger value="panoramica" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-amber-700">
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="segnalazioni" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-amber-700">
            Segnalazioni
          </TabsTrigger>
          <TabsTrigger value="notifiche" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-amber-700">
            Notifiche
            {datiNotifiche?.nonLette > 0 && (
              <Badge className="ml-1.5 h-5 min-w-[20px] p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0">
                {datiNotifiche.nonLette}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Panoramica */}
        <TabsContent value="panoramica" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="text-base text-amber-800">Segnalazioni per Mese</CardTitle>
                <CardDescription>Andamento degli ultimi mesi</CardDescription>
              </CardHeader>
              <CardContent>
                {datiMese.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={datiMese}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="mese" tick={{ fontSize: 11, fill: '#92400e' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#92400e' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: 13 }} />
                      <Bar dataKey="segnalazioni" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-amber-400 text-sm">Nessun dato</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="text-base text-amber-800">Distribuzione per Urgenza</CardTitle>
                <CardDescription>Proporzione dei livelli di urgenza</CardDescription>
              </CardHeader>
              <CardContent>
                {datiUrgenza.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={datiUrgenza} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                        {datiUrgenza.map((entry, i) => <Cell key={i} fill={entry.colore} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: 13 }} />
                      <Legend formatter={(v: string) => <span style={{ color: '#92400e', fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-amber-400 text-sm">Nessun dato</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Riepilogo per stato */}
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-base text-amber-800">Riepilogo per Stato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Ricevute', val: statistiche?.perStato?.ricevuta || 0, Icona: Clock, sfondo: 'bg-sky-50', colore: 'text-sky-700', iconaCol: 'text-sky-500' },
                  { label: 'In lavorazione', val: statistiche?.perStato?.in_lavorazione || 0, Icona: TrendingUp, sfondo: 'bg-amber-50', colore: 'text-amber-700', iconaCol: 'text-amber-500' },
                  { label: 'Risolte', val: statistiche?.perStato?.risolta || 0, Icona: CheckCircle, sfondo: 'bg-emerald-50', colore: 'text-emerald-700', iconaCol: 'text-emerald-500' },
                  { label: 'Archiviate', val: statistiche?.perStato?.archiviata || 0, Icona: Archive, sfondo: 'bg-gray-50', colore: 'text-gray-700', iconaCol: 'text-gray-500' },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${item.sfondo} transition-all hover:shadow-sm`}>
                    <item.Icona className={`h-7 w-7 ${item.iconaCol}`} />
                    <div>
                      <p className={`text-2xl font-bold ${item.colore}`}>{item.val}</p>
                      <p className="text-xs text-amber-500">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Segnalazioni */}
        <TabsContent value="segnalazioni">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-base text-amber-800">Gestione Segnalazioni</CardTitle>
              <CardDescription>Clicca su una riga per i dettagli. Usa il menu per cambiare stato.</CardDescription>
            </CardHeader>
            <CardContent>
              {caricamentoSegnalazioni ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full" />
                </div>
              ) : segnalazioni.length === 0 ? (
                <div className="text-center py-12 text-amber-400">
                  <Dog className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna segnalazione trovata</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-amber-700 font-semibold">Titolo</TableHead>
                        <TableHead className="text-amber-700 font-semibold hidden md:table-cell">Urgenza</TableHead>
                        <TableHead className="text-amber-700 font-semibold">Stato</TableHead>
                        <TableHead className="text-amber-700 font-semibold hidden lg:table-cell">Data</TableHead>
                        <TableHead className="text-amber-700 font-semibold">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segnalazioni.map((seg) => (
                        <TableRow
                          key={seg.id}
                          className="cursor-pointer hover:bg-amber-50/60 transition-colors"
                          onClick={() => selezionaSegnalazione(seg.id)}
                        >
                          <TableCell className="font-medium text-amber-900 max-w-[200px] truncate">{seg.titolo}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={`${coloriUrgenza[seg.urgenza]} text-xs border-0`}>{etichetteUrgenza[seg.urgenza]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${coloriStato[seg.stato]} text-xs border-0`}>{etichetteStato[seg.stato]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-amber-500 hidden lg:table-cell">
                            {new Date(seg.createdAt).toLocaleDateString('it-IT')}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={seg.stato}
                              onValueChange={(stato) => aggiornaStato.mutate({ id: seg.id, stato })}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="w-[140px] h-8 text-xs border-amber-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ricevuta">Ricevuta</SelectItem>
                                <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                                <SelectItem value="risolta">Risolta</SelectItem>
                                <SelectItem value="archiviata">Archiviata</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notifiche */}
        <TabsContent value="notifiche">
          <Card className="border-amber-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-amber-800">Notifiche</CardTitle>
                <CardDescription>Aggiornamenti sulle segnalazioni</CardDescription>
              </div>
              {datiNotifiche?.nonLette > 0 && (
                <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => segnaNotificheLette.mutate()}>
                  <BellOff className="mr-1 h-4 w-4" />
                  Segna tutte come lette
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {notifiche.length === 0 ? (
                <div className="text-center py-12 text-amber-400">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {notifiche.map((not) => (
                      <div
                        key={not.id}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          not.letta ? 'bg-white border-amber-100 hover:bg-amber-50/30' : 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/50 shadow-sm'
                        }`}
                        onClick={() => {
                          if (!not.letta) segnaNotificheLette.mutate([not.id]);
                          selezionaSegnalazione(not.segnalazioneId);
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          {!not.letta && <div className="h-2.5 w-2.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${not.letta ? 'text-amber-700' : 'font-medium text-amber-900'}`}>{not.messaggio}</p>
                            <p className="text-xs text-amber-400 mt-0.5">
                              {new Date(not.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {not.tipo === 'urgenza_alta' && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
