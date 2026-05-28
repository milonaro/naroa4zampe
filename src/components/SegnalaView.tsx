// Vista Segnala - Form multi-step wizard per segnalazione animale randagio
// Step-by-step con indicatore di progresso visuale, un passo alla volta
// Include consensi GDPR obbligatori, mappa Leaflet interattiva, upload multimedia

'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  MapPin, Upload, Loader2, Send, ClipboardList, X, Shield, Lock, User,
  AlertTriangle, Camera, ChevronRight, ChevronLeft, Check, FileImage,
  Sparkles, Dog, Cat, PawPrint, Siren, Search, Heart, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Le coordinate sono lette dal configComune nello store

// Importazione dinamica mappa
const MappaSegnalaLeaflet = dynamic(() => import('./MappaSegnalaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-500 mx-auto mb-2" />
        <p className="text-yellow-600 text-sm">Caricamento mappa...</p>
      </div>
    </div>
  ),
});

// Schema validazione
const segnalazioneSchema = z.object({
  titolo: z.string().min(3, 'Il titolo deve avere almeno 3 caratteri'),
  descrizione: z.string().min(10, 'La descrizione deve avere almeno 10 caratteri'),
  latitudine: z.number({ message: 'Seleziona un punto sulla mappa' }).min(-90).max(90),
  longitudine: z.number({ message: 'Seleziona un punto sulla mappa' }).min(-180).max(180),
  indirizzo: z.string().optional(),
  razza: z.string().optional(),
  colore: z.string().optional(),
  taglia: z.enum(['piccola', 'media', 'grande']).optional(),
  tipoAnimale: z.enum(['cane', 'gatto', 'altro']).default('cane'),
  motivazione: z.enum(['randagismo', 'abbandono', 'maltrattamento', 'smarrimento', 'rinvenimento', 'altro']).default('randagismo'),
  urgenza: z.enum(['bassa', 'media', 'alta', 'critica']).default('media'),
  nomeSegnalatore: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  cognomeSegnalatore: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  emailSegnalatore: z.string().email('Inserisci un indirizzo email valido'),
  telefonoSegnalatore: z.string().min(1, 'Il telefono è obbligatorio'),
  consensoPrivacy: z.literal(true, { message: 'Devi accettare l\'informativa sulla privacy' }),
  consensoDichiarazione: z.literal(true, { message: 'Devi accettare la dichiarazione di responsabilità' }),
});

type DatiSegnalazione = z.infer<typeof segnalazioneSchema>;

// Configurazione step
const stepsConfig = [
  { num: 1, label: 'Posizione', icon: MapPin, colore: 'emerald' },
  { num: 2, label: 'Dettagli', icon: ClipboardList, colore: 'yellow' },
  { num: 3, label: 'I Tuoi Dati', icon: User, colore: 'sky' },
  { num: 4, label: 'Consenso', icon: Shield, colore: 'red' },
];

