// Componente MappaLeaflet - Mappa interattiva per la localizzazione di animali randagi a Naro
// Tema civico caldo e moderno — arenario
// Importazione dinamica per evitare errori SSR

'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { COLORI_URGENZA_HEX, ETICHETTE_URGENZA, ETICHETTE_STATO } from '@/lib/constants';
import { useStore } from '@/lib/store';

// Caricamento dinamico del CSS di Leaflet (solo una volta)
if (typeof window !== 'undefined') {
  const existingLink = document.querySelector('link[href*="leaflet"]');
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
}

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

// Icone marker con colori solidi su sfondo chiaro
function creaIconaMarker(urgenza: string, hover: boolean = false): L.DivIcon {
  const colore = COLORI_URGENZA_HEX[urgenza] || '#eab308';
  const markerSize = hover ? 28 : 22;
  const outerSize = hover ? 36 : 30;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative;width:${outerSize}px;height:${outerSize}px;">
        <div style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${markerSize}px;height:${markerSize}px;
          border-radius:50%;
          border:2.5px solid ${colore};
          background:${colore}22;
          box-shadow:0 1px 4px rgba(0,0,0,0.2);
          ${hover ? 'box-shadow:0 2px 8px rgba(0,0,0,0.3); border-width:3px;' : ''}
        "></div>
        <div style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:7px;height:7px;
          border-radius:50%;
          background:${colore};
        "></div>
      </div>
    `,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
    popupAnchor: [0, -(outerSize / 2 + 4)],
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

// Componente Fly-to
function VoloAlBersaglio({ bersaglio }: { bersaglio: { lat: number; lng: number } | null }) {
  const mappa = useMap();

  useEffect(() => {
    if (bersaglio) {
      mappa.flyTo([bersaglio.lat, bersaglio.lng], 16, { duration: 1.5 });
    }
  }, [bersaglio, mappa]);

  return null;
}

// Componente tracciamento centro mappa
function TracciamentoCentro({
  onCambioCentro,
}: {
  onCambioCentro: (lat: number, lng: number, zoom: number) => void;
}) {
  useMapEvents({
    moveend(e) {
      const centro = e.target.getCenter();
      const zoom = e.target.getZoom();
      onCambioCentro(centro.lat, centro.lng, zoom);
    },
  });
  return null;
}

// Props del componente mappa
interface PropsMappaLeaflet {
  segnalazioni: Segnalazione[];
  segnalazioneHover: string | null;
  bersaglioVolo: { lat: number; lng: number } | null;
  onSeleziona: (id: string) => void;
  onHover: (id: string | null) => void;
  audioAttivo: boolean;
  onToggleAudio: () => void;
  onSuonoSelezione: () => void;
}

// Componente mappa Leaflet esportato come default per l'importazione dinamica
export default function MappaLeaflet({
  segnalazioni,
  segnalazioneHover,
  bersaglioVolo,
  onSeleziona,
  onHover,
  audioAttivo,
  onToggleAudio,
  onSuonoSelezione,
}: PropsMappaLeaflet) {
  const configComune = useStore((s) => s.configComune);
  const [centroMappa, setCentroMappa] = useState({ lat: configComune.latCentro, lng: configComune.lngCentro, zoom: 14 });

  const aggiornaCentro = useCallback((lat: number, lng: number, zoom: number) => {
    setCentroMappa({ lat, lng, zoom });
  }, []);

  // Calcola indice criticità
  const segnalazioniCritiche = segnalazioni.filter(
    (s) => s.urgenza === 'critica' || s.urgenza === 'alta'
  ).length;
  const indiceCriticita = segnalazioni.length > 0
    ? Math.min(100, Math.round((segnalazioniCritiche / segnalazioni.length) * 100))
    : 0;
  const zonaSicura = indiceCriticita < 40;

  // Determina colore barra criticità
  const coloreBarra =
    indiceCriticita < 30
      ? '#22c55e'
      : indiceCriticita < 60
        ? '#eab308'
        : '#ef4444';

  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full z-0 overflow-hidden">
      {/* Mappa Leaflet */}
      <MapContainer
        center={[configComune.latCentro, configComune.lngCentro]}
        zoom={14}
        className="h-full w-full light-hud"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <AdattaVista segnalazioni={segnalazioni} />
        <VoloAlBersaglio bersaglio={bersaglioVolo} />
        <TracciamentoCentro onCambioCentro={aggiornaCentro} />

        {segnalazioni.map((segnalazione) => (
          <Marker
            key={segnalazione.id}
            position={[segnalazione.latitudine, segnalazione.longitudine]}
            icon={creaIconaMarker(segnalazione.urgenza, segnalazioneHover === segnalazione.id)}
            eventHandlers={{
              mouseover: () => onHover(segnalazione.id),
              mouseout: () => onHover(null),
              click: () => onSuonoSelezione(),
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <h3 className="font-bold text-sm mb-1 text-gray-800">
                  {segnalazione.titolo}
                </h3>
                <p className="text-xs mb-2 line-clamp-2 text-gray-500">
                  {segnalazione.descrizione}
                </p>
                <div className="flex gap-1 mb-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: COLORI_URGENZA_HEX[segnalazione.urgenza] + '22',
                      color: COLORI_URGENZA_HEX[segnalazione.urgenza],
                      border: `1px solid ${COLORI_URGENZA_HEX[segnalazione.urgenza]}44`,
                    }}
                  >
                    {ETICHETTE_URGENZA[segnalazione.urgenza]}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: 'rgba(100,100,100,0.08)',
                      color: '#555',
                      border: '1px solid rgba(100,100,100,0.2)',
                    }}
                  >
                    {ETICHETTE_STATO[segnalazione.stato]}
                  </span>
                </div>
                <div className="text-[10px] mb-1 text-gray-400">
                  Coordinate: {segnalazione.latitudine.toFixed(4)}, {segnalazione.longitudine.toFixed(4)}
                </div>
                {segnalazione.indirizzo && (
                  <div className="text-[10px] mb-1 text-gray-400">
                    Indirizzo: {segnalazione.indirizzo}
                  </div>
                )}
                <button
                  onClick={() => onSeleziona(segnalazione.id)}
                  className="mt-1 text-[10px] font-bold hover:underline text-amber-700"
                >
                  Visualizza dettagli →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Pulsante Audio */}
      <button
        onClick={onToggleAudio}
        className={`absolute top-3 right-12 z-[1001] px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
          audioAttivo
            ? 'bg-white/90 border border-amber-300/60 text-amber-800 shadow-sm hover:bg-amber-50'
            : 'bg-white/90 border border-gray-200/60 text-gray-400 shadow-sm hover:bg-gray-50'
        }`}
      >
        {audioAttivo ? '◉ Audio ON' : '◯ Audio OFF'}
      </button>

      {/* Pannello Info Mappa */}
      <div className="absolute bottom-3 right-3 z-[1001] rounded-lg px-3 py-2.5 min-w-[200px] bg-white/90 backdrop-blur-sm border border-amber-200/60 shadow-sm text-[11px] text-gray-700">
        <div className="mb-1.5 text-[10px] tracking-wide text-amber-700/70 font-medium">
          ℹ Info
        </div>
        <div className="mb-1 text-gray-600">
          Lat: {centroMappa.lat.toFixed(6)}
        </div>
        <div className="mb-1 text-gray-600">
          Lng: {centroMappa.lng.toFixed(6)}
        </div>
        <div className="mb-1.5 text-gray-600">
          Zoom: {centroMappa.zoom}
        </div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span style={{ color: zonaSicura ? '#22c55e' : '#ef4444' }}>
            {zonaSicura ? '◉' : '⚠'}
          </span>
          <span className="font-medium" style={{ color: zonaSicura ? '#22c55e' : '#ef4444' }}>
            {zonaSicura ? 'Zona Sicura' : 'Zona Critica'}
          </span>
        </div>
        <div>
          <div className="flex justify-between mb-0.5 text-gray-600">
            <span>Indice Criticità</span>
            <span style={{ color: coloreBarra }} className="font-medium">{indiceCriticita}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${indiceCriticita}%`,
                backgroundColor: coloreBarra,
              }}
            />
          </div>
        </div>
      </div>

      {/* Label sistema */}
      <div
        className="absolute top-3 left-3 z-[1001] rounded-lg px-2.5 py-1.5 bg-white/90 backdrop-blur-sm border border-amber-200/60 shadow-sm text-amber-800"
        style={{ fontSize: '10px', letterSpacing: '0.08em' }}
      >
        Mappa Interattiva
        <br />
        <span className="text-amber-700/50">{configComune.nomeComune.replace('Comune di ', '')}, {configComune.regione}</span>
      </div>
    </div>
  );
}
