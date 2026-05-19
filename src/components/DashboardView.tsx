// Vista Dashboard - Centro di Controllo Operativo "Naro a 4 Zampe"
// Design: Military Command Center / Dark Tactical Theme
// Accessibile solo dopo autenticazione

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Search,
  X,
  Plus,
  History,
  Crosshair,
  Radar,
  Radio,
  Siren,
  Loader2,
  ChevronRight,
  AlertOctagon,
  Users,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '@/lib/store';

// ─── Costanti ─────────────────────────────────────────────────────────────────
const NARO_LAT = 37.2964;
const NARO_LNG = 13.7764;
const RAGGIO_KM = 10;

const COLORI_URGENZA_CHART: Record<string, string> = {
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

const etichetteTaglia: Record<string, string> = {
  piccola: 'Piccola',
  media: 'Media',
  grande: 'Grande',
};

// Colori badge scuri
const coloriUrgenzaDark: Record<string, string> = {
  bassa: 'bg-green-900/60 text-green-300 border border-green-700/50',
  media: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  alta: 'bg-orange-900/60 text-orange-300 border border-orange-700/50',
  critica: 'bg-red-900/60 text-red-300 border border-red-700/50',
};

const coloriStatoDark: Record<string, string> = {
  ricevuta: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50',
  in_lavorazione: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  risolta: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  archiviata: 'bg-slate-700/60 text-slate-300 border border-slate-600/50',
};

const etichetteCampo: Record<string, string> = {
  stato: 'Stato',
  urgenza: 'Urgenza',
  titolo: 'Titolo',
  descrizione: 'Descrizione',
};

// ─── Interfacce ───────────────────────────────────────────────────────────────
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
  fuoriZona?: boolean;
  raggioOperativo?: number;
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

interface LogModifica {
  id: string;
  campoModificato: string;
  valorePrecedente: string;
  valoreNuovo: string;
  modificatoDa: string;
  createdAt: string;
}

interface AreaOperativa {
  centro: { latitudine: number; longitudine: number };
  raggioKm: number;
}

// Interfaccia per i dati utente raggruppati
interface UtenteDashboard {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  segnalazioni: {
    id: string;
    titolo: string;
    urgenza: string;
    stato: string;
    createdAt: string;
  }[];
}

// ─── Formula di Haversine ─────────────────────────────────────────────────────
function distanzaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Varianti animazione ─────────────────────────────────────────────────────
const contenitoreVariante = {
  nascosto: { opacity: 0 },
  visibile: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const elementoVariante = { nascosto: { opacity: 0, y: 12 }, visibile: { opacity: 1, y: 0 } };

// ─── Componente Principale ────────────────────────────────────────────────────
export default function DashboardView() {
  const queryClient = useQueryClient();
  const { selezionaSegnalazione, adminNome, adminUsername } = useStore();
  const [tabAttiva, setTabAttiva] = useState('panoramica');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [utentiSearch, setUtentiSearch] = useState('');
  const [debouncedUtentiSearch, setDebouncedUtentiSearch] = useState('');
  const [utenteEspanso, setUtenteEspanso] = useState<string | null>(null);
  const [fuoriZonaDialog, setFuoriZonaDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [permessoNotifiche, setPermessoNotifiche] = useState<NotificationPermission | 'default'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousUrgentCountRef = useRef<number>(0);

  // ─── Debounce search ────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  // ─── Debounce utenti search ────────────────────────────────────────────
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedUtentiSearch(utentiSearch), 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [utentiSearch]);

  // ─── Richiedi permesso notifiche ────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setPermessoNotifiche(perm);
      });
    }
  }, []);

  // ─── Suono allarme ──────────────────────────────────────────────────────
  const playAlarmSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio non supportato
    }
  }, []);

  // ─── Query: Statistiche ─────────────────────────────────────────────────
  const { data: statistiche, isLoading: caricamentoStats } = useQuery<Statistiche>({
    queryKey: ['statistiche'],
    queryFn: async () => { const r = await fetch('/api/segnalazioni/stats'); return r.json(); },
  });

  // ─── Query: Segnalazioni (con ricerca) ──────────────────────────────────
  const { data: datiSegnalazioni, isLoading: caricamentoSegnalazioni } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-dashboard', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ perPagina: '50' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const r = await fetch(`/api/segnalazioni?${params.toString()}`);
      return r.json();
    },
  });

  // ─── Query: Notifiche ───────────────────────────────────────────────────
  const { data: datiNotifiche } = useQuery<{ notifiche: Notifica[]; nonLette: number }>({
    queryKey: ['notifiche'],
    queryFn: async () => { const r = await fetch('/api/notifiche?limite=20'); return r.json(); },
  });

  // ─── Query: Area Operativa ──────────────────────────────────────────────
  const { data: areaOperativa } = useQuery<AreaOperativa>({
    queryKey: ['area-operativa'],
    queryFn: async () => { const r = await fetch('/api/segnalazioni/area-operativa'); return r.json(); },
  });

  // ─── Query: Utenti ──────────────────────────────────────────────────────
  const { data: datiUtenti, isLoading: caricamentoUtenti } = useQuery<{ utenti: UtenteDashboard[] }>({
    queryKey: ['utenti', debouncedUtentiSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedUtentiSearch) params.set('search', debouncedUtentiSearch);
      const r = await fetch(`/api/utenti?${params.toString()}`);
      return r.json();
    },
  });

  // ─── Query: Notifiche Urgenti (polling 15s) ─────────────────────────────
  const { data: urgentReports } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['urgent-reports'],
    queryFn: async () => {
      const r = await fetch('/api/segnalazioni?urgenza=critica&perPagina=10');
      return r.json();
    },
    refetchInterval: 15000,
  });

  // ─── Effetto: Notifiche urgenza real-time ───────────────────────────────
  useEffect(() => {
    const urgentCount = urgentReports?.segnalazioni?.length || 0;
    if (urgentCount > previousUrgentCountRef.current && previousUrgentCountRef.current >= 0) {
      const newCount = urgentCount - previousUrgentCountRef.current;
      if (newCount > 0) {
        // Toast persistente
        toast.error(`🚨 ${newCount} nuova/e segnalazione/i critica/e!`, {
          description: 'Intervento richiesto — priorità massima',
          duration: 10000,
        });
        // Suono allarme
        playAlarmSound();
        // Notifica browser nativa
        if (permessoNotifiche === 'granted') {
          try {
            new Notification('Naro a 4 Zampe — Allarme', {
              body: `${newCount} nuova/e segnalazione/i con urgenza critica rilevata/e`,
              icon: '🚨',
              tag: 'urgent-alert',
            });
          } catch {
            // Notifiche non supportate
          }
        }
      }
    }
    previousUrgentCountRef.current = urgentCount;
  }, [urgentReports, permessoNotifiche, playAlarmSound]);

  // ─── Conteggio notifiche urgenti non lette (derivato) ─────────────────
  const notificheUrgentiNonLette = useMemo(() => {
    return (datiNotifiche?.notifiche || []).filter(
      (n) => !n.letta && (n.tipo === 'urgenza_alta' || n.segnalazione?.urgenza === 'critica' || n.segnalazione?.urgenza === 'alta')
    ).length;
  }, [datiNotifiche]);

  // ─── Mutation: Aggiorna stato ───────────────────────────────────────────
  const aggiornaStato = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const adminEmail = adminUsername ? `${adminUsername}@comune.naro.it` : 'admin@comune.naro.it';
      const r = await fetch(`/api/segnalazioni/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato, modificatoDa: adminEmail }),
      });
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

  // ─── Mutation: Segna notifiche lette ────────────────────────────────────
  const segnaNotificheLette = useMutation({
    mutationFn: async (ids?: string[]) => {
      const r = await fetch('/api/notifiche', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { ids } : { segnaTutte: true }),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifiche'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
    },
  });

  // ─── Mutation: Creazione manuale ────────────────────────────────────────
  const creaSegnalazione = useMutation({
    mutationFn: async (dati: Record<string, unknown>) => {
      const r = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dati),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.errore || 'Errore creazione');
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success('Segnalazione creata con successo');
      queryClient.invalidateQueries({ queryKey: ['segnalazioni'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
      queryClient.invalidateQueries({ queryKey: ['notifiche'] });
      setTabAttiva('segnalazioni');
    },
    onError: (err) => {
      toast.error('Errore nella creazione', { description: err.message });
    },
  });

  // ─── Dati derivati ──────────────────────────────────────────────────────
  const segnalazioni = datiSegnalazioni?.segnalazioni || [];
  const notifiche = datiNotifiche?.notifiche || [];

  // Conteggio In Zona / Fuori Zona
  const inZona = segnalazioni.filter((s) => !s.fuoriZona).length;
  const fuoriZonaCount = segnalazioni.filter((s) => s.fuoriZona).length;

  const datiMese = statistiche?.perMese
    ? Object.entries(statistiche.perMese).sort(([a], [b]) => a.localeCompare(b)).map(([mese, count]) => ({
        mese: new Date(mese + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        segnalazioni: count,
      }))
    : [];

  const datiUrgenza = statistiche?.perUrgenza
    ? Object.entries(statistiche.perUrgenza).map(([urg, count]) => ({
        name: etichetteUrgenza[urg] || urg,
        value: count,
        colore: COLORI_URGENZA_CHART[urg] || '#999',
      }))
    : [];

  // ─── Schede statistiche ─────────────────────────────────────────────────
  const schedeStats = [
    {
      titolo: 'Totale',
      valore: statistiche?.totale || 0,
      icona: FileText,
      coloreGlow: 'shadow-cyan-500/30',
      bordoGlow: 'border-cyan-500/40',
      coloreTesto: 'text-cyan-400',
      coloreIcona: 'text-cyan-500',
    },
    {
      titolo: 'Ricevute',
      valore: statistiche?.perStato?.ricevuta || 0,
      icona: Clock,
      coloreGlow: 'shadow-sky-500/30',
      bordoGlow: 'border-sky-500/40',
      coloreTesto: 'text-sky-400',
      coloreIcona: 'text-sky-500',
    },
    {
      titolo: 'In Lavorazione',
      valore: statistiche?.perStato?.in_lavorazione || 0,
      icona: TrendingUp,
      coloreGlow: 'shadow-amber-500/30',
      bordoGlow: 'border-amber-500/40',
      coloreTesto: 'text-amber-400',
      coloreIcona: 'text-amber-500',
    },
    {
      titolo: 'Risolte',
      valore: statistiche?.perStato?.risolta || 0,
      icona: CheckCircle,
      coloreGlow: 'shadow-emerald-500/30',
      bordoGlow: 'border-emerald-500/40',
      coloreTesto: 'text-emerald-400',
      coloreIcona: 'text-emerald-500',
    },
  ];

  // ─── Handler: cambio stato con blocco fuori zona ────────────────────────
  const handleStatusChange = (seg: Segnalazione, nuovoStato: string) => {
    if (seg.fuoriZona) {
      setFuoriZonaDialog({ open: true, id: seg.id });
      return;
    }
    aggiornaStato.mutate({ id: seg.id, stato: nuovoStato });
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8 bg-[#070a10] -m-6 p-6 min-h-screen">
      {/* ─── Intestazione ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-100 font-mono tracking-tight flex items-center gap-2">
                Dashboard di Controllo
                <span className="text-[10px] font-normal text-cyan-600 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  NARO-4Z
                </span>
              </h2>
              <p className="text-cyan-600 text-xs font-mono mt-0.5">
                Naro a 4 Zampe — Centro Operativo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicatore urgente pulsante */}
            {notificheUrgentiNonLette > 0 && (
              <div className="relative">
                <div className="absolute -inset-1 bg-red-500/30 rounded-full animate-ping" />
                <div className="relative flex items-center gap-1.5 px-2.5 py-1 bg-red-900/50 border border-red-500/40 rounded-full">
                  <Siren className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-300">{notificheUrgentiNonLette} URGENTI</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-300">{adminNome}</span>
              {adminUsername && (
                <span className="text-[10px] font-mono text-cyan-600">@{adminUsername}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Schede Statistiche con Glow ──────────────────────────────── */}
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
              <Card className={`bg-slate-900/80 border ${scheda.bordoGlow} shadow-lg ${scheda.coloreGlow} backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-mono text-slate-400 uppercase tracking-wider">{scheda.titolo}</CardTitle>
                  <Icona className={`h-4 w-4 ${scheda.coloreIcona}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold font-mono ${scheda.coloreTesto}`}>
                    {caricamentoStats ? (
                      <span className="inline-block w-12 h-8 bg-slate-700/50 animate-pulse rounded" />
                    ) : (
                      scheda.valore
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ─── Tab principali ───────────────────────────────────────────── */}
      <Tabs value={tabAttiva} onValueChange={setTabAttiva}>
        <TabsList className="bg-slate-800/80 p-1 border border-slate-700/50">
          <TabsTrigger
            value="panoramica"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-mono text-xs"
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger
            value="segnalazioni"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-mono text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Segnalazioni
          </TabsTrigger>
          <TabsTrigger
            value="notifiche"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-mono text-xs relative"
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Notifiche
            {datiNotifiche?.nonLette > 0 && (
              <Badge className="ml-1.5 h-5 min-w-[20px] p-0 flex items-center justify-center bg-red-600 text-white text-[10px] border-0 font-mono">
                {datiNotifiche.nonLette}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="utenti"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-mono text-xs"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Utenti
          </TabsTrigger>
          <TabsTrigger
            value="inserimento"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-mono text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Inserimento Manuale
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB PANORAMICA ═══════════ */}
        <TabsContent value="panoramica" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grafico a barre per mese */}
            <Card className="bg-slate-900/80 border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-500" />
                  Segnalazioni per Mese
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs font-mono">Andamento ultimi mesi</CardDescription>
              </CardHeader>
              <CardContent>
                {datiMese.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={datiMese}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="mese" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #0e7490',
                          borderRadius: '8px',
                          fontSize: 12,
                          color: '#22d3ee',
                        }}
                      />
                      <Bar dataKey="segnalazioni" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-slate-600 text-sm font-mono">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grafico a torta urgenza */}
            <Card className="bg-slate-900/80 border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-cyan-500" />
                  Distribuzione per Urgenza
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs font-mono">Proporzione livelli di urgenza</CardDescription>
              </CardHeader>
              <CardContent>
                {datiUrgenza.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={datiUrgenza} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                        {datiUrgenza.map((entry, i) => <Cell key={i} fill={entry.colore} stroke="none" />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #0e7490',
                          borderRadius: '8px',
                          fontSize: 12,
                          color: '#22d3ee',
                        }}
                      />
                      <Legend formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-slate-600 text-sm font-mono">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Area Operativa ─────────────────────────────────────────── */}
          <Card className="bg-slate-900/80 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                <Radar className="h-4 w-4 text-cyan-500" />
                Area Operativa Preconfigurata
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs font-mono">
                Raggio di {areaOperativa?.raggioKm || RAGGIO_KM} km dal centro di Naro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Info centro e raggio */}
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Crosshair className="h-4 w-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">Centro Operativo</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-slate-400">
                      LAT: <span className="text-cyan-300">{areaOperativa?.centro.latitudine?.toFixed(4) || NARO_LAT.toFixed(4)}</span>
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      LNG: <span className="text-cyan-300">{areaOperativa?.centro.longitudine?.toFixed(4) || NARO_LNG.toFixed(4)}</span>
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      RAGGIO: <span className="text-cyan-300">{areaOperativa?.raggioKm || RAGGIO_KM} km</span>
                    </p>
                  </div>
                  {/* Indicatore visuale raggio */}
                  <div className="relative h-24 flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full border border-cyan-500/20 bg-cyan-500/5" />
                    <div className="absolute w-14 h-14 rounded-full border border-cyan-500/30 bg-cyan-500/10" />
                    <div className="absolute w-6 h-6 rounded-full bg-cyan-500/40 border border-cyan-400/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="absolute bottom-0 text-[9px] font-mono text-cyan-600">10km</span>
                  </div>
                </div>

                {/* Conteggio In Zona */}
                <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">In Zona</span>
                  </div>
                  <p className="text-4xl font-bold font-mono text-emerald-400">{inZona}</p>
                  <p className="text-xs text-emerald-600 font-mono">Segnalazioni entro il raggio operativo</p>
                </div>

                {/* Conteggio Fuori Zona */}
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertOctagon className="h-4 w-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">Fuori Zona</span>
                  </div>
                  <p className="text-4xl font-bold font-mono text-red-400">{fuoriZonaCount}</p>
                  <p className="text-xs text-red-600 font-mono">Oltre il raggio — azioni bloccate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Riepilogo per Stato ────────────────────────────────────── */}
          <Card className="bg-slate-900/80 border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-500" />
                Riepilogo per Stato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Ricevute', val: statistiche?.perStato?.ricevuta || 0, Icona: Clock, sfondo: 'bg-sky-900/30', colore: 'text-sky-400', iconaCol: 'text-sky-500', bordo: 'border-sky-500/30' },
                  { label: 'In lavorazione', val: statistiche?.perStato?.in_lavorazione || 0, Icona: TrendingUp, sfondo: 'bg-amber-900/30', colore: 'text-amber-400', iconaCol: 'text-amber-500', bordo: 'border-amber-500/30' },
                  { label: 'Risolte', val: statistiche?.perStato?.risolta || 0, Icona: CheckCircle, sfondo: 'bg-emerald-900/30', colore: 'text-emerald-400', iconaCol: 'text-emerald-500', bordo: 'border-emerald-500/30' },
                  { label: 'Archiviate', val: statistiche?.perStato?.archiviata || 0, Icona: Archive, sfondo: 'bg-slate-800/50', colore: 'text-slate-400', iconaCol: 'text-slate-500', bordo: 'border-slate-600/30' },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-3 p-3 rounded-lg ${item.sfondo} border ${item.bordo} transition-all hover:shadow-sm`}>
                    <item.Icona className={`h-6 w-6 ${item.iconaCol}`} />
                    <div>
                      <p className={`text-2xl font-bold font-mono ${item.colore}`}>{item.val}</p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB SEGNALAZIONI ═══════════ */}
        <TabsContent value="segnalazioni">
          <Card className="bg-slate-900/80 border border-slate-700/50">
            <CardHeader className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-500" />
                    Gestione Segnalazioni
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs font-mono mt-1">
                    Clicca su una riga per i dettagli. Usa il menu per cambiare stato.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs"
                  onClick={() => setTabAttiva('inserimento')}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Nuova Segnalazione Manuale
                </Button>
              </div>
              {/* ─── Barra di Ricerca Istantanea ──────────────────────── */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Cerca per titolo, descrizione o coordinate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 bg-slate-800/60 border-slate-700/50 text-cyan-100 placeholder:text-slate-600 font-mono text-xs focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {caricamentoSegnalazioni ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
                </div>
              ) : segnalazioni.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Dog className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm">Nessuna segnalazione trovata</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-700/50">
                        <TableHead className="text-slate-400 font-mono text-xs">Titolo</TableHead>
                        <TableHead className="text-slate-400 font-mono text-xs hidden md:table-cell">Urgenza</TableHead>
                        <TableHead className="text-slate-400 font-mono text-xs">Stato</TableHead>
                        <TableHead className="text-slate-400 font-mono text-xs hidden sm:table-cell">Zona</TableHead>
                        <TableHead className="text-slate-400 font-mono text-xs hidden lg:table-cell">Data</TableHead>
                        <TableHead className="text-slate-400 font-mono text-xs">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segnalazioni.map((seg) => (
                        <TableRow
                          key={seg.id}
                          className={`cursor-pointer transition-colors border-slate-700/30 ${
                            seg.fuoriZona
                              ? 'bg-red-950/30 hover:bg-red-950/50'
                              : 'hover:bg-slate-800/50'
                          }`}
                          onClick={() => selezionaSegnalazione(seg.id)}
                        >
                          <TableCell className="font-mono text-slate-200 text-xs max-w-[200px] truncate">
                            {seg.titolo}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={`${coloriUrgenzaDark[seg.urgenza]} text-[10px] font-mono`}>
                              {etichetteUrgenza[seg.urgenza]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${coloriStatoDark[seg.stato]} text-[10px] font-mono`}>
                              {etichetteStato[seg.stato]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {seg.fuoriZona ? (
                              <Badge className="bg-red-900/60 text-red-300 border border-red-600/50 text-[10px] font-mono">
                                <AlertOctagon className="h-3 w-3 mr-1" />
                                Fuori Zona
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 text-[10px] font-mono">
                                In Zona
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono hidden lg:table-cell">
                            {new Date(seg.createdAt).toLocaleDateString('it-IT')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={seg.stato}
                                onValueChange={(stato) => handleStatusChange(seg, stato)}
                                disabled={seg.fuoriZona}
                              >
                                <SelectTrigger className={`w-[130px] h-7 text-[10px] font-mono ${
                                  seg.fuoriZona
                                    ? 'border-red-800/50 bg-red-950/30 text-red-500 opacity-60'
                                    : 'border-slate-700/50 bg-slate-800/60 text-slate-200'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700">
                                  <SelectItem value="ricevuta" className="text-slate-200 font-mono text-xs focus:bg-slate-800">Ricevuta</SelectItem>
                                  <SelectItem value="in_lavorazione" className="text-slate-200 font-mono text-xs focus:bg-slate-800">In lavorazione</SelectItem>
                                  <SelectItem value="risolta" className="text-slate-200 font-mono text-xs focus:bg-slate-800">Risolta</SelectItem>
                                  <SelectItem value="archiviata" className="text-slate-200 font-mono text-xs focus:bg-slate-800">Archiviata</SelectItem>
                                </SelectContent>
                              </Select>
                              {/* ─── Cronologia Popover ─────────────────── */}
                              <CronologiaPopover segnalazioneId={seg.id} />
                            </div>
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

        {/* ═══════════ TAB UTENTI ═══════════ */}
        <TabsContent value="utenti">
          <Card className="bg-slate-900/80 border border-slate-700/50">
            <CardHeader className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-500" />
                    Utenti Segnalatori
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs font-mono mt-1">
                    Cittadini che hanno inviato segnalazioni, raggruppati per email
                  </CardDescription>
                </div>
                <Badge className="bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono self-start">
                  {datiUtenti?.utenti?.length || 0} utenti
                </Badge>
              </div>
              {/* ─── Barra di Ricerca Utenti ──────────────────────── */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Cerca per nome, cognome o email..."
                  value={utentiSearch}
                  onChange={(e) => setUtentiSearch(e.target.value)}
                  className="pl-9 pr-9 h-9 bg-slate-800/60 border-slate-700/50 text-cyan-100 placeholder:text-slate-600 font-mono text-xs focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
                {utentiSearch && (
                  <button
                    onClick={() => { setUtentiSearch(''); setDebouncedUtentiSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {caricamentoUtenti ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
                </div>
              ) : !datiUtenti?.utenti || datiUtenti.utenti.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm">Nessun utente trovato</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {datiUtenti.utenti.map((utente) => {
                      const isEspanso = utenteEspanso === utente.email.toLowerCase();
                      const ultimaSegnalazione = utente.segnalazioni[0];
                      const perUrgenza: Record<string, number> = {};
                      const perStato: Record<string, number> = {};
                      utente.segnalazioni.forEach(s => {
                        perUrgenza[s.urgenza] = (perUrgenza[s.urgenza] || 0) + 1;
                        perStato[s.stato] = (perStato[s.stato] || 0) + 1;
                      });
                      return (
                        <motion.div
                          key={utente.email}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-800/40 border border-slate-700/40 rounded-lg overflow-hidden hover:border-slate-600/50 transition-all"
                        >
                          {/* ─── Intestazione Utente ──────────────────── */}
                          <div
                            className="p-4 cursor-pointer flex items-center gap-4"
                            onClick={() => setUtenteEspanso(isEspanso ? null : utente.email.toLowerCase())}
                          >
                            {/* Avatar */}
                            <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-cyan-400 font-mono text-sm font-bold">
                                {utente.nome.charAt(0)}{utente.cognome.charAt(0)}
                              </span>
                            </div>
                            {/* Info principali */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono text-slate-200 font-medium">
                                {utente.nome} {utente.cognome}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {utente.email}
                                </span>
                                {utente.telefono && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {utente.telefono}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Statistiche rapide */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-lg font-bold font-mono text-cyan-400">{utente.segnalazioni.length}</p>
                                <p className="text-[9px] text-slate-500 font-mono uppercase">Segnalazioni</p>
                              </div>
                              {ultimaSegnalazione && (
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {new Date(ultimaSegnalazione.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                  </p>
                                  <p className="text-[9px] text-slate-600 font-mono uppercase">Ultima</p>
                                </div>
                              )}
                              {isEspanso ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </div>

                          {/* ─── Dettagli Espansi ──────────────────────── */}
                          <AnimatePresence>
                            {isEspanso && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
                                  {/* Statistiche per urgenza e stato */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/30">
                                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Per Urgenza</p>
                                      <div className="space-y-1">
                                        {Object.entries(perUrgenza).map(([urg, count]) => (
                                          <div key={urg} className="flex items-center justify-between">
                                            <Badge className={`${coloriUrgenzaDark[urg]} text-[9px] font-mono`}>{etichetteUrgenza[urg]}</Badge>
                                            <span className="text-xs font-mono text-slate-300">{count}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/30">
                                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Per Stato</p>
                                      <div className="space-y-1">
                                        {Object.entries(perStato).map(([stato, count]) => (
                                          <div key={stato} className="flex items-center justify-between">
                                            <Badge className={`${coloriStatoDark[stato]} text-[9px] font-mono`}>{etichetteStato[stato]}</Badge>
                                            <span className="text-xs font-mono text-slate-300">{count}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Elenco segnalazioni dell'utente */}
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Elenco Segnalazioni</p>
                                    <div className="space-y-1.5">
                                      {utente.segnalazioni.map((seg) => (
                                        <div
                                          key={seg.id}
                                          className="flex items-center justify-between p-2 rounded-md bg-slate-800/40 border border-slate-700/20 cursor-pointer hover:bg-slate-700/40 transition-colors"
                                          onClick={() => selezionaSegnalazione(seg.id)}
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <FileText className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                            <span className="text-xs font-mono text-slate-300 truncate">{seg.titolo}</span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <Badge className={`${coloriUrgenzaDark[seg.urgenza]} text-[9px] font-mono`}>{etichetteUrgenza[seg.urgenza]}</Badge>
                                            <Badge className={`${coloriStatoDark[seg.stato]} text-[9px] font-mono`}>{etichetteStato[seg.stato]}</Badge>
                                            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                                              {new Date(seg.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB NOTIFICHE ═══════════ */}
        <TabsContent value="notifiche">
          <Card className="bg-slate-900/80 border border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-cyan-500" />
                  Notifiche Operative
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs font-mono mt-1">
                  Aggiornamenti e allerta segnalazioni
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {permessoNotifiche !== 'granted' && (
                  <TooltipProvider>
                    <TooltipUI>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-slate-400 hover:bg-slate-800 font-mono text-xs"
                          onClick={async () => {
                            if ('Notification' in window) {
                              const perm = await Notification.requestPermission();
                              setPermessoNotifiche(perm);
                              if (perm === 'granted') toast.success('Notifiche browser attivate');
                            }
                          }}
                        >
                          <Bell className="mr-1 h-3.5 w-3.5" />
                          Attiva Notifiche
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                        Ricevi allerte nel browser per segnalazioni critiche
                      </TooltipContent>
                    </TooltipUI>
                  </TooltipProvider>
                )}
                {datiNotifiche?.nonLette > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-400 hover:bg-slate-800 font-mono text-xs"
                    onClick={() => segnaNotificheLette.mutate()}
                  >
                    <BellOff className="mr-1 h-3.5 w-3.5" />
                    Segna tutte come lette
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifiche.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm">Nessuna notifica</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {notifiche
                      .sort((a, b) => {
                        // Priorità: urgenti e non lette prima
                        const isUrgentA = a.tipo === 'urgenza_alta' || a.segnalazione?.urgenza === 'critica';
                        const isUrgentB = b.tipo === 'urgenza_alta' || b.segnalazione?.urgenza === 'critica';
                        if (isUrgentA && !isUrgentB) return -1;
                        if (!isUrgentA && isUrgentB) return 1;
                        if (!a.letta && b.letta) return -1;
                        if (a.letta && !b.letta) return 1;
                        return 0;
                      })
                      .map((not) => {
                        const isUrgent = not.tipo === 'urgenza_alta' || not.segnalazione?.urgenza === 'critica';
                        return (
                          <div
                            key={not.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              not.letta
                                ? 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                                : isUrgent
                                  ? 'bg-red-950/40 border-red-500/30 hover:bg-red-950/60'
                                  : 'bg-slate-800/60 border-slate-600/40 hover:bg-slate-700/50'
                            }`}
                            onClick={() => {
                              if (!not.letta) segnaNotificheLette.mutate([not.id]);
                              selezionaSegnalazione(not.segnalazioneId);
                            }}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Indicatore non letta */}
                              {!not.letta && (
                                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                                  isUrgent ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'
                                }`} />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-mono ${
                                  not.letta ? 'text-slate-400' : isUrgent ? 'text-red-300 font-semibold' : 'text-slate-200 font-medium'
                                }`}>
                                  {not.messaggio}
                                </p>
                                <p className="text-[10px] text-slate-600 font-mono mt-1">
                                  {new Date(not.createdAt).toLocaleDateString('it-IT', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              {isUrgent && (
                                <Siren className="h-4 w-4 text-red-500 flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB INSERIMENTO MANUALE ═══════════ */}
        <TabsContent value="inserimento">
          <InserimentoManualeForm
            onSubmit={(dati) => creaSegnalazione.mutate(dati)}
            isPending={creaSegnalazione.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* ─── Dialog Fuori Zona ──────────────────────────────────────────── */}
      <AlertDialog open={fuoriZonaDialog.open} onOpenChange={(open) => setFuoriZonaDialog({ open, id: null })}>
        <AlertDialogContent className="bg-slate-900 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2 font-mono">
              <AlertOctagon className="h-5 w-5" />
              Segnalazione Fuori Zona
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              Questa segnalazione è fuori dall&apos;area operativa del Comune di Naro.
              Le azioni amministrative sono bloccate per i casi fuori zona.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 font-mono">
              Chiudi
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-mono"
              onClick={() => setFuoriZonaDialog({ open: false, id: null })}
            >
              Ho capito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Componente: CronologiaPopover — Timeline modifiche inline
// ═══════════════════════════════════════════════════════════════════════════════
function CronologiaPopover({ segnalazioneId }: { segnalazioneId: string }) {
  const [open, setOpen] = useState(false);

  const { data: logs, isLoading } = useQuery<LogModifica[]>({
    queryKey: ['cronologia', segnalazioneId],
    queryFn: async () => {
      const r = await fetch(`/api/segnalazioni/${segnalazioneId}`);
      if (!r.ok) throw new Error('Errore');
      const data = await r.json();
      return data.logModifiche || [];
    },
    enabled: open,
  });

  const etichetteStato2: Record<string, string> = {
    ricevuta: 'Ricevuta',
    in_lavorazione: 'In lavorazione',
    risolta: 'Risolta',
    archiviata: 'Archiviata',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-500 hover:text-cyan-400 hover:bg-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-slate-900 border-slate-700/50 p-0" align="end">
        <div className="p-3 border-b border-slate-700/50">
          <h4 className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Cronologia Modifiche
          </h4>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-500 mx-auto" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-4 text-center text-slate-600 text-xs font-mono">Nessuna modifica registrata</div>
          ) : (
            <div className="relative p-3">
              {/* Linea verticale */}
              <div className="absolute left-[13px] top-5 bottom-3 w-px bg-slate-700/50" />
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <div key={log.id} className="relative flex items-start gap-3">
                    <div className={`flex-shrink-0 h-4 w-4 rounded-full border-2 z-10 mt-0.5 ${
                      i === 0 ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-600 bg-slate-800'
                    }`}>
                      {i === 0 && <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 m-auto mt-px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleDateString('it-IT', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      <div className="text-xs text-slate-300 font-mono">
                        <span className="text-cyan-400">{etichetteStato2[log.valorePrecedente] || log.valorePrecedente}</span>
                        <ChevronRight className="inline h-3 w-3 mx-0.5 text-slate-600" />
                        <span className="text-emerald-400">{etichetteStato2[log.valoreNuovo] || log.valoreNuovo}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                        da {log.modificatoDa}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Componente: InserimentoManualeForm — Form per creazione manuale segnalazione
// ═══════════════════════════════════════════════════════════════════════════════
function InserimentoManualeForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (dati: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  // Stato del form
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [indirizzo, setIndirizzo] = useState('');
  const [razza, setRazza] = useState('');
  const [colore, setColore] = useState('');
  const [taglia, setTaglia] = useState('');
  const [urgenza, setUrgenza] = useState('media');
  const [nomeSegnalatore, setNomeSegnalatore] = useState('');
  const [cognomeSegnalatore, setCognomeSegnalatore] = useState('');
  const [emailSegnalatore, setEmailSegnalatore] = useState('');
  const [telefonoSegnalatore, setTelefonoSegnalatore] = useState('');

  // Calcolo raggio e fuori zona in tempo reale
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const hasCoords = !isNaN(latNum) && !isNaN(lngNum);
  const raggioOperativo = hasCoords ? distanzaKm(NARO_LAT, NARO_LNG, latNum, lngNum) : null;
  const isFuoriZona = raggioOperativo !== null ? raggioOperativo > RAGGIO_KM : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo || !descrizione || !hasCoords || !nomeSegnalatore || !cognomeSegnalatore || !emailSegnalatore) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    onSubmit({
      titolo,
      descrizione,
      latitudine: latNum,
      longitudine: lngNum,
      indirizzo: indirizzo || undefined,
      razza: razza || undefined,
      colore: colore || undefined,
      taglia: taglia || undefined,
      urgenza,
      nomeSegnalatore,
      cognomeSegnalatore,
      emailSegnalatore,
      telefonoSegnalatore: telefonoSegnalatore || undefined,
      consensoPrivacy: true,
      consensoDichiarazione: true,
      dataConsenso: new Date().toISOString(),
    });
  };

  const inputClass = "h-9 bg-slate-800/60 border-slate-700/50 text-cyan-100 placeholder:text-slate-600 font-mono text-xs focus:border-cyan-500/50 focus:ring-cyan-500/20";
  const labelClass = "text-slate-400 text-xs font-mono";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sezione Coordinate e Posizione */}
      <Card className="bg-slate-900/80 border border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-cyan-500" />
            Posizione e Coordinate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Latitudine *</Label>
              <Input
                placeholder="37.2964"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className={inputClass}
                type="number"
                step="any"
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Longitudine *</Label>
              <Input
                placeholder="13.7764"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className={inputClass}
                type="number"
                step="any"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Indirizzo (opzionale)</Label>
            <Input
              placeholder="es. Via Roma 15, Naro"
              value={indirizzo}
              onChange={(e) => setIndirizzo(e.target.value)}
              className={inputClass}
            />
          </div>
          {/* Indicatore raggio operativo */}
          {hasCoords && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              isFuoriZona
                ? 'bg-red-950/30 border-red-500/30'
                : 'bg-emerald-950/30 border-emerald-500/30'
            }`}>
              <Radar className={`h-4 w-4 ${isFuoriZona ? 'text-red-400' : 'text-emerald-400'}`} />
              <div className="flex-1">
                <p className={`text-xs font-mono ${isFuoriZona ? 'text-red-300' : 'text-emerald-300'}`}>
                  Distanza dal centro: {raggioOperativo?.toFixed(1)} km
                </p>
                <p className={`text-[10px] font-mono ${isFuoriZona ? 'text-red-500' : 'text-emerald-500'}`}>
                  {isFuoriZona ? '⚠ FUORI ZONA — Oltre il raggio operativo' : '✓ IN ZONA — Entro il raggio operativo'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sezione Dettagli Segnalazione */}
      <Card className="bg-slate-900/80 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
            <Dog className="h-4 w-4 text-cyan-500" />
            Dettagli Segnalazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Titolo *</Label>
            <Input
              placeholder="es. Animale randagio vicino alla piazza"
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Descrizione *</Label>
            <Textarea
              placeholder="Descrivi la situazione..."
              rows={3}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              className={`${inputClass} min-h-[70px]`}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Urgenza</Label>
              <Select value={urgenza} onValueChange={setUrgenza}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="bassa" className="text-slate-200 font-mono text-xs">Bassa</SelectItem>
                  <SelectItem value="media" className="text-slate-200 font-mono text-xs">Media</SelectItem>
                  <SelectItem value="alta" className="text-slate-200 font-mono text-xs">Alta</SelectItem>
                  <SelectItem value="critica" className="text-slate-200 font-mono text-xs">Critica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Razza/Tipo</Label>
              <Input placeholder="Meticcio..." value={razza} onChange={(e) => setRazza(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Colore</Label>
              <Input placeholder="Marrone..." value={colore} onChange={(e) => setColore(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Taglia</Label>
            <Select value={taglia} onValueChange={setTaglia}>
              <SelectTrigger className={`${inputClass} w-full md:w-1/3`}>
                <SelectValue placeholder="Seleziona taglia" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="piccola" className="text-slate-200 font-mono text-xs">Piccola (fino a 10kg)</SelectItem>
                <SelectItem value="media" className="text-slate-200 font-mono text-xs">Media (10-25kg)</SelectItem>
                <SelectItem value="grande" className="text-slate-200 font-mono text-xs">Grande (oltre 25kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Dati Segnalatore */}
      <Card className="bg-slate-900/80 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-cyan-300 flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-500" />
            Dati Segnalatore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Nome *</Label>
              <Input placeholder="Nome" value={nomeSegnalatore} onChange={(e) => setNomeSegnalatore(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Cognome *</Label>
              <Input placeholder="Cognome" value={cognomeSegnalatore} onChange={(e) => setCognomeSegnalatore(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Email *</Label>
              <Input placeholder="email@esempio.it" type="email" value={emailSegnalatore} onChange={(e) => setEmailSegnalatore(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Telefono</Label>
              <Input placeholder="333 1234567" value={telefonoSegnalatore} onChange={(e) => setTelefonoSegnalatore(e.target.value)} className={inputClass} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pulsante di invio */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-xs min-w-[200px] h-10"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creazione in corso...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Crea Segnalazione
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