export default function SegnalaView() {
  const queryClient = useQueryClient();
  const [stepCorrente, setStepCorrente] = useState(1);
  const [posizioneMappa, setPosizioneMappa] = useState<{ lat: number; lng: number } | null>(null);
  const [anteprimaFoto, setAnteprimaFoto] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [segnalazioniSimili, setSegnalazioniSimili] = useState<Array<{
    id: string; titolo: string; urgenza: string; stato: string; distanza: number; createdAt: string;
  }> | null>(null);
  const [direzione, setDirezione] = useState(1); // 1 = avanti, -1 = indietro

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
    reset,
  } = useForm<DatiSegnalazione>({
    resolver: zodResolver(segnalazioneSchema) as any,
    defaultValues: {
      tipoAnimale: 'cane',
      motivazione: 'randagismo',
      urgenza: 'media',
      latitudine: 0,
      longitudine: 0,
      consensoPrivacy: false as unknown as true,
      consensoDichiarazione: false as unknown as true,
    },
  });

  const urgenzaSelezionata = watch('urgenza');
  const tipoSelezionato = watch('tipoAnimale');
  const motivazioneSelezionata = watch('motivazione');
  const latitudine = watch('latitudine');
  const longitudine = watch('longitudine');

  // Creazione segnalazione
  const creaSegnalazione = useMutation({
    mutationFn: async (dati: DatiSegnalazione & { fotoUrl?: string; dataConsenso?: string }) => {
      const risposta = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dati),
      });
      if (!risposta.ok) {
        const errore = await risposta.json();
        throw new Error(errore.errore || 'Errore nella creazione della segnalazione');
      }
      return risposta.json();
    },
    onSuccess: (data) => {
      if (data.segnalazioniSimili?.length > 0) {
        toast.warning('Segnalazioni simili rilevate', {
          description: `Ci sono ${data.segnalazioniSimili.length} segnalazione/i nella stessa zona.`,
          duration: 8000,
        });
        setSegnalazioniSimili(data.segnalazioniSimili);
      } else {
        toast.success('Segnalazione inviata con successo!', {
          description: 'Grazie per il tuo contributo alla comunità.',
        });
        setSegnalazioniSimili(null);
      }
      queryClient.invalidateQueries({ queryKey: ['segnalazioni'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
      reset();
      setPosizioneMappa(null);
      setAnteprimaFoto(null);
      setFotoBase64(null);
      setStepCorrente(1);
    },
    onError: (errore) => {
      toast.error('Errore nell\'invio della segnalazione', { description: errore.message });
    },
  });

  // Click mappa
  const gestisciClickMappa = useCallback(
    (lat: number, lng: number) => {
      setPosizioneMappa({ lat, lng });
      setValue('latitudine', lat, { shouldValidate: true });
      setValue('longitudine', lng, { shouldValidate: true });
    },
    [setValue],
  );

  // Upload foto
  const gestisciUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Immagine troppo grande', { description: 'La dimensione massima è 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAnteprimaFoto(base64);
      setFotoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Validazione per step
  const validaStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(['latitudine', 'longitudine']);
      case 2:
        return await trigger(['titolo', 'descrizione']);
      case 3:
        return await trigger(['nomeSegnalatore', 'cognomeSegnalatore', 'emailSegnalatore', 'telefonoSegnalatore']);
      case 4:
        return await trigger(['consensoPrivacy', 'consensoDichiarazione']);
      default:
        return true;
    }
  };

  const vaiAvanti = async () => {
    const valido = await validaStep(stepCorrente);
    if (valido && stepCorrente < 4) {
      setDirezione(1);
      setStepCorrente(stepCorrente + 1);
    }
  };

  const vaiIndietro = () => {
    if (stepCorrente > 1) {
      setDirezione(-1);
      setStepCorrente(stepCorrente - 1);
    }
  };

  const onSubmit = (dati: DatiSegnalazione) => {
    const datiCompleti = {
      ...dati,
      fotoUrl: fotoBase64 || undefined,
      dataConsenso: new Date().toISOString(),
    };
    creaSegnalazione.mutate(datiCompleti);
  };

  // Progresso
  const progresso = ((stepCorrente - 1) / 3) * 100;

  // Varianti animazione step
  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 80 : -80,
      opacity: 0,
    }),
  };

  return (
    <div className="container mx-auto px-4 space-y-0 pb-8 py-6">
      {/* Intestazione con indicatore step */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-50 -mx-6 -mt-2 px-6 py-5 border-b border-yellow-200/50">
        <h2 className="text-2xl font-bold text-yellow-800 mb-1">Nuova Segnalazione</h2>
        <p className="text-yellow-600 text-sm">
          Compila il form passo dopo passo per segnalare un animale randagio
        </p>

        {/* Indicatore step visuale */}
        <div className="mt-4 flex items-center gap-0">
          {stepsConfig.map((step, i) => {
            const StepIcon = step.icon;
            const completato = stepCorrente > step.num;
            const attivo = stepCorrente === step.num;
            return (
              <div key={step.num} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => {
                    if (completato) {
                      setDirezione(stepCorrente > step.num ? -1 : 1);
                      setStepCorrente(step.num);
                    }
                  }}
                  className={`flex items-center gap-2 group cursor-pointer ${completato ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    completato
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : attivo
                        ? 'bg-yellow-600 border-yellow-600 text-white shadow-md shadow-yellow-600/30'
                        : 'bg-white border-yellow-200 text-yellow-300'
                  }`}>
                    {completato ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline transition-colors ${
                    completato ? 'text-emerald-700' : attivo ? 'text-yellow-800' : 'text-yellow-400'
                  }`}>
                    {step.label}
                  </span>
                </button>
                {i < 3 && (
                  <div className="flex-1 mx-2">
                    <div className={`h-0.5 rounded-full transition-colors duration-300 ${
                      completato ? 'bg-emerald-400' : 'bg-yellow-200'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Barra di progresso */}
        <div className="mt-3">
          <Progress value={progresso} className="h-1.5 bg-yellow-200 [&>div]:bg-yellow-600" />
          <p className="text-xs text-yellow-500 mt-1">Passo {stepCorrente} di 4</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="mt-6">
        <AnimatePresence mode="wait" custom={direzione}>
          {/* ═══════════ STEP 1: POSIZIONE ═══════════ */}
          {stepCorrente === 1 && (
            <motion.div
              key="step-1"
              custom={direzione}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Card className="border-yellow-200/60 shadow-sm">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-yellow-800">Dove hai visto l&apos;animale?</CardTitle>
                      <CardDescription>Clicca sulla mappa per indicare la posizione esatta</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MappaSegnalaLeaflet
                    posizione={posizioneMappa}
                    onClickMappa={gestisciClickMappa}
                  />

                  {posizioneMappa ? (
                    <div className="flex items-center gap-4 text-sm bg-emerald-50 px-4 py-3 rounded-lg border border-emerald-200">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 font-mono text-xs">
                        LAT: <strong>{posizioneMappa.lat.toFixed(4)}</strong>
                      </span>
                      <span className="text-emerald-700 font-mono text-xs">
                        LNG: <strong>{posizioneMappa.lng.toFixed(4)}</strong>
                      </span>
                      <span className="text-emerald-600 text-xs ml-auto">Posizione selezionata</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-200">
                      <MapPin className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-700">Clicca sulla mappa per selezionare la posizione</span>
                    </div>
                  )}

                  <input type="hidden" {...register('latitudine', { valueAsNumber: true })} />
                  <input type="hidden" {...register('longitudine', { valueAsNumber: true })} />
                  {errors.latitudine && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {errors.latitudine.message}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="indirizzo" className="text-yellow-700">Indirizzo (opzionale)</Label>
                    <Input
                      id="indirizzo"
                      placeholder="es. Via Roma 15"
                      className="h-11 border-yellow-200 focus:border-yellow-500"
                      {...register('indirizzo')}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══════════ STEP 2: DETTAGLI ═══════════ */}
          {stepCorrente === 2 && (
            <motion.div
              key="step-2"
              custom={direzione}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Card className="border-yellow-200/60 shadow-sm">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 shrink-0">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-yellow-800">Descrivi la situazione</CardTitle>
                      <CardDescription>Raccontaci cosa hai visto, fornisci più dettagli possibile</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Tipo Animale */}
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Tipo di animale *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { valore: 'cane', emoji: '🐕', etichetta: 'Cane', icon: Dog, selezionato: tipoSelezionato === 'cane', coloreAttivo: 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-yellow-50 hover:border-yellow-200' },
                        { valore: 'gatto', emoji: '🐈', etichetta: 'Gatto', icon: Cat, selezionato: tipoSelezionato === 'gatto', coloreAttivo: 'bg-indigo-100 border-indigo-400 text-indigo-800 ring-2 ring-indigo-300', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200' },
                        { valore: 'altro', emoji: '🐾', etichetta: 'Altro', icon: PawPrint, selezionato: tipoSelezionato === 'altro', coloreAttivo: 'bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-300', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50 hover:border-slate-200' },
                      ].map((tipo) => {
                        const TipoIcon = tipo.icon;
                        return (
                          <button
                            key={tipo.valore}
                            type="button"
                            onClick={() => setValue('tipoAnimale', tipo.valore as DatiSegnalazione['tipoAnimale'], { shouldValidate: true })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${tipo.selezionato ? tipo.coloreAttivo : tipo.coloreNormale}`}
                          >
                            <span className="text-3xl">{tipo.emoji}</span>
                            <span className="text-sm font-semibold">{tipo.etichetta}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motivazione */}
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Motivazione della segnalazione *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { valore: 'randagismo', etichetta: 'Randagismo', icon: Search, selezionato: motivazioneSelezionata === 'randagismo', coloreAttivo: 'bg-yellow-100 border-yellow-400 text-yellow-800', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-yellow-50', desc: 'Animale senza padrone che vaga sul territorio' },
                        { valore: 'abbandono', etichetta: 'Abbandono', icon: Heart, selezionato: motivazioneSelezionata === 'abbandono', coloreAttivo: 'bg-red-100 border-red-400 text-red-800', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-red-50', desc: 'Animale abbandonato dal proprietario' },
                        { valore: 'maltrattamento', etichetta: 'Maltrattamento', icon: Siren, selezionato: motivazioneSelezionata === 'maltrattamento', coloreAttivo: 'bg-purple-100 border-purple-400 text-purple-800', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-purple-50', desc: 'Animale vittima di violenza o maltrattamento' },
                        { valore: 'smarrimento', etichetta: 'Smarrimento', icon: Eye, selezionato: motivazioneSelezionata === 'smarrimento', coloreAttivo: 'bg-sky-100 border-sky-400 text-sky-800', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-sky-50', desc: 'Animale domestico perso dal proprietario' },
                        { valore: 'rinvenimento', etichetta: 'Rinvenimento', icon: MapPin, selezionato: motivazioneSelezionata === 'rinvenimento', coloreAttivo: 'bg-teal-100 border-teal-400 text-teal-800', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-teal-50', desc: 'Animale trovato in un luogo specifico' },
                        { valore: 'altro', etichetta: 'Altro', icon: Sparkles, selezionato: motivazioneSelezionata === 'altro', coloreAttivo: 'bg-gray-100 border-gray-400 text-gray-800', coloreNormale: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50', desc: 'Altra motivazione non elencata' },
                      ].map((mot) => {
                        const MotIcon = mot.icon;
                        return (
                          <button
                            key={mot.valore}
                            type="button"
                            title={mot.desc}
                            onClick={() => setValue('motivazione', mot.valore as DatiSegnalazione['motivazione'], { shouldValidate: true })}
                            className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left ${mot.selezionato ? mot.coloreAttivo : mot.coloreNormale}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <MotIcon className="h-3.5 w-3.5" />
                              <span className="text-sm font-semibold">{mot.etichetta}</span>
                            </div>
                            <p className="text-[10px] opacity-70 leading-tight">{mot.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urgenza */}
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Livello di urgenza *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { valore: 'bassa', etichetta: 'Bassa', desc: 'Non è in pericolo', colore: urgenzaSelezionata === 'bassa' ? 'bg-green-100 border-green-400 text-green-900 ring-2 ring-green-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50', punto: 'bg-green-500' },
                        { valore: 'media', etichetta: 'Media', desc: 'Ha bisogno di aiuto', colore: urgenzaSelezionata === 'media' ? 'bg-yellow-100 border-yellow-400 text-yellow-900 ring-2 ring-yellow-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-yellow-50', punto: 'bg-yellow-500' },
                        { valore: 'alta', etichetta: 'Alta', desc: 'Situazione grave', colore: urgenzaSelezionata === 'alta' ? 'bg-orange-100 border-orange-400 text-orange-900 ring-2 ring-orange-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-orange-50', punto: 'bg-orange-500' },
                        { valore: 'critica', etichetta: 'Critica', desc: 'Pericolo di vita', colore: urgenzaSelezionata === 'critica' ? 'bg-red-100 border-red-400 text-red-900 ring-2 ring-red-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-red-50', punto: 'bg-red-500' },
                      ].map((urg) => (
                        <button
                          key={urg.valore}
                          type="button"
                          onClick={() => setValue('urgenza', urg.valore as DatiSegnalazione['urgenza'], { shouldValidate: true })}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center ${urg.colore}`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className={`h-3 w-3 rounded-full ${urg.punto}`} />
                            <span className="font-semibold">{urg.etichetta}</span>
                          </div>
                          <p className="text-[10px] opacity-70">{urg.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Titolo e Descrizione */}
                  <div className="space-y-2">
                    <Label htmlFor="titolo" className="text-yellow-700 font-medium">Titolo segnalazione *</Label>
                    <Input
                      id="titolo"
                      placeholder="es. Animale randagio vicino alla piazza"
                      className={`h-11 border-yellow-200 focus:border-yellow-500 ${errors.titolo ? 'border-red-500' : ''}`}
                      {...register('titolo')}
                    />
                    {errors.titolo && <p className="text-sm text-red-500">{errors.titolo.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descrizione" className="text-yellow-700 font-medium">Descrizione *</Label>
                    <Textarea
                      id="descrizione"
                      placeholder="Descrivi la situazione: dove si trova l'animale, le sue condizioni, il comportamento..."
                      rows={4}
                      className={`border-yellow-200 focus:border-yellow-500 min-h-[100px] ${errors.descrizione ? 'border-red-500' : ''}`}
                      {...register('descrizione')}
                    />
                    {errors.descrizione && <p className="text-sm text-red-500">{errors.descrizione.message}</p>}
                  </div>

                  {/* Dettagli animale */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="razza" className="text-yellow-700">Razza/Tipo</Label>
                      <Input id="razza" placeholder="es. Meticcio, Soriano..." className="h-11 border-yellow-200 focus:border-yellow-500" {...register('razza')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="colore" className="text-yellow-700">Colore</Label>
                      <Input id="colore" placeholder="es. Marrone, Nero..." className="h-11 border-yellow-200 focus:border-yellow-500" {...register('colore')} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-yellow-700">Taglia</Label>
                      <Select onValueChange={(valore) => setValue('taglia', valore as DatiSegnalazione['taglia'])}>
                        <SelectTrigger className="h-11 border-yellow-200 focus:border-yellow-500">
                          <SelectValue placeholder="Seleziona taglia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piccola">Piccola (fino a 10kg)</SelectItem>
                          <SelectItem value="media">Media (10-25kg)</SelectItem>
                          <SelectItem value="grande">Grande (oltre 25kg)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Upload foto multimedia */}
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium flex items-center gap-1.5">
                      <Camera className="h-4 w-4" />
                      Aggiungi una foto (opzionale, max 5MB)
                    </Label>
                    {!anteprimaFoto ? (
                      <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-yellow-200 rounded-xl bg-yellow-50/30 hover:bg-yellow-50 cursor-pointer transition-all hover:border-yellow-400">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                          <Upload className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-yellow-700">Clicca per caricare una foto</p>
                          <p className="text-xs text-yellow-500 mt-0.5">oppure trascina qui l&apos;immagine</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={gestisciUploadFoto} />
                      </label>
                    ) : (
                      <div className="relative inline-block">
                        <img
                          src={anteprimaFoto}
                          alt="Anteprima foto animale"
                          className="h-32 w-32 object-cover rounded-xl border-2 border-yellow-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => { setAnteprimaFoto(null); setFotoBase64(null); }}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                          <FileImage className="h-3 w-3" />
                          <span>Foto caricata</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══════════ STEP 3: I TUOI DATI ═══════════ */}
          {stepCorrente === 3 && (
            <motion.div
              key="step-3"
              custom={direzione}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Card className="border-yellow-200/60 shadow-sm">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 text-sky-600 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-yellow-800">I Tuoi Dati Personali</CardTitle>
                      <CardDescription>Servono per poterti contattare se necessario. I tuoi dati sono protetti dal GDPR.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeSegnalatore" className="text-yellow-700 font-medium">Nome *</Label>
                      <Input
                        id="nomeSegnalatore"
                        placeholder="Il tuo nome"
                        className={`h-11 border-yellow-200 focus:border-yellow-500 ${errors.nomeSegnalatore ? 'border-red-500' : ''}`}
                        {...register('nomeSegnalatore')}
                      />
                      {errors.nomeSegnalatore && <p className="text-sm text-red-500">{errors.nomeSegnalatore.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cognomeSegnalatore" className="text-yellow-700 font-medium">Cognome *</Label>
                      <Input
                        id="cognomeSegnalatore"
                        placeholder="Il tuo cognome"
                        className={`h-11 border-yellow-200 focus:border-yellow-500 ${errors.cognomeSegnalatore ? 'border-red-500' : ''}`}
                        {...register('cognomeSegnalatore')}
                      />
                      {errors.cognomeSegnalatore && <p className="text-sm text-red-500">{errors.cognomeSegnalatore.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailSegnalatore" className="text-yellow-700 font-medium">Email *</Label>
                      <Input
                        id="emailSegnalatore"
                        type="email"
                        placeholder="la.tua@email.it"
                        className={`h-11 border-yellow-200 focus:border-yellow-500 ${errors.emailSegnalatore ? 'border-red-500' : ''}`}
                        {...register('emailSegnalatore')}
                      />
                      {errors.emailSegnalatore && <p className="text-sm text-red-500">{errors.emailSegnalatore.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefonoSegnalatore" className="text-yellow-700 font-medium">Telefono *</Label>
                      <Input
                        id="telefonoSegnalatore"
                        placeholder="333 1234567"
                        className={`h-11 border-yellow-200 focus:border-yellow-500 ${errors.telefonoSegnalatore ? 'border-red-500' : ''}`}
                        {...register('telefonoSegnalatore')}
                      />
                      {errors.telefonoSegnalatore && <p className="text-sm text-red-500">{errors.telefonoSegnalatore.message}</p>}
                    </div>
                  </div>

                  {/* Info privacy */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 border border-sky-200">
                    <Shield className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-sky-700 leading-relaxed">
                      I tuoi dati personali saranno trattati nel rispetto del Regolamento (UE) 2016/679 (GDPR).
                      Non saranno comunicati a terzi senza il tuo consenso esplicito.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══════════ STEP 4: CONSENSI ═══════════ */}
          {stepCorrente === 4 && (
            <motion.div
              key="step-4"
              custom={direzione}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Card className="border-yellow-200/60 shadow-sm">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-yellow-800">Informativa e Consensi</CardTitle>
                      <CardDescription>Leggi e accetta i documenti obbligatori per procedere</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Informativa Privacy GDPR */}
                  <div className="space-y-3 p-4 rounded-xl bg-red-50/50 border border-red-100 border-l-4 border-l-red-500">
                    <div className="flex items-center gap-2 text-red-800 font-medium">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Informativa sulla Privacy e Trattamento dei Dati *</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ai sensi del Regolamento (UE) 2016/679 (GDPR), acconsento al trattamento dei miei dati personali per le finalità di gestione delle segnalazioni di animali randagi. I dati saranno trattati nel rispetto della normativa vigente e non saranno comunicati a terzi senza il mio consenso.
                    </p>
                    <div className="flex items-start gap-3">
                      <Controller
                        name="consensoPrivacy"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="consensoPrivacy"
                            checked={field.value as boolean}
                            onCheckedChange={(checked) => field.onChange(checked)}
                            className="mt-0.5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 cursor-pointer"
                          />
                        )}
                      />
                      <Label htmlFor="consensoPrivacy" dangerouslySetInnerHTML={{ __html: 'Ho letto e accetto la <a href="/privacy-policy" target="_blank" class="text-primary hover:underline font-medium">Privacy Policy</a> *' }} />
                    {errors.consensoPrivacy && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Shield className="h-3 w-3" />{errors.consensoPrivacy.message}
                      </p>
                    )}
                  </div>

                  {/* Dichiarazione di Responsabilità */}
                  <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 border border-sky-100 border-l-4 border-l-sky-600">
                    <div className="flex items-center gap-2 text-sky-800 font-medium">
                      <Lock className="h-4 w-4 text-sky-600" />
                      <span className="text-sm">Dichiarazione di Responsabilità *</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Consapevole delle sanzioni penali previste dall&apos;art. 76 del D.P.R. 445/2000 per le ipotesi di falsità in atti e dichiarazioni mendaci, dichiaro che le informazioni fornite nella presente segnalazione corrispondono a verità. Dichiaro inoltre di essere consapevole che la presentazione di segnalazioni falsamente rappresentate o dolosamente mendaci potrà comportare l&apos;adozione di provvedimenti da parte dell&apos;Autorità competente.
                    </p>
                    <div className="flex items-start gap-3">
                      <Controller
                        name="consensoDichiarazione"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="consensoDichiarazione"
                            checked={field.value as boolean}
                            onCheckedChange={(checked) => field.onChange(checked)}
                            className="mt-0.5 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600 cursor-pointer"
                          />
                        )}
                      />
                      <Label htmlFor="consensoDichiarazione" dangerouslySetInnerHTML={{ __html: 'Ho letto e accetto la <a href="/privacy-policy" target="_blank" class="text-primary hover:underline font-medium">Privacy Policy</a> *' }}>
                        Ho letto e accetto la dichiarazione di responsabilità *
                      </Label>
                    </div>
                    {errors.consensoDichiarazione && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />{errors.consensoDichiarazione.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottoni di navigazione step ── */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={vaiIndietro}
            disabled={stepCorrente === 1}
            className={`border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition-all cursor-pointer ${stepCorrente === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Indietro
          </Button>

          <div className="flex items-center gap-1.5">
            {stepsConfig.map((s) => (
              <div
                key={s.num}
                className={`h-2 rounded-full transition-all duration-300 ${
                  stepCorrente === s.num ? 'w-6 bg-yellow-600' : stepCorrente > s.num ? 'w-2 bg-emerald-500' : 'w-2 bg-yellow-200'
                }`}
              />
            ))}
          </div>

          {stepCorrente < 4 ? (
            <Button
              type="button"
              onClick={vaiAvanti}
              className="bg-yellow-600 hover:bg-yellow-700 text-white min-w-[160px] shadow-md shadow-yellow-600/20 transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              Avanti
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={creaSegnalazione.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px] shadow-md shadow-emerald-600/20 transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              {creaSegnalazione.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio in corso...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Invia Segnalazione</>
              )}
            </Button>
          )}
        </div>

        {/* Segnalazioni simili */}
        {segnalazioniSimili && segnalazioniSimili.length > 0 && (
          <Card className="border-yellow-400/60 bg-yellow-50 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Segnalazioni simili rilevate
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Ci sono {segnalazioniSimili.length} segnalazione/i entro 200m dalla tua posizione.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {segnalazioniSimili.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-100/60 border border-yellow-200">
                    <span className="text-sm text-yellow-800 font-medium truncate">{seg.titolo}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-yellow-600 font-mono">{Math.round(seg.distanza * 1000)}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
