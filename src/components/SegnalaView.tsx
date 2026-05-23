// Vista Segnala - Form per l'invio di una nuova segnalazione di animale randagio
// Include consensi GDPR obbligatori e mappa Leaflet interattiva
// Struttura a step numerati con styling consistente

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
import { MapPin, Upload, Loader2, Send, ClipboardList, X, Shield, Lock, User, FileText, AlertTriangle } from 'lucide-react';

// Coordinate di Naro, Sicilia
const NARO_LAT = 37.2964;
const NARO_LNG = 13.7764;

// Importazione dinamica del componente mappa Leaflet per il form
const MappaSegnalaLeaflet = dynamic(() => import('./MappaSegnalaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center bg-amber-50 rounded-lg border border-amber-200">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
        <p className="text-amber-600 text-sm">Caricamento mappa...</p>
      </div>
    </div>
  ),
});

// Schema di validazione con Zod
const segnalazioneSchema = z.object({
  titolo: z.string().min(3, 'Il titolo deve avere almeno 3 caratteri'),
  descrizione: z.string().min(10, 'La descrizione deve avere almeno 10 caratteri'),
  latitudine: z.number({ required_error: 'Seleziona un punto sulla mappa' }).min(-90).max(90),
  longitudine: z.number({ required_error: 'Seleziona un punto sulla mappa' }).min(-180).max(180),
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
  consensoPrivacy: z.literal(true, { errorMap: () => ({ message: 'Devi accettare l\'informativa sulla privacy' }) }),
  consensoDichiarazione: z.literal(true, { errorMap: () => ({ message: 'Devi accettare la dichiarazione di responsabilità' }) }),
});

type DatiSegnalazione = z.infer<typeof segnalazioneSchema>;

// Componente Step Header con numero e icona
function StepHeader({ numero, icona: Icona, titolo, descrizione }: { numero: number; icona: React.ElementType; titolo: string; descrizione?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-600 text-white font-bold text-lg shrink-0 shadow-md shadow-amber-600/30">
        {numero}
      </div>
      <div className="pt-1">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
          <Icona className="h-5 w-5 text-amber-600" />
          {titolo}
        </CardTitle>
        {descrizione && (
          <CardDescription className="mt-0.5">
            {descrizione}
          </CardDescription>
        )}
      </div>
    </div>
  );
}

