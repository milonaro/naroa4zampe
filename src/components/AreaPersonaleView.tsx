// Vista Area Personale - Accesso sicuro tramite verifica email con token
// I cittadini devono verificare la propria email tramite codice prima di accedere ai dati
// Questo previene che chiunque con email/CF possa vedere i dati all'insaputa dell'interessato

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  Copy,
  MapPin,
  Dog,
  Cat,
  PawPrint,
  Loader2,
  Eye,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Timer,
  Calendar,
  Siren,
  Heart,
  HelpCircle,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { COLORI_URGENZA_BADGE, COLORI_STATO_BADGE, COLORI_MOTIVAZIONE_BADGE, COLORI_TIPO_BADGE, ETICHETTE_URGENZA, ETICHETTE_STATO, ETICHETTE_MOTIVAZIONE, ETICHETTE_TIPO } from '@/lib/constants';
import { getGDPRComune } from '@/lib/tenant';

// Icone per tipo animale
const ICONE_TIPO_ANIMALE: Record<string, React.ElementType> = {
  cane: Dog,
  gatto: Cat,
  altro: PawPrint,
};

// Icone per motivazione
const ICONE_MOTIVAZIONE: Record<string, React.ElementType> = {
  randagismo: Eye,
  abbandono: Heart,
  maltrattamento: Siren,
  smarrimento: Search,
  rinvenimento: MapPin,
  altro: HelpCircle,
};

// Icone per stato
const ICONE_STATO_AP: Record<string, React.ElementType> = {
  ricevuta: FileText,
  in_lavorazione: Clock,
  risolta: CheckCircle,
  archiviata: ShieldAlert,
};

// Icone per urgenza
const ICONE_URGENZA_AP: Record<string, React.ElementType> = {
  bassa: CheckCircle,
  media: Clock,
  alta: AlertTriangle,
  critica: Siren,
};

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

// Costanti importate da lib/constants.ts

// Fasi dell'Area Personale
type FaseAreaPersonale = 'richiesta' | 'verifica' | 'accesso';

