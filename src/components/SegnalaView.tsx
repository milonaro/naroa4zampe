// Vista Segnala - Form per l'invio di una nuova segnalazione di cane randagio
// Include consensi GDPR obbligatori e mappa Leaflet interattiva

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
import { MapPin, Upload, Loader2, Send, Dog, X, Shield, Lock } from 'lucide-react';

// Coordinate di Naro, Sicilia
const NARO_LAT = 37.2964;
const NARO_LNG = 13.7764;

// Importazione dinamica del componente mappa Leaflet per il form
const MappaSegnalaLeaflet = dynamic(() => import('./MappaSegnalaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-gray-900 rounded-lg">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-400/70 text-xs font-mono">Caricamento mappa...</p>
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
  urgenza: z.enum(['bassa', 'media', 'alta', 'critica']).default('media'),
  nomeSegnalatore: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  cognomeSegnalatore: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  emailSegnalatore: z.string().email('Inserisci un indirizzo email valido'),
  telefonoSegnalatore: z.string().min(1, 'Il telefono è obbligatorio'),
  consensoPrivacy: z.literal(true, { errorMap: () => ({ message: 'Devi accettare l\'informativa sulla privacy' }) }),
  consensoDichiarazione: z.literal(true, { errorMap: () => ({ message: 'Devi accettare la dichiarazione di responsabilità' }) }),
});

type DatiSegnalazione = z.infer<typeof segnalazioneSchema>;