export default function SegnalaView() {
  const queryClient = useQueryClient();
  const [posizioneMappa, setPosizioneMappa] = useState<{ lat: number; lng: number } | null>(null);
  const [anteprimaFoto, setAnteprimaFoto] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [segnalazioniSimili, setSegnalazioniSimili] = useState<Array<{
    id: string;
    titolo: string;
    urgenza: string;
    stato: string;
    distanza: number;
    createdAt: string;
  }> | null>(null);

  // Configurazione del form con react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<DatiSegnalazione>({
    resolver: zodResolver(segnalazioneSchema),
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

  // Mutazione per creare una segnalazione
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
      if (data.segnalazioniSimili && data.segnalazioniSimili.length > 0) {
        toast.warning('Segnalazioni simili rilevate', {
          description: `Ci sono ${data.segnalazioniSimili.length} segnalazione/i nella stessa zona. Potrebbe trattarsi dello stesso animale.`,
          duration: 8000,
        });
        setSegnalazioniSimili(data.segnalazioniSimili);
      } else {
        toast.success('Segnalazione inviata con successo!', {
          description: 'Grazie per il tuo contributo alla comunità di Naro.',
        });
        setSegnalazioniSimili(null);
      }
      queryClient.invalidateQueries({ queryKey: ['segnalazioni'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
      reset();
      setPosizioneMappa(null);
      setAnteprimaFoto(null);
      setFotoBase64(null);
    },
    onError: (errore) => {
      toast.error('Errore nell\'invio della segnalazione', {
        description: errore.message,
      });
    },
  });

  // Gestione click sulla mappa Leaflet
  const gestisciClickMappa = useCallback(
    (lat: number, lng: number) => {
      setPosizioneMappa({ lat, lng });
      setValue('latitudine', lat, { shouldValidate: true });
      setValue('longitudine', lng, { shouldValidate: true });
    },
    [setValue]
  );

  // Gestione upload foto
  const gestisciUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Immagine troppo grande', {
        description: 'La dimensione massima consentita è 5MB.',
      });
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

  // Invio del form
  const onSubmit = (dati: DatiSegnalazione) => {
    const datiCompleti = {
      ...dati,
      fotoUrl: fotoBase64 || undefined,
      dataConsenso: new Date().toISOString(),
    };
    creaSegnalazione.mutate(datiCompleti);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Intestazione */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 -mx-6 -mt-2 px-6 py-5 border-b border-amber-200/50">
        <h2 className="text-2xl font-bold text-amber-800">Nuova Segnalazione</h2>
        <p className="text-amber-600 mt-1">
          Compila il form per segnalare un animale randagio nel territorio di Naro
        </p>
        {/* Indicatore step */}
        <div className="flex items-center gap-2 mt-3">
          {[
            { num: 1, label: 'Posizione' },
            { num: 2, label: 'Dettagli' },
            { num: 3, label: 'I Tuoi Dati' },
            { num: 4, label: 'Consenso' },
          ].map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold">
                  {step.num}
                </span>
                <span className="text-xs text-amber-700 font-medium hidden sm:inline">{step.label}</span>
              </div>
              {i < 3 && (
                <div className="w-6 h-px bg-amber-300 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Posizione */}
        <Card className="border-amber-200/60 shadow-sm">
          <CardHeader>
            <StepHeader
              numero={1}
              icona={MapPin}
              titolo="Posizione"
              descrizione="Clicca sulla mappa per indicare dove hai visto l'animale"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mappa Leaflet */}
            <MappaSegnalaLeaflet
              posizione={posizioneMappa}
              onClickMappa={gestisciClickMappa}
            />

            {/* Coordinate visualizzate */}
            {posizioneMappa && (
              <div className="flex items-center gap-4 text-sm bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <span className="text-amber-700 font-mono text-xs">
                  LAT: <strong>{posizioneMappa.lat.toFixed(4)}</strong>
                </span>
                <span className="text-amber-700 font-mono text-xs">
                  LNG: <strong>{posizioneMappa.lng.toFixed(4)}</strong>
                </span>
              </div>
            )}

            {/* Campi nascosti per lat/lng */}
            <input type="hidden" {...register('latitudine', { valueAsNumber: true })} />
            <input type="hidden" {...register('longitudine', { valueAsNumber: true })} />
            {errors.latitudine && (
              <p className="text-sm text-red-500">{errors.latitudine.message}</p>
            )}

            {/* Campo indirizzo */}
            <div className="space-y-2">
              <Label htmlFor="indirizzo" className="text-amber-700">Indirizzo (opzionale)</Label>
              <Input
                id="indirizzo"
                placeholder="es. Via Roma 15, Naro"
                className="border-amber-200 focus:border-amber-500 h-11"
                {...register('indirizzo')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Dettagli Segnalazione */}
        <Card className="border-amber-200/60 shadow-sm">
          <CardHeader>
            <StepHeader
              numero={2}
              icona={ClipboardList}
              titolo="Dettagli Segnalazione"
              descrizione="Descrivi l'animale e la situazione che hai osservato"
            />
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Titolo segnalazione */}
            <div className="space-y-2">
              <Label htmlFor="titolo" className="text-amber-700 font-medium">Titolo segnalazione *</Label>
              <Input
                id="titolo"
                placeholder="es. Animale randagio vicino alla piazza"
                className={`h-11 border-amber-200 focus:border-amber-500 ${errors.titolo ? 'border-red-500' : ''}`}
                {...register('titolo')}
              />
              {errors.titolo && (
                <p className="text-sm text-red-500">{errors.titolo.message}</p>
              )}
            </div>

            {/* Descrizione */}
            <div className="space-y-2">
              <Label htmlFor="descrizione" className="text-amber-700 font-medium">Descrizione *</Label>
              <Textarea
                id="descrizione"
                placeholder="Descrivi la situazione: dove si trova l'animale, le sue condizioni, il comportamento..."
                rows={5}
                className={`border-amber-200 focus:border-amber-500 min-h-[120px] ${errors.descrizione ? 'border-red-500' : ''}`}
                {...register('descrizione')}
              />
              {errors.descrizione && (
                <p className="text-sm text-red-500">{errors.descrizione.message}</p>
              )}
            </div>

            {/* Tipo Animale */}
            <div className="space-y-2">
              <Label className="text-amber-700 font-medium">Tipo di animale *</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { valore: 'cane', emoji: '🐕', etichetta: 'Cane', colore: tipoSelezionato === 'cane' ? 'bg-orange-100 border-orange-400 text-orange-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-orange-50' },
                  { valore: 'gatto', emoji: '🐈', etichetta: 'Gatto', colore: tipoSelezionato === 'gatto' ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-indigo-50' },
                  { valore: 'altro', emoji: '🐾', etichetta: 'Altro', colore: tipoSelezionato === 'altro' ? 'bg-slate-100 border-slate-400 text-slate-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-slate-50' },
                ].map((tipo) => (
                  <button
                    key={tipo.valore}
                    type="button"
                    onClick={() => setValue('tipoAnimale', tipo.valore as DatiSegnalazione['tipoAnimale'], { shouldValidate: true })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${tipo.colore}`}
                  >
                    <span className="text-2xl">{tipo.emoji}</span>
                    <span className="text-sm font-medium">{tipo.etichetta}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Motivazione */}
            <div className="space-y-2">
              <Label className="text-amber-700 font-medium">Motivazione *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { valore: 'randagismo', etichetta: 'Randagismo', colore: motivazioneSelezionata === 'randagismo' ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50', tooltip: 'Animale senza padrone che vaga sul territorio' },
                  { valore: 'abbandono', etichetta: 'Abbandono', colore: motivazioneSelezionata === 'abbandono' ? 'bg-red-100 border-red-400 text-red-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-red-50', tooltip: 'Animale abbandonato dal proprietario' },
                  { valore: 'maltrattamento', etichetta: 'Maltrattamento', colore: motivazioneSelezionata === 'maltrattamento' ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-purple-50', tooltip: 'Animale vittima di violenza o maltrattamento' },
                  { valore: 'smarrimento', etichetta: 'Smarrimento', colore: motivazioneSelezionata === 'smarrimento' ? 'bg-sky-100 border-sky-400 text-sky-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-sky-50', tooltip: 'Animale domestico che ha perso il proprietario' },
                  { valore: 'rinvenimento', etichetta: 'Rinvenimento', colore: motivazioneSelezionata === 'rinvenimento' ? 'bg-teal-100 border-teal-400 text-teal-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-teal-50', tooltip: 'Animale trovato in un luogo specifico' },
                  { valore: 'altro', etichetta: 'Altro', colore: motivazioneSelezionata === 'altro' ? 'bg-gray-100 border-gray-400 text-gray-800 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-gray-50', tooltip: 'Altra motivazione non elencata' },
                ].map((mot) => (
                  <button
                    key={mot.valore}
                    type="button"
                    title={mot.tooltip}
                    onClick={() => setValue('motivazione', mot.valore as DatiSegnalazione['motivazione'], { shouldValidate: true })}
                    className={`p-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${mot.colore}`}
                  >
                    {mot.etichetta}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgenza - Grid di pulsanti colorati */}
            <div className="space-y-2">
              <Label className="text-amber-700 font-medium">Livello di urgenza *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { valore: 'bassa', etichetta: 'Bassa', colore: urgenzaSelezionata === 'bassa' ? 'bg-green-200 border-green-500 text-green-900 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-green-50', punto: 'bg-green-500' },
                  { valore: 'media', etichetta: 'Media', colore: urgenzaSelezionata === 'media' ? 'bg-yellow-200 border-yellow-500 text-yellow-900 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-yellow-50', punto: 'bg-yellow-500' },
                  { valore: 'alta', etichetta: 'Alta', colore: urgenzaSelezionata === 'alta' ? 'bg-orange-200 border-orange-500 text-orange-900 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-orange-50', punto: 'bg-orange-500' },
                  { valore: 'critica', etichetta: 'Critica', colore: urgenzaSelezionata === 'critica' ? 'bg-red-200 border-red-500 text-red-900 shadow-sm' : 'bg-white border-amber-200 text-amber-700 hover:bg-red-50', punto: 'bg-red-500' },
                ].map((urg) => (
                  <button
                    key={urg.valore}
                    type="button"
                    onClick={() => setValue('urgenza', urg.valore as DatiSegnalazione['urgenza'], { shouldValidate: true })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 font-medium ${urg.colore}`}
                  >
                    <span className={`h-3 w-3 rounded-full ${urg.punto}`} />
                    {urg.etichetta}
                  </button>
                ))}
              </div>
            </div>

            {/* Griglia dettagli segnalazione */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Razza/Tipo */}
              <div className="space-y-2">
                <Label htmlFor="razza" className="text-amber-700">Razza/Tipo (opzionale)</Label>
                <Input
                  id="razza"
                  placeholder="es. Meticcio, Soriano..."
                  className="h-11 border-amber-200 focus:border-amber-500"
                  {...register('razza')}
                />
              </div>

              {/* Colore */}
              <div className="space-y-2">
                <Label htmlFor="colore" className="text-amber-700">Colore (opzionale)</Label>
                <Input
                  id="colore"
                  placeholder="es. Marrone, Nero..."
                  className="h-11 border-amber-200 focus:border-amber-500"
                  {...register('colore')}
                />
              </div>

              {/* Taglia */}
              <div className="space-y-2">
                <Label className="text-amber-700">Taglia (opzionale)</Label>
                <Select
                  onValueChange={(valore) =>
                    setValue('taglia', valore as DatiSegnalazione['taglia'])
                  }
                >
                  <SelectTrigger className="h-11 border-amber-200 focus:border-amber-500">
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

            {/* Upload foto */}
            <div className="space-y-2">
              <Label className="text-amber-700">Foto (opzionale, max 5MB)</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors bg-amber-50/50">
                  <Upload className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 font-medium">Carica foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={gestisciUploadFoto}
                  />
                </label>
                {anteprimaFoto && (
                  <div className="relative">
                    <img
                      src={anteprimaFoto}
                      alt="Anteprima foto animale"
                      className="h-20 w-20 object-cover rounded-lg border border-amber-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAnteprimaFoto(null);
                        setFotoBase64(null);
                      }}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: I Tuoi Dati */}
        <Card className="border-amber-200/60 shadow-sm">
          <CardHeader>
            <StepHeader
              numero={3}
              icona={User}
              titolo="I Tuoi Dati"
              descrizione="Informazioni per poterti contattare se necessario. I tuoi dati saranno trattati nel rispetto della privacy."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nomeSegnalatore" className="text-amber-700 font-medium">Nome *</Label>
                <Input
                  id="nomeSegnalatore"
                  placeholder="Il tuo nome"
                  className={`h-11 border-amber-200 focus:border-amber-500 ${errors.nomeSegnalatore ? 'border-red-500' : ''}`}
                  {...register('nomeSegnalatore')}
                />
                {errors.nomeSegnalatore && (
                  <p className="text-sm text-red-500">{errors.nomeSegnalatore.message}</p>
                )}
              </div>

              {/* Cognome */}
              <div className="space-y-2">
                <Label htmlFor="cognomeSegnalatore" className="text-amber-700 font-medium">Cognome *</Label>
                <Input
                  id="cognomeSegnalatore"
                  placeholder="Il tuo cognome"
                  className={`h-11 border-amber-200 focus:border-amber-500 ${errors.cognomeSegnalatore ? 'border-red-500' : ''}`}
                  {...register('cognomeSegnalatore')}
                />
                {errors.cognomeSegnalatore && (
                  <p className="text-sm text-red-500">{errors.cognomeSegnalatore.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="emailSegnalatore" className="text-amber-700 font-medium">Email *</Label>
                <Input
                  id="emailSegnalatore"
                  type="email"
                  placeholder="la.tua@email.it"
                  className={`h-11 border-amber-200 focus:border-amber-500 ${errors.emailSegnalatore ? 'border-red-500' : ''}`}
                  {...register('emailSegnalatore')}
                />
                {errors.emailSegnalatore && (
                  <p className="text-sm text-red-500">{errors.emailSegnalatore.message}</p>
                )}
              </div>

              {/* Telefono */}
              <div className="space-y-2">
                <Label htmlFor="telefonoSegnalatore" className="text-amber-700 font-medium">Telefono *</Label>
                <Input
                  id="telefonoSegnalatore"
                  placeholder="333 1234567"
                  className={`h-11 border-amber-200 focus:border-amber-500 ${errors.telefonoSegnalatore ? 'border-red-500' : ''}`}
                  {...register('telefonoSegnalatore')}
                />
                {errors.telefonoSegnalatore && (
                  <p className="text-sm text-red-500">{errors.telefonoSegnalatore.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Informativa Privacy e Dichiarazione */}
        <Card className="border-amber-200/60 shadow-sm">
          <CardHeader>
            <StepHeader
              numero={4}
              icona={Shield}
              titolo="Informativa e Consensi"
              descrizione="Leggi e accetta i documenti obbligatori per procedere"
            />
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Informativa Privacy GDPR */}
            <div className="space-y-3 p-4 rounded-lg bg-red-50/50 border border-red-100 border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 text-red-800 font-medium">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-sm">Informativa sulla Privacy e Trattamento dei Dati *</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ai sensi del Regolamento (UE) 2016/679 (GDPR), acconsento al trattamento dei miei dati personali per le finalità di gestione delle segnalazioni di animali randagi nel territorio del Comune di Naro. I dati saranno trattati nel rispetto della normativa vigente e non saranno comunicati a terzi senza il mio consenso.
              </p>
              <div className="flex items-start gap-3">
                <Controller
                  name="consensoPrivacy"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="consensoPrivacy"
                      checked={field.value as boolean}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                      }}
                      className="mt-0.5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                  )}
                />
                <Label htmlFor="consensoPrivacy" className="text-sm text-gray-700 cursor-pointer leading-snug">
                  Ho letto e accetto l&apos;informativa sulla privacy *
                </Label>
              </div>
              {errors.consensoPrivacy && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {errors.consensoPrivacy.message}
                </p>
              )}
            </div>

            {/* Dichiarazione di Responsabilità */}
            <div className="space-y-3 p-4 rounded-lg bg-sky-50/50 border border-sky-100 border-l-4 border-l-sky-600">
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
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                      }}
                      className="mt-0.5 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                    />
                  )}
                />
                <Label htmlFor="consensoDichiarazione" className="text-sm text-gray-700 cursor-pointer leading-snug">
                  Ho letto e accetto la dichiarazione di responsabilità *
                </Label>
              </div>
              {errors.consensoDichiarazione && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {errors.consensoDichiarazione.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pulsante di invio */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={creaSegnalazione.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[220px] h-12 text-base shadow-md shadow-amber-600/20 transition-all duration-300 hover:shadow-lg hover:shadow-amber-600/30"
          >
            {creaSegnalazione.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Invia Segnalazione
              </>
            )}
          </Button>
        </div>

        {/* ─── Avviso segnalazioni simili ──────────────────────────────── */}
        {segnalazioniSimili && segnalazioniSimili.length > 0 && (
          <Card className="border-yellow-400/60 bg-yellow-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Segnalazioni simili rilevate
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Ci sono {segnalazioniSimili.length} segnalazione/i entro 200m dalla tua posizione. Potrebbe trattarsi dello stesso animale.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {segnalazioniSimili.map((seg) => (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-100/60 border border-yellow-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm text-yellow-800 font-medium truncate">{seg.titolo}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-yellow-600 font-mono">
                        {Math.round(seg.distanza * 1000)}m
                      </span>
                      <span className="text-xs text-yellow-500">
                        {new Date(seg.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-600 mt-3">
                La tua segnalazione è stata comunque registrata. Gli operatori valuteranno se si tratta di un duplicato.
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