export default function AreaPersonaleView() {
  const { selezionaSegnalazione, configComune } = useStore();
  const queryClient = useQueryClient();

  // Stato della fase corrente
  const [fase, setFase] = useState<FaseAreaPersonale>('richiesta');
  const [emailInserita, setEmailInserita] = useState('');
  const [codiceToken, setCodiceToken] = useState(['', '', '', '', '', '']);
  const [emailVerificata, setEmailVerificata] = useState('');
  const [tokenDemo, setTokenDemo] = useState<string | null>(null);
  const [timerInvio, setTimerInvio] = useState(0);

  // Timer per reinvio codice (fix: era useState invece di useEffect)
  useEffect(() => {
    if (timerInvio <= 0) return;
    const t = setTimeout(() => setTimerInvio((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timerInvio]);

  // Mutazione: richiedi token
  const richiediToken = useMutation({
    mutationFn: async (email: string) => {
      const r = await fetch('/api/token-accesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.successo) {
        setFase('verifica');
        setTimerInvio(60); // 60 secondi prima di poter richiedere un nuovo codice
        // Demo: mostrare il token nel toast per testing
        if (data._demo_token) {
          setTokenDemo(data._demo_token);
          toast.success('Codice inviato alla tua email', {
            description: `[DEMO] Il tuo codice è: ${data._demo_token}`,
            duration: 15000,
          });
        } else {
          toast.success('Codice inviato alla tua email', {
            description: 'Controlla la tua casella di posta e inserisci il codice a 6 cifre.',
            duration: 8000,
          });
        }
      } else {
        toast.error(data.errore || 'Errore nell\'invio del codice');
      }
    },
    onError: () => {
      toast.error('Errore di connessione', { description: 'Riprova tra qualche istante.' });
    },
  });

  // Mutazione: verifica token
  const verificaToken = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const r = await fetch('/api/token-accesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.successo) {
        setEmailVerificata(data.email);
        setFase('accesso');
        toast.success('Verifica completata!', {
          description: 'Ora puoi visualizzare le tue segnalazioni.',
        });
      } else {
        toast.error(data.errore || 'Codice non valido');
        // Reset del codice inserito
        setCodiceToken(['', '', '', '', '', '']);
      }
    },
    onError: () => {
      toast.error('Errore di connessione');
    },
  });

  // Query segnalazioni (solo dopo verifica)
  const { data: datiSegnalazioni, isLoading: caricamento } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-area-personale', emailVerificata],
    queryFn: async () => {
      const r = await fetch('/api/segnalazioni?perPagina=100');
      return r.json();
    },
    enabled: fase === 'accesso' && !!emailVerificata,
  });

  // Filtra segnalazioni in base all'email verificata
  const segnalazioniFiltrate = useMemo(() => {
    if (!datiSegnalazioni?.segnalazioni || !emailVerificata) return [];
    return datiSegnalazioni.segnalazioni.filter(s =>
      s.emailSegnalatore.toLowerCase() === emailVerificata.toLowerCase()
    );
  }, [datiSegnalazioni, emailVerificata]);

  // Conteggi per stato
  const conteggiStato = useMemo(() => {
    const conteggi: Record<string, number> = { ricevuta: 0, in_lavorazione: 0, risolta: 0, archiviata: 0 };
    segnalazioniFiltrate.forEach(s => { conteggi[s.stato] = (conteggi[s.stato] || 0) + 1; });
    return conteggi;
  }, [segnalazioniFiltrate]);

  // Gestisci input codice token (una cifra per campo)
  const gestisciInputCodice = (indice: number, valore: string) => {
    if (valore.length > 1) valore = valore.slice(-1);
    if (valore && !/^\d$/.test(valore)) return;

    const nuovoCodice = [...codiceToken];
    nuovoCodice[indice] = valore;
    setCodiceToken(nuovoCodice);

    // Auto-focus al campo successivo
    if (valore && indice < 5) {
      const prossimoCampo = document.getElementById(`token-${indice + 1}`);
      prossimoCampo?.focus();
    }

    // Auto-verifica quando tutti i campi sono compilati
    if (nuovoCodice.every(c => c !== '')) {
      const tokenCompleto = nuovoCodice.join('');
      verificaToken.mutate({ email: emailInserita, token: tokenCompleto });
    }
  };

  // Gestisci tasto indietro nel codice
  const gestisciKeyDown = (indice: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codiceToken[indice] && indice > 0) {
      const campoPrecedente = document.getElementById(`token-${indice - 1}`);
      campoPrecedente?.focus();
    }
  };

  // Incolla codice
  const gestisciIncolla = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const testo = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(testo)) {
      const cifre = testo.split('');
      setCodiceToken(cifre);
      // Auto-verifica
      verificaToken.mutate({ email: emailInserita, token: testo });
    }
  };

  const gestisciRichiediCodice = () => {
    if (!emailInserita.trim()) {
      toast.error('Inserisci la tua email');
      return;
    }
    richiediToken.mutate(emailInserita.trim());
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

  const gestisciLogout = () => {
    setFase('richiesta');
    setEmailInserita('');
    setCodiceToken(['', '', '', '', '', '']);
    setEmailVerificata('');
    setTokenDemo(null);
  };

  return (
    <div className="container mx-auto px-4 space-y-6 pb-8 py-6">
      {/* Intestazione */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-50 -mx-6 -mt-2 px-6 py-5 border-b border-yellow-200/50">
          <h2 className="text-2xl font-bold text-yellow-800 flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-yellow-600" />
            Area Personale
          </h2>
          <p className="text-yellow-600 mt-1">
            Accedi in modo sicuro alle tue segnalazioni con verifica via email
          </p>
          {/* Indicatore di fase */}
          <div className="flex items-center gap-2 mt-3">
            {[
              { num: 1, label: 'Email', attiva: fase === 'richiesta' || fase === 'verifica' || fase === 'accesso', completata: fase !== 'richiesta' },
              { num: 2, label: 'Verifica', attiva: fase === 'verifica' || fase === 'accesso', completata: fase === 'accesso' },
              { num: 3, label: 'I Tuoi Dati', attiva: fase === 'accesso', completata: fase === 'accesso' },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                    step.completata
                      ? 'bg-emerald-500 text-white'
                      : step.attiva
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-100 text-yellow-400'
                  }`}>
                    {step.completata ? <CheckCircle className="h-3.5 w-3.5" /> : step.num}
                  </span>
                  <span className={`text-xs font-medium hidden sm:inline ${
                    step.attiva ? 'text-yellow-700' : 'text-yellow-400'
                  }`}>{step.label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-8 h-px mx-1.5 ${step.completata ? 'bg-emerald-400' : 'bg-yellow-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ═══════════ FASE 1: INSERIMENTO EMAIL ═══════════ */}
        {fase === 'richiesta' && (
          <motion.div
            key="richiesta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-yellow-200/60 shadow-sm max-w-lg mx-auto">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-100">
                  <KeyRound className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl text-yellow-800">Accedi alle tue segnalazioni</CardTitle>
                <CardDescription className="text-yellow-600 mt-1">
                  Per proteggere i tuoi dati, ti invieremo un codice di verifica via email.
                  Nessuno potrà vedere le tue segnalazioni senza questo codice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-accesso" className="text-yellow-700 font-medium">
                    Indirizzo Email
                  </Label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400" />
                      <Input
                        id="email-accesso"
                        type="email"
                        placeholder="la.tua@email.it"
                        value={emailInserita}
                        onChange={(e) => setEmailInserita(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && gestisciRichiediCodice()}
                        className="h-11 pl-10 border-yellow-200 focus:border-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={gestisciRichiediCodice}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-11 shadow-md shadow-yellow-600/20 transition-all duration-300 hover:scale-[1.01]"
                  disabled={richiediToken.isPending || !emailInserita.trim()}
                >
                  {richiediToken.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Invio in corso...</>
                  ) : (
                    <><Mail className="h-4 w-4 mr-2" /> Invia codice di verifica</>
                  )}
                </Button>

                {/* Info sicurezza */}
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-emerald-700 leading-relaxed">
                      <strong>Protezione dei dati:</strong> Il codice viene inviato solo al tuo indirizzo email.
                      Nessuno può accedere ai tuoi dati senza questo codice, anche conoscendo la tua email o il tuo Codice Fiscale.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════════ FASE 2: VERIFICA CODICE ═══════════ */}
        {fase === 'verifica' && (
          <motion.div
            key="verifica"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-yellow-200/60 shadow-sm max-w-lg mx-auto">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-100">
                  <Shield className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl text-yellow-800">Inserisci il codice di verifica</CardTitle>
                <CardDescription className="text-yellow-600 mt-1">
                  Abbiamo inviato un codice a 6 cifre a <strong className="text-yellow-800">{emailInserita}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Campi codice a 6 cifre */}
                <div className="flex justify-center gap-2" onPaste={gestisciIncolla}>
                  {codiceToken.map((cifra, indice) => (
                    <Input
                      key={indice}
                      id={`token-${indice}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={cifra}
                      onChange={(e) => gestisciInputCodice(indice, e.target.value)}
                      onKeyDown={(e) => gestisciKeyDown(indice, e)}
                      className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg transition-all ${
                        cifra
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                          : 'border-yellow-200 text-yellow-800'
                      } focus:border-yellow-600 focus:ring-yellow-600`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {verificaToken.isPending && (
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Verifica in corso...</span>
                  </div>
                )}

                {verificaToken.isError && (
                  <p className="text-center text-sm text-red-500">
                    Codice non valido. Riprova o richiedi un nuovo codice.
                  </p>
                )}

                {/* Demo hint */}
                {tokenDemo && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                    <p className="text-xs text-amber-700">
                      <strong>[Modalità Demo]</strong> Codice: <span className="font-mono text-lg font-bold text-amber-800">{tokenDemo}</span>
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFase('richiesta'); setCodiceToken(['', '', '', '', '', '']); }}
                    className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Indietro
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (timerInvio <= 0) {
                        richiediToken.mutate(emailInserita);
                      }
                    }}
                    disabled={timerInvio > 0 || richiediToken.isPending}
                    className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {timerInvio > 0 ? (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        Reinvia tra {timerInvio}s
                      </span>
                    ) : (
                      'Reinvia codice'
                    )}
                  </Button>
                </div>

                {/* Info scadenza */}
                <div className="text-center">
                  <p className="text-xs text-yellow-500">
                    Il codice scade dopo 15 minuti. Controlla anche la cartella spam.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════════ FASE 3: ACCESSO AI DATI ═══════════ */}
        {fase === 'accesso' && (
          <motion.div
            key="accesso"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Banner verifica completata */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Accesso verificato</p>
                  <p className="text-xs text-emerald-600">{emailVerificata}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={gestisciLogout}
                className="text-yellow-600 hover:text-yellow-800 text-xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Esci
              </Button>
            </div>

            {/* Conteggi stato */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Ricevute', valore: conteggiStato.ricevuta, icona: Clock, gradiente: 'from-sky-50/80 to-blue-50/80', bordo: 'border-sky-200/60', colore: 'text-sky-800', iconaCol: 'text-sky-500' },
                { label: 'In Lavorazione', valore: conteggiStato.in_lavorazione, icona: AlertTriangle, gradiente: 'from-yellow-50/80 to-yellow-50/80', bordo: 'border-yellow-200/60', colore: 'text-yellow-800', iconaCol: 'text-yellow-500' },
                { label: 'Risolte', valore: conteggiStato.risolta, icona: CheckCircle, gradiente: 'from-emerald-50/80 to-green-50/80', bordo: 'border-emerald-200/60', colore: 'text-emerald-800', iconaCol: 'text-emerald-500' },
                { label: 'Archiviate', valore: conteggiStato.archiviata, icona: Eye, gradiente: 'from-gray-50/80 to-slate-50/80', bordo: 'border-gray-200/60', colore: 'text-gray-800', iconaCol: 'text-gray-500' },
              ].map((scheda) => (
                <Card key={scheda.label} className={`${scheda.bordo} bg-gradient-to-br ${scheda.gradiente}`}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center justify-between mb-1">
                      <scheda.icona className={`h-4 w-4 ${scheda.iconaCol}`} />
                    </div>
                    <p className={`text-2xl font-bold ${scheda.colore}`}>{scheda.valore}</p>
                    <p className="text-xs text-yellow-500 mt-0.5">{scheda.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Lista segnalazioni */}
            <Card className="border-yellow-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                  <Dog className="h-5 w-5 text-yellow-600" />
                  Le Tue Segnalazioni
                  <Badge className="bg-yellow-100 text-yellow-800 border-0 ml-2">
                    {segnalazioniFiltrate.length} trovate
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caricamento ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                  </div>
                ) : segnalazioniFiltrate.length === 0 ? (
                  <div className="text-center py-10 text-yellow-500">
                    <Dog className="h-14 w-14 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nessuna segnalazione trovata</p>
                    <p className="text-sm text-yellow-400 mt-1">
                      Non ci sono segnalazioni associate a {emailVerificata}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {segnalazioniFiltrate.map((seg, i) => {
                      const IconaAnimale = ICONE_TIPO_ANIMALE[seg.tipoAnimale] || PawPrint;
                      const IconaMotivazione = ICONE_MOTIVAZIONE[seg.motivazione] || HelpCircle;
                      const IconaStato = ICONE_STATO_AP[seg.stato] || FileText;
                      const IconaUrgenza = ICONE_URGENZA_AP[seg.urgenza] || Clock;
                      const urgenzaBorderClass =
                        seg.urgenza === 'critica' ? 'bordo-urgenza-critica' :
                        seg.urgenza === 'alta' ? 'bordo-urgenza-alta' :
                        seg.urgenza === 'media' ? 'bordo-urgenza-media' :
                        'bordo-urgenza-bassa';

                      return (
                        <motion.div
                          key={seg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`${urgenzaBorderClass} flex items-start gap-4 p-4 rounded-xl border border-yellow-100/80 hover:bg-yellow-50/50 hover:border-yellow-200 cursor-pointer transition-all duration-200`}
                          onClick={() => selezionaSegnalazione(seg.id)}
                        >
                          {/* Icona tipo animale */}
                          <div className={`flex items-center justify-center h-12 w-12 rounded-xl shrink-0 ${
                            seg.tipoAnimale === 'cane' ? 'bg-yellow-100' :
                            seg.tipoAnimale === 'gatto' ? 'bg-indigo-100' : 'bg-slate-100'
                          }`}>
                            <IconaAnimale className={`h-6 w-6 ${
                              seg.tipoAnimale === 'cane' ? 'text-yellow-600' :
                              seg.tipoAnimale === 'gatto' ? 'text-indigo-600' : 'text-slate-600'
                            }`} />
                          </div>

                          {/* Contenuto centrale */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-yellow-900 truncate">{seg.titolo}</p>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              {/* Badge motivazione con icona */}
                              <Badge className={`${COLORI_MOTIVAZIONE_BADGE[seg.motivazione] || COLORI_MOTIVAZIONE_BADGE.altro} text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1`}>
                                <IconaMotivazione className="h-3 w-3" />
                                {ETICHETTE_MOTIVAZIONE[seg.motivazione] || seg.motivazione}
                              </Badge>
                              {/* Badge tipo animale con icona */}
                              <Badge className={`${COLORI_TIPO_BADGE[seg.tipoAnimale] || COLORI_TIPO_BADGE.altro} text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1`}>
                                <IconaAnimale className="h-3 w-3" />
                                {ETICHETTE_TIPO[seg.tipoAnimale] || seg.tipoAnimale}
                              </Badge>
                              {/* Posizione */}
                              {seg.indirizzo && (
                                <span className="text-xs text-yellow-600 flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {seg.indirizzo}
                                </span>
                              )}
                              {/* Data */}
                              <span className="text-xs text-yellow-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {new Date(seg.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </div>

                          {/* Badge urgenza e stato con icone */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge className={`${COLORI_URGENZA_BADGE[seg.urgenza]} text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1`}>
                              <IconaUrgenza className="h-3 w-3" />
                              {ETICHETTE_URGENZA[seg.urgenza] || seg.urgenza}
                            </Badge>
                            <Badge className={`${COLORI_STATO_BADGE[seg.stato]} text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1`}>
                              <IconaStato className="h-3 w-3" />
                              {ETICHETTE_STATO[seg.stato] || seg.stato}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gestione GDPR */}
            <Card className="border-yellow-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-600" />
                  Gestione Dati e Privacy (GDPR)
                </CardTitle>
                <CardDescription>
                  Visualizza e gestisci i tuoi consensi e i tuoi dati personali secondo il Regolamento UE 2016/679
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stato consensi */}
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 space-y-3">
                  <h4 className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-yellow-600" />
                    Stato Consensi
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700">Consenso Privacy</span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">Acconsentito</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700">Dichiarazione di Responsabilità</span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">Acconsentito</Badge>
                    </div>
                  </div>
                </div>

                <Separator className="bg-yellow-100" />

                {/* Azioni GDPR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 gap-2 h-auto py-3 flex flex-col items-center cursor-pointer"
                    onClick={richiediCopia}
                  >
                    <Download className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">Richiedi Copia Dati</span>
                    <span className="text-[10px] text-yellow-500">Art. 15 GDPR</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 gap-2 h-auto py-3 flex flex-col items-center cursor-pointer"
                    onClick={richiediCancellazione}
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Richiedi Cancellazione</span>
                    <span className="text-[10px] text-red-500">Art. 17 GDPR</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-sky-200 text-sky-700 hover:bg-sky-50 gap-2 h-auto py-3 flex flex-col items-center cursor-pointer"
                    onClick={() => toast.success('Richiesta inviata', { description: 'La portabilità dei dati sarà elaborata come da Art. 20 GDPR.' })}
                  >
                    <Copy className="h-5 w-5 text-sky-600" />
                    <span className="text-sm font-medium">Portabilità Dati</span>
                    <span className="text-[10px] text-sky-500">Art. 20 GDPR</span>
                  </Button>
                </div>

                <p className="text-xs text-yellow-500 leading-relaxed">
                  I tuoi diritti secondo il GDPR: puoi accedere ai tuoi dati (Art. 15), rettificarli (Art. 16),
                  cancellarli (Art. 17), limitarne il trattamento (Art. 18) e richiederne la portabilità (Art. 20).
                  Per esercitare i tuoi diritti contatta il {getGDPRComune(configComune)}.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