export default function SegnalaView() {
  const queryClient = useQueryClient();
  const [posizioneMappa, setPosizioneMappa] = useState<{ lat: number; lng: number } | null>(null);
  const [anteprimaFoto, setAnteprimaFoto] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

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
      urgenza: 'media',
      latitudine: 0,
      longitudine: 0,
      consensoPrivacy: false as unknown as true,
      consensoDichiarazione: false as unknown as true,
    },
  });

  const urgenzaSelezionata = watch('urgenza');

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
    onSuccess: () => {
      toast.success('Segnalazione inviata con successo!', {
        description: 'Grazie per il tuo contributo alla comunità di Naro.',
      });
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
      <div>
        <h2 className="text-2xl font-bold text-amber-800">Nuova Segnalazione</h2>
        <p className="text-amber-600 mt-1">
          Compila il form per segnalare un cane randagio nel territorio di Naro
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Sezione Posizione */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <MapPin className="h-5 w-5 text-amber-600" />
              Posizione
            </CardTitle>
            <CardDescription>
              Clicca sulla mappa per indicare dove hai visto il cane randagio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mappa Leaflet */}
            <MappaSegnalaLeaflet
              posizione={posizioneMappa}
              onClickMappa={gestisciClickMappa}
            />

            {/* Coordinate visualizzate */}
            {posizioneMappa && (
              <div className="flex items-center gap-4 text-sm bg-gray-900 px-3 py-2 rounded-lg">
                <span className="text-emerald-400 font-mono text-xs">
                  LAT: <strong>{posizioneMappa.lat.toFixed(4)}</strong>
                </span>
                <span className="text-emerald-400 font-mono text-xs">
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
                className="border-amber-200 focus:border-amber-500"
                {...register('indirizzo')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sezione Dettagli del Cane */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <Dog className="h-5 w-5 text-amber-600" />
              Dettagli del Cane
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titolo segnalazione */}
            <div className="space-y-2">
              <Label htmlFor="titolo" className="text-amber-700">Titolo segnalazione *</Label>
              <Input
                id="titolo"
                placeholder="es. Cane randagio vicino alla piazza"
                className={`border-amber-200 focus:border-amber-500 ${errors.titolo ? 'border-red-500' : ''}`}
                {...register('titolo')}
              />
              {errors.titolo && (
                <p className="text-sm text-red-500">{errors.titolo.message}</p>
              )}
            </div>

            {/* Descrizione */}
            <div className="space-y-2">
              <Label htmlFor="descrizione" className="text-amber-700">Descrizione *</Label>
              <Textarea
                id="descrizione"
                placeholder="Descrivi la situazione: dove si trova il cane, le sue condizioni, il comportamento..."
                rows={4}
                className={`border-amber-200 focus:border-amber-500 ${errors.descrizione ? 'border-red-500' : ''}`}
                {...register('descrizione')}
              />
              {errors.descrizione && (
                <p className="text-sm text-red-500">{errors.descrizione.message}</p>
              )}
            </div>

            {/* Urgenza */}
            <div className="space-y-2">
              <Label className="text-amber-700">Livello di urgenza *</Label>
              <Select
                value={urgenzaSelezionata}
                onValueChange={(valore) =>
                  setValue('urgenza', valore as DatiSegnalazione['urgenza'], { shouldValidate: true })
                }
              >
                <SelectTrigger className="border-amber-200 focus:border-amber-500">
                  <SelectValue placeholder="Seleziona urgenza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" /> Bassa
                    </span>
                  </SelectItem>
                  <SelectItem value="media">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" /> Media
                    </span>
                  </SelectItem>
                  <SelectItem value="alta">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> Alta
                    </span>
                  </SelectItem>
                  <SelectItem value="critica">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Critica
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Griglia dettagli cane */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Razza */}
              <div className="space-y-2">
                <Label htmlFor="razza" className="text-amber-700">Razza (opzionale)</Label>
                <Input
                  id="razza"
                  placeholder="es. Meticcio, Labrador..."
                  className="border-amber-200 focus:border-amber-500"
                  {...register('razza')}
                />
              </div>

              {/* Colore */}
              <div className="space-y-2">
                <Label htmlFor="colore" className="text-amber-700">Colore (opzionale)</Label>
                <Input
                  id="colore"
                  placeholder="es. Marrone, Nero..."
                  className="border-amber-200 focus:border-amber-500"
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
                  <SelectTrigger className="border-amber-200 focus:border-amber-500">
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
                <label className="flex items-center gap-2 px-4 py-2 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                  <Upload className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700">Carica foto</span>
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
                      alt="Anteprima foto cane"
                      className="h-16 w-16 object-cover rounded-lg border border-amber-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAnteprimaFoto(null);
                        setFotoBase64(null);
                      }}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sezione Dati Segnalatore */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-amber-800">I Tuoi Dati</CardTitle>
            <CardDescription>
              Informazioni per poterti contattare se necessario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nomeSegnalatore" className="text-amber-700">Nome *</Label>
                <Input
                  id="nomeSegnalatore"
                  placeholder="Il tuo nome"
                  className={`border-amber-200 focus:border-amber-500 ${errors.nomeSegnalatore ? 'border-red-500' : ''}`}
                  {...register('nomeSegnalatore')}
                />
                {errors.nomeSegnalatore && (
                  <p className="text-sm text-red-500">{errors.nomeSegnalatore.message}</p>
                )}
              </div>

              {/* Cognome */}
              <div className="space-y-2">
                <Label htmlFor="cognomeSegnalatore" className="text-amber-700">Cognome *</Label>
                <Input
                  id="cognomeSegnalatore"
                  placeholder="Il tuo cognome"
                  className={`border-amber-200 focus:border-amber-500 ${errors.cognomeSegnalatore ? 'border-red-500' : ''}`}
                  {...register('cognomeSegnalatore')}
                />
                {errors.cognomeSegnalatore && (
                  <p className="text-sm text-red-500">{errors.cognomeSegnalatore.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="emailSegnalatore" className="text-amber-700">Email *</Label>
                <Input
                  id="emailSegnalatore"
                  type="email"
                  placeholder="la.tua@email.it"
                  className={`border-amber-200 focus:border-amber-500 ${errors.emailSegnalatore ? 'border-red-500' : ''}`}
                  {...register('emailSegnalatore')}
                />
                {errors.emailSegnalatore && (
                  <p className="text-sm text-red-500">{errors.emailSegnalatore.message}</p>
                )}
              </div>

              {/* Telefono - ORA OBBLIGATORIO */}
              <div className="space-y-2">
                <Label htmlFor="telefonoSegnalatore" className="text-amber-700">Telefono *</Label>
                <Input
                  id="telefonoSegnalatore"
                  placeholder="333 1234567"
                  className={`border-amber-200 focus:border-amber-500 ${errors.telefonoSegnalatore ? 'border-red-500' : ''}`}
                  {...register('telefonoSegnalatore')}
                />
                {errors.telefonoSegnalatore && (
                  <p className="text-sm text-red-500">{errors.telefonoSegnalatore.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sezione Informativa Privacy GDPR */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <Shield className="h-5 w-5 text-red-600" />
              Informativa sulla Privacy e Trattamento dei Dati *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed bg-red-50/50 p-3 rounded-lg border border-red-100">
              Ai sensi del Regolamento (UE) 2016/679 (GDPR), acconsento al trattamento dei miei dati personali per le finalità di gestione delle segnalazioni di cani randagi nel territorio del Comune di Naro. I dati saranno trattati nel rispetto della normativa vigente e non saranno comunicati a terzi senza il mio consenso.
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
          </CardContent>
        </Card>

        {/* Sezione Dichiarazione di Responsabilità */}
        <Card className="border-l-4 border-l-sky-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-sky-800">
              <Lock className="h-5 w-5 text-sky-600" />
              Dichiarazione di Responsabilità *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed bg-sky-50/50 p-3 rounded-lg border border-sky-100">
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
          </CardContent>
        </Card>

        {/* Pulsante di invio */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={creaSegnalazione.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[200px]"
          >
            {creaSegnalazione.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Invia Segnalazione
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
