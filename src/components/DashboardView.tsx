// Vista Dashboard - Pannello amministrativo con statistiche e gestione segnalazioni

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
} from 'lucide-react';
import { useStore } from '@/lib/store';

// Interfaccia segnalazione
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

// Interfaccia statistiche
interface Statistiche {
  totale: number;
  recenti: number;
  perStato: Record<string, number>;
  perUrgenza: Record<string, number>;
  perMese: Record<string, number>;
  notificheNonLette: number;
}

// Interfaccia notifica
interface Notifica {
  id: string;
  messaggio: string;
  tipo: string;
  letta: boolean;
  segnalazioneId: string;
  segnalazione: {
    id: string;
    titolo: string;
    urgenza: string;
  };
  createdAt: string;
}

// Colori per i grafici
const COLORI_GRAFICO = ['#f59e0b', '#f97316', '#22c55e', '#0ea5e9', '#8b5cf6'];

// Colori urgenza per il grafico a torta
const COLORI_URGENZA: Record<string, string> = {
  bassa: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
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

// Colori badge stato
const coloriStato: Record<string, string> = {
  ricevuta: 'bg-sky-100 text-sky-800',
  in_lavorazione: 'bg-amber-100 text-amber-800',
  risolta: 'bg-emerald-100 text-emerald-800',
  archiviata: 'bg-gray-100 text-gray-800',
};

// Colori badge urgenza
const coloriUrgenza: Record<string, string> = {
  bassa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

export default function DashboardView() {
  const queryClient = useQueryClient();
  const { selezionaSegnalazione } = useStore();
  const [tabAttiva, setTabAttiva] = useState('panoramica');

  // Recupero statistiche
  const { data: statistiche, isLoading: caricamentoStats } = useQuery<Statistiche>({
    queryKey: ['statistiche'],
    queryFn: async () => {
      const risposta = await fetch('/api/segnalazioni/stats');
      return risposta.json();
    },
  });

  // Recupero segnalazioni
  const { data: datiSegnalazioni, isLoading: caricamentoSegnalazioni } = useQuery<{
    segnalazioni: Segnalazione[];
  }>({
    queryKey: ['segnalazioni-dashboard'],
    queryFn: async () => {
      const risposta = await fetch('/api/segnalazioni?perPagina=50');
      return risposta.json();
    },
  });

  // Recupero notifiche
  const { data: datiNotifiche } = useQuery<{ notifiche: Notifica[]; nonLette: number }>({
    queryKey: ['notifiche'],
    queryFn: async () => {
      const risposta = await fetch('/api/notifiche?limite=20');
      return risposta.json();
    },
  });

  // Mutazione per aggiornare stato
  const aggiornaStato = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const risposta = await fetch(`/api/segnalazioni/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato }),
      });
      if (!risposta.ok) throw new Error('Errore nell\'aggiornamento');
      return risposta.json();
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['segnalazioni'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
      queryClient.invalidateQueries({ queryKey: ['notifiche'] });
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento dello stato');
    },
  });

  // Mutazione per segnare notifiche come lette
  const segnaNotificheLette = useMutation({
    mutationFn: async (ids?: string[]) => {
      const risposta = await fetch('/api/notifiche', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { ids } : { segnaTutte: true }),
      });
      return risposta.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifiche'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
    },
  });

  // Preparazione dati per grafico a barre (per mese)
  const datiMese = statistiche?.perMese
    ? Object.entries(statistiche.perMese)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mese, conteggio]) => ({
          mese: new Date(mese + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
          segnalazioni: conteggio,
        }))
    : [];

  // Preparazione dati per grafico a torta (per urgenza)
  const datiUrgenza = statistiche?.perUrgenza
    ? Object.entries(statistiche.perUrgenza).map(([urgenza, conteggio]) => ({
        name: etichetteUrgenza[urgenza] || urgenza,
        value: conteggio,
        colore: COLORI_URGENZA[urgenza] || '#999',
      }))
    : [];

  const segnalazioni = datiSegnalazioni?.segnalazioni || [];
  const notifiche = datiNotifiche?.notifiche || [];

  return (
    <div className="space-y-6 pb-8">
      {/* Intestazione */}
      <div>
        <h2 className="text-2xl font-bold text-amber-800">Dashboard Amministrativa</h2>
        <p className="text-amber-600 mt-1">
          Panoramica e gestione delle segnalazioni di cani randagi
        </p>
      </div>

      {/* Schede statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Totale</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {caricamentoStats ? '...' : statistiche?.totale || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sky-700">Ricevute</CardTitle>
            <Clock className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-800">
              {caricamentoStats ? '...' : statistiche?.perStato?.ricevuta || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">In Lavorazione</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {caricamentoStats ? '...' : statistiche?.perStato?.in_lavorazione || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Risolte</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">
              {caricamentoStats ? '...' : statistiche?.perStato?.risolta || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab con grafici e tabelle */}
      <Tabs value={tabAttiva} onValueChange={setTabAttiva}>
        <TabsList className="bg-amber-50">
          <TabsTrigger value="panoramica" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="segnalazioni" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Segnalazioni
          </TabsTrigger>
          <TabsTrigger value="notifiche" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Notifiche
            {datiNotifiche?.nonLette > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[9px] border-0">
                {datiNotifiche.nonLette}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Panoramica */}
        <TabsContent value="panoramica" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grafico a barre - Segnalazioni per mese */}
            <Card>
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
                      <YAxis tick={{ fontSize: 11, fill: '#92400e' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fffbeb',
                          border: '1px solid #f59e0b',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="segnalazioni" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-amber-500 text-sm">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grafico a torta - Distribuzione per urgenza */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-amber-800">Distribuzione per Urgenza</CardTitle>
                <CardDescription>Proporzione dei livelli di urgenza</CardDescription>
              </CardHeader>
              <CardContent>
                {datiUrgenza.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={datiUrgenza}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {datiUrgenza.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.colore} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fffbeb',
                          border: '1px solid #f59e0b',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span style={{ color: '#92400e', fontSize: '12px' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-amber-500 text-sm">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistiche per stato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-amber-800">Riepilogo per Stato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-sky-50">
                  <Clock className="h-8 w-8 text-sky-600" />
                  <div>
                    <p className="text-2xl font-bold text-sky-800">
                      {statistiche?.perStato?.ricevuta || 0}
                    </p>
                    <p className="text-xs text-sky-600">Ricevute</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="text-2xl font-bold text-amber-800">
                      {statistiche?.perStato?.in_lavorazione || 0}
                    </p>
                    <p className="text-xs text-amber-600">In lavorazione</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-800">
                      {statistiche?.perStato?.risolta || 0}
                    </p>
                    <p className="text-xs text-emerald-600">Risolte</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Archive className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {statistiche?.perStato?.archiviata || 0}
                    </p>
                    <p className="text-xs text-gray-600">Archiviate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Segnalazioni */}
        <TabsContent value="segnalazioni">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-amber-800">Gestione Segnalazioni</CardTitle>
              <CardDescription>
                Clicca su una riga per vedere i dettagli. Usa il menu a tendina per cambiare lo stato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caricamentoSegnalazioni ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
                </div>
              ) : segnalazioni.length === 0 ? (
                <div className="text-center py-8 text-amber-500">
                  <Dog className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna segnalazione trovata</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-amber-700">Titolo</TableHead>
                        <TableHead className="text-amber-700 hidden md:table-cell">Urgenza</TableHead>
                        <TableHead className="text-amber-700">Stato</TableHead>
                        <TableHead className="text-amber-700 hidden lg:table-cell">Data</TableHead>
                        <TableHead className="text-amber-700">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segnalazioni.map((segnalazione) => (
                        <TableRow
                          key={segnalazione.id}
                          className="cursor-pointer hover:bg-amber-50/50"
                          onClick={() => selezionaSegnalazione(segnalazione.id)}
                        >
                          <TableCell className="font-medium text-amber-900 max-w-[200px] truncate">
                            {segnalazione.titolo}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={`${coloriUrgenza[segnalazione.urgenza]} text-xs border-0`}>
                              {etichetteUrgenza[segnalazione.urgenza]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${coloriStato[segnalazione.stato]} text-xs border-0`}>
                              {etichetteStato[segnalazione.stato]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-amber-600 hidden lg:table-cell">
                            {new Date(segnalazione.createdAt).toLocaleDateString('it-IT')}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={segnalazione.stato}
                              onValueChange={(nuovoStato) => {
                                aggiornaStato.mutate({
                                  id: segnalazione.id,
                                  stato: nuovoStato,
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs border-amber-200">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-amber-800">Notifiche</CardTitle>
                <CardDescription>
                  Aggiornamenti sulle segnalazioni
                </CardDescription>
              </div>
              {datiNotifiche?.nonLette > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-200 text-amber-700"
                  onClick={() => segnaNotificheLette.mutate()}
                >
                  <BellOff className="mr-1 h-4 w-4" />
                  Segna tutte come lette
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {notifiche.length === 0 ? (
                <div className="text-center py-8 text-amber-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {notifiche.map((notifica) => (
                      <div
                        key={notifica.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          notifica.letta
                            ? 'bg-white border-amber-100'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                        onClick={() => {
                          if (!notifica.letta) {
                            segnaNotificheLette.mutate([notifica.id]);
                          }
                          selezionaSegnalazione(notifica.segnalazioneId);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {!notifica.letta && (
                            <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900">
                              {notifica.messaggio}
                            </p>
                            <p className="text-xs text-amber-500 mt-0.5">
                              {new Date(notifica.createdAt).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {notifica.tipo === 'urgenza_alta' && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
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
