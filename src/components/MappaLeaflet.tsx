// Componente MappaLeaflet - Mappa interattiva con Leaflet
// Questo componente viene importato dinamicamente per evitare errori SSR

'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

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

// Fix per le icone predefinite di Leaflet
const iconaPredefinita = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete iconaPredefinita._getIconUrl;

// Icone personalizzate per i marker in base all'urgenza
function creaIconaUrgenza(urgenza: string): L.DivIcon {
  const colore = coloriUrgenza[urgenza] || '#eab308';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${colore};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 5.172C10 3.782 8.423 2.672 7 2c-2 .8-3 2.06-3 3.172V7h6V5.172zM4 8v2h6V8H4zm2 4v4h2v-4H6zm4 0v4h2v-4h-2zm4 0v4h2v-4h-2zm2-4v2h6V8h-6zm-2-2.828C14 3.782 15.577 2.672 17 2c2 .8 3 2.06 3 3.172V7h-6V5.172zM14 8v2h6V8h-6z"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });
}

// Componente per adattare la vista della mappa
function AdattaVista({ segnalazioni }: { segnalazioni: Segnalazione[] }) {
  const mappa = useMap();

  useEffect(() => {
    if (segnalazioni.length > 0) {
      const limiti = L.latLngBounds(
        segnalazioni.map((s) => L.latLng(s.latitudine, s.longitudine))
      );
      mappa.fitBounds(limiti, { padding: [30, 30], maxZoom: 15 });
    }
  }, [segnalazioni, mappa]);

  return null;
}

// Props del componente mappa
interface PropsMappaLeaflet {
  segnalazioni: Segnalazione[];
  segnalazioneHover: string | null;
  onSeleziona: (id: string) => void;
  onHover: (id: string | null) => void;
}

// Componente mappa Leaflet esportato come default per l'importazione dinamica
export default function MappaLeaflet({ segnalazioni, segnalazioneHover, onSeleziona, onHover }: PropsMappaLeaflet) {
  return (
    <MapContainer
      center={[NARO_LAT, NARO_LNG]}
      zoom={14}
      className="h-[400px] md:h-[500px] lg:h-[600px] w-full z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AdattaVista segnalazioni={segnalazioni} />
      {segnalazioni.map((segnalazione) => (
        <Marker
          key={segnalazione.id}
          position={[segnalazione.latitudine, segnalazione.longitudine]}
          icon={creaIconaUrgenza(segnalazione.urgenza)}
          eventHandlers={{
            mouseover: () => onHover(segnalazione.id),
            mouseout: () => onHover(null),
          }}
        >
          <Popup>
            <div className="min-w-[200px] p-1">
              <h3 className="font-semibold text-amber-800 text-sm mb-1">
                {segnalazione.titolo}
              </h3>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {segnalazione.descrizione}
              </p>
              <div className="flex gap-1 mb-2">
                <Badge
                  className="text-[9px] px-1 py-0 border-0"
                  style={{
                    backgroundColor: coloriUrgenza[segnalazione.urgenza] + '20',
                    color: coloriUrgenza[segnalazione.urgenza],
                  }}
                >
                  {etichetteUrgenza[segnalazione.urgenza]}
                </Badge>
                <Badge
                  className={`${coloriStato[segnalazione.stato]} text-[9px] px-1 py-0 border-0`}
                >
                  {etichetteStato[segnalazione.stato]}
                </Badge>
              </div>
              {segnalazione.indirizzo && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {segnalazione.indirizzo}
                </p>
              )}
              <button
                onClick={() => onSeleziona(segnalazione.id)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                Vedi dettagli →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
