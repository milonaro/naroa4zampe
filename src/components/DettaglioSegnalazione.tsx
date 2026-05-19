// Componente DettaglioSegnalazione - Modal con i dettagli completi di una segnalazione

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MapPin,
  Dog,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useStore } from '@/lib/store';

// Interfaccia segnalazione dettagliata
interface SegnalazioneDettaglio {
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
  fotoUrl?: string;
  nomeSegnalatore: string;
  cognomeSegnalatore: string;
  emailSegnalatore: string;
  telefonoSegnalatore?: string;
  createdAt: string;
  updatedAt: string;
  notifiche: {
    id: string;
    messaggio: string;
    tipo: string;
    letta: boolean;
    createdAt: string;
  }[];
}

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
  piccola: 'Piccola (fino a 10kg)',
  media: 'Media (10-25kg)',
  grande: 'Grande (oltre 25kg)',
};

// Colori badge
const coloriUrgenza: Record<string, string> = {
  bassa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

const coloriStato: Record<string, string> = {
  ricevuta: 'bg-sky-100 text-sky-800',
  in_lavorazione: 'bg-amber-100 text-amber-800',
  risolta: 'bg-emerald-100 text-emerald-800',
  archiviata: 'bg-gray-100 text-gray-800',
};

export default function DettaglioSegnalazione() {
  const { segnalazioneSelezionata, selezionaSegnalazione } = useStore();
  const queryClient = useQueryClient();

  // Recupero dettagli segnalazione
  const { data: segnalazione, isLoading } = useQuery<SegnalazioneDettaglio>({
    queryKey: ['segnalazione', segnalazioneSelezionata],
    queryFn: async () => {
      const risposta = await fetch(`/api/segnalazioni/${segnalazioneSelezionata}`);
      if (!risposta.ok) throw new Error('Segnalazione non trovata');
      return risposta.json();
    },
    enabled: !!segnalazioneSelezionata,
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
      queryClient.invalidateQueries({ queryKey: ['segnalazione', segnalazioneSelezionata] });
      queryClient.invalidateQueries({ queryKey: ['segnalazioni'] });
      queryClient.invalidateQueries({ queryKey: ['statistiche'] });
    },
    onError: () => {
      toast.error('Errore nell\'aggiornamento dello stato');
    },
  });

  // Chiusura dialog
  const chiudiDialog = () => {
    selezionaSegnalazione(null);
  };

  return (
    <Dialog
      open={!!segnalazioneSelezionata}
      onOpenChange={(aperto) => {
        if (!aperto) chiudiDialog();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-800 flex items-center gap-2">
            {segnalazione ? (
              <>
                {segnalazione.urgenza === 'critica' || segnalazione.urgenza === 'alta' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5 text-amber-600" />
                )}
                {segnalazione.titolo}
              </>
            ) : (
              'Dettaglio Segnalazione'
            )}
          </DialogTitle>
          <DialogDescription>
            Dettagli completi della segnalazione di cane randagio
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : segnalazione ? (
          <div className="space-y-4">
            {/* Badge urgenza e stato */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${coloriUrgenza[segnalazione.urgenza]} border-0`}>
                Urgenza: {etichetteUrgenza[segnalazione.urgenza]}
              </Badge>
              <Badge className={`${coloriStato[segnalazione.stato]} border-0`}>
                Stato: {etichetteStato[segnalazione.stato]}
              </Badge>
            </div>

            {/* Foto se presente */}
            {segnalazione.fotoUrl && (
              <div className="rounded-lg overflow-hidden border border-amber-200">
                <img
                  src={segnalazione.fotoUrl}
                  alt="Foto del cane segnalato"
                  className="w-full max-h-64 object-cover"
                />
              </div>
            )}

            {/* Descrizione */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-amber-700">Descrizione</h4>
              <p className="text-sm text-amber-900 bg-amber-50/50 p-3 rounded-lg">
                {segnalazione.descrizione}
              </p>
            </div>

            <Separator className="bg-amber-100" />

            {/* Dettagli del cane */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-700 flex items-center gap-1.5">
                <Dog className="h-4 w-4" />
                Dettagli del Cane
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {segnalazione.razza && (
                  <div className="bg-amber-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-amber-500">Razza</p>
                    <p className="text-sm font-medium text-amber-800">{segnalazione.razza}</p>
                  </div>
                )}
                {segnalazione.colore && (
                  <div className="bg-amber-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-amber-500">Colore</p>
                    <p className="text-sm font-medium text-amber-800">{segnalazione.colore}</p>
                  </div>
                )}
                {segnalazione.taglia && (
                  <div className="bg-amber-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-amber-500">Taglia</p>
                    <p className="text-sm font-medium text-amber-800">
                      {etichetteTaglia[segnalazione.taglia] || segnalazione.taglia}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-amber-100" />

            {/* Posizione */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-700 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Posizione
              </h4>
              <div className="bg-amber-50 p-3 rounded-lg space-y-1">
                {segnalazione.indirizzo && (
                  <p className="text-sm text-amber-800">{segnalazione.indirizzo}</p>
                )}
                <p className="text-xs text-amber-600">
                  Coordinate: {segnalazione.latitudine.toFixed(4)}, {segnalazione.longitudine.toFixed(4)}
                </p>
              </div>
            </div>

            <Separator className="bg-amber-100" />

            {/* Dati segnalatore */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-700 flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Segnalatore
              </h4>
              <div className="bg-amber-50 p-3 rounded-lg space-y-1.5">
                <p className="text-sm text-amber-800">
                  {segnalazione.nomeSegnalatore} {segnalazione.cognomeSegnalatore}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-amber-600">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {segnalazione.emailSegnalatore}
                  </span>
                  {segnalazione.telefonoSegnalatore && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {segnalazione.telefonoSegnalatore}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-amber-100" />

            {/* Date */}
            <div className="flex flex-wrap gap-4 text-xs text-amber-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Creata: {new Date(segnalazione.createdAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Aggiornata: {new Date(segnalazione.updatedAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Azioni */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm font-medium text-amber-700 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Cambia stato:
              </span>
              <Select
                value={segnalazione.stato}
                onValueChange={(nuovoStato) => {
                  aggiornaStato.mutate({
                    id: segnalazione.id,
                    stato: nuovoStato,
                  });
                }}
              >
                <SelectTrigger className="w-[160px] border-amber-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ricevuta">Ricevuta</SelectItem>
                  <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                  <SelectItem value="risolta">Risolta</SelectItem>
                  <SelectItem value="archiviata">Archiviata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-amber-500">
            Segnalazione non trovata
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
