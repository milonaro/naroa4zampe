// Vista Mappa - Mappa interattiva con marker delle segnalazioni
// Utilizza Leaflet per la visualizzazione cartografica
// Importazione dinamica per evitare errori SSR (window is not defined)

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Filter, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';

// Coordinate di Naro, Sicilia
const NARO_LAT = 37.2964;
const NARO_LNG = 13.7764;

// Interfaccia segnalazione
interface Segnalazione {
  id: string;
  titolo: string;
  descrizione: string;
  latitudine: number;
  longitudine: number;
  indirizzo?: string;
  urgenza: string;
  stato: string;
  razza?: string;
  colore?: string;
  taglia?: string;
  createdAt: string;
}

// Colori marker per urgenza
const coloriUrgenza: Record<string, string> = {
  bassa: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
};

// Etichette urgenza
const etichetteUrgenza: Record<string, string> = {
  bassa: 'Bassa',
  media: 'Media',
  alta: 'Alta',
  critica: 'Critica',
};

// Etichette stato
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

// Importazione dinamica del componente mappa Leaflet (solo client-side)
const MappaLeaflet = dynamic(() => import('./MappaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center bg-amber-50 rounded-lg">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
        <p className="text-amber-600 text-sm">Caricamento mappa...</p>
      </div>
    </div>
  ),
});

export default function MappaView() {
  const { filtri, impostaFiltri, selezionaSegnalazione } = useStore();
  const [segnalazioneHover, setSegnalazioneHover] = useState<string | null>(null);

  // Recupero segnalazioni
  const { data, isLoading } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-mappa', filtri.stato, filtri.urgenza],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtri.stato) params.set('stato', filtri.stato);
      if (filtri.urgenza) params.set('urgenza', filtri.urgenza);
      params.set('perPagina', '100');
      const risposta = await fetch(`/api/segnalazioni?${params.toString()}`);
      return risposta.json();
    },
  });

  const segnalazioni = data?.segnalazioni || [];

  return (
    <div className="space-y-4 pb-8">
      {/* Intestazione */}
      <div>
        <h2 className="text-2xl font-bold text-amber-800">Mappa Segnalazioni</h2>
        <p className="text-amber-600 mt-1">
          Visualizza tutte le segnalazioni di cani randagi sul territorio di Naro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Pannello Filtri e Lista */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filtri */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                <Filter className="h-4 w-4 text-amber-600" />
                Filtri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filtro stato */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-700">Stato</label>
                <Select
                  value={filtri.stato || 'tutti'}
                  onValueChange={(valore) =>
                    impostaFiltri({ stato: valore === 'tutti' ? '' : valore })
                  }
                >
                  <SelectTrigger className="border-amber-200 h-8 text-xs">
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutti">Tutti gli stati</SelectItem>
                    <SelectItem value="ricevuta">Ricevuta</SelectItem>
                    <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                    <SelectItem value="risolta">Risolta</SelectItem>
                    <SelectItem value="archiviata">Archiviata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro urgenza */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-700">Urgenza</label>
                <Select
                  value={filtri.urgenza || 'tutte'}
                  onValueChange={(valore) =>
                    impostaFiltri({ urgenza: valore === 'tutte' ? '' : valore })
                  }
                >
                  <SelectTrigger className="border-amber-200 h-8 text-xs">
                    <SelectValue placeholder="Tutte le urgenze" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutte">Tutte le urgenze</SelectItem>
                    <SelectItem value="bassa">Bassa</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Critica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-200 text-amber-700 text-xs"
                onClick={() => impostaFiltri({ stato: '', urgenza: '' })}
              >
                Rimuovi filtri
              </Button>
            </CardContent>
          </Card>

          {/* Lista segnalazioni */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">
                Segnalazioni ({segnalazioni.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] lg:h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  </div>
                ) : segnalazioni.length === 0 ? (
                  <div className="text-center py-8 text-amber-500 text-sm">
                    Nessuna segnalazione trovata
                  </div>
                ) : (
                  <div className="space-y-0">
                    {segnalazioni.map((segnalazione) => (
                      <div
                        key={segnalazione.id}
                        className={`p-3 border-b border-amber-100 cursor-pointer hover:bg-amber-50 transition-colors ${
                          segnalazioneHover === segnalazione.id ? 'bg-amber-50' : ''
                        }`}
                        onMouseEnter={() => setSegnalazioneHover(segnalazione.id)}
                        onMouseLeave={() => setSegnalazioneHover(null)}
                        onClick={() => selezionaSegnalazione(segnalazione.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="h-3 w-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: coloriUrgenza[segnalazione.urgenza] || '#eab308' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900 truncate">
                              {segnalazione.titolo}
                            </p>
                            {segnalazione.indirizzo && (
                              <p className="text-xs text-amber-500 truncate mt-0.5">
                                {segnalazione.indirizzo}
                              </p>
                            )}
                            <div className="flex gap-1 mt-1">
                              <Badge
                                className={`${coloriStato[segnalazione.stato] || 'bg-gray-100 text-gray-800'} text-[9px] px-1 py-0 border-0`}
                              >
                                {etichetteStato[segnalazione.stato] || segnalazione.stato}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legenda */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Legenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-700">Urgenza</p>
                {Object.entries(coloriUrgenza).map(([chiave, colore]) => (
                  <div key={chiave} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colore }} />
                    <span className="text-xs text-amber-700">
                      {etichetteUrgenza[chiave] || chiave}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Area Mappa */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <MappaLeaflet
                segnalazioni={segnalazioni}
                segnalazioneHover={segnalazioneHover}
                onSeleziona={selezionaSegnalazione}
                onHover={setSegnalazioneHover}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
