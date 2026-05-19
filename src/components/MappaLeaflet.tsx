// Componente MappaLeaflet - Mappa tattica con HUD da command console
// Tactical Recon HUD per la localizzazione di cani randagi a Naro
// Importazione dinamica per evitare errori SSR

'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Caricamento dinamico del CSS di Leaflet
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

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

// Colori urgenza (neon tactical)
const coloriUrgenza: Record<string, string> = {
  bassa: '#00ff88',
  media: '#ffcc00',
  alta: '#ff8800',
  critica: '#ff2255',
};

// Etichette urgenza
const etichetteUrgenza: Record<string, string> = {
  bassa: 'BASSA',
  media: 'MEDIA',
  alta: 'ALTA',
  critica: 'CRITICA',
};

// Etichette stato
const etichetteStato: Record<string, string> = {
  ricevuta: 'Ricevuta',
  in_lavorazione: 'In lavorazione',
  risolta: 'Risolta',
  archiviata: 'Archiviata',
};

// Icone marker tattiche con effetto neon glow
function creaIconaTattica(urgenza: string, hover: boolean = false): L.DivIcon {
  const colore = coloriUrgenza[urgenza] || '#ffcc00';
  const glowSize = hover ? 28 : 20;
  const outerSize = hover ? 36 : 28;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative;width:${outerSize}px;height:${outerSize}px;">
        <div style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${glowSize + 12}px;height:${glowSize + 12}px;
          border-radius:50%;
          background:radial-gradient(circle, ${colore}33 0%, transparent 70%);
        "></div>
        <div style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${glowSize}px;height:${glowSize}px;
          border-radius:50%;
          border:2px solid ${colore};
          background:${colore}22;
          box-shadow:0 0 8px ${colore}88, inset 0 0 4px ${colore}44;
          ${hover ? 'box-shadow:0 0 16px ' + colore + 'cc, inset 0 0 8px ' + colore + '66;' : ''}
        "></div>
        <div style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:6px;height:6px;
          border-radius:50%;
          background:${colore};
          box-shadow:0 0 6px ${colore};
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

// Componente Fly-to-Target
function VoloAlBersaglio({ bersaglio }: { bersaglio: { lat: number; lng: number } | null }) {
  const mappa = useMap();

  useEffect(() => {
    if (bersaglio) {
      mappa.flyTo([bersaglio.lat, bersaglio.lng], 16, { duration: 1.5 });
    }
  }, [bersaglio, mappa]);

  return null;
}

// Componente Telemetria - traccia posizione centro mappa
function TracciamentoTelemetria({
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
  const [centroMappa, setCentroMappa] = useState({ lat: NARO_LAT, lng: NARO_LNG, zoom: 14 });

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
  const settoreSicuro = indiceCriticita < 40;

  // Determina colore barra criticità
  const coloreBarra =
    indiceCriticita < 30
      ? '#00ff88'
      : indiceCriticita < 60
        ? '#ffcc00'
        : '#ff2255';

  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full z-0 overflow-hidden scanline-effetto">
      {/* Mappa Leaflet */}
      <MapContainer
        center={[NARO_LAT, NARO_LNG]}
        zoom={14}
        className="h-full w-full dark-hud"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <AdattaVista segnalazioni={segnalazioni} />
        <VoloAlBersaglio bersaglio={bersaglioVolo} />
        <TracciamentoTelemetria onCambioCentro={aggiornaCentro} />

        {segnalazioni.map((segnalazione) => (
          <Marker
            key={segnalazione.id}
            position={[segnalazione.latitudine, segnalazione.longitudine]}
            icon={creaIconaTattica(segnalazione.urgenza, segnalazioneHover === segnalazione.id)}
            eventHandlers={{
              mouseover: () => onHover(segnalazione.id),
              mouseout: () => onHover(null),
              click: () => onSuonoSelezione(),
            }}
          >
            <Popup>
              <div className="min-w-[200px] p-1" style={{ fontFamily: "'Courier New', monospace" }}>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'rgba(0,255,200,0.95)' }}>
                  TGT-{segnalazione.id.slice(0, 5).toUpperCase()}
                </h3>
                <p className="text-xs mb-2" style={{ color: 'rgba(0,255,200,0.7)' }}>
                  {segnalazione.titolo}
                </p>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: 'rgba(0,255,200,0.5)' }}>
                  {segnalazione.descrizione}
                </p>
                <div className="flex gap-1 mb-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: coloriUrgenza[segnalazione.urgenza] + '22',
                      color: coloriUrgenza[segnalazione.urgenza],
                      border: `1px solid ${coloriUrgenza[segnalazione.urgenza]}44`,
                    }}
                  >
                    {etichetteUrgenza[segnalazione.urgenza]}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: 'rgba(0,255,200,0.1)',
                      color: 'rgba(0,255,200,0.7)',
                      border: '1px solid rgba(0,255,200,0.2)',
                    }}
                  >
                    {etichetteStato[segnalazione.stato]}
                  </span>
                </div>
                <div className="text-[10px] mb-1" style={{ color: 'rgba(0,255,200,0.5)' }}>
                  COORD: {segnalazione.latitudine.toFixed(4)}, {segnalazione.longitudine.toFixed(4)}
                </div>
                {segnalazione.indirizzo && (
                  <div className="text-[10px] mb-1" style={{ color: 'rgba(0,255,200,0.4)' }}>
                    LOC: {segnalazione.indirizzo}
                  </div>
                )}
                <button
                  onClick={() => onSeleziona(segnalazione.id)}
                  className="mt-1 text-[10px] font-bold hover:underline"
                  style={{ color: 'rgba(0,255,200,0.9)' }}
                >
                  [VISUALIZZA DETTAGLI]
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay: Griglia Cyber */}
      <div className="griglia-cyber" />

      {/* Overlay: Sweep Sonar */}
      <div className="sweep-sonar">
        <div className="sweep-sonar-linea" />
      </div>

      {/* Overlay: Mirino Tattico */}
      <div className="mirino-tattico" />

      {/* Overlay: Pulsante Audio */}
      <button
        onClick={onToggleAudio}
        className={`pulsante-hud absolute top-3 right-12 z-[1001] px-3 py-1.5 rounded ${!audioAttivo ? 'disattivo' : ''}`}
      >
        {audioAttivo ? '◉ AUDIO SYS ON' : '◯ AUDIO SYS OFF'}
      </button>

      {/* Overlay: Pannello Telemetria */}
      <div className="pannello-telemetria absolute bottom-3 right-3 z-[1001] rounded-lg px-3 py-2.5 min-w-[200px]">
        <div className="mb-1.5 text-[10px] tracking-wider opacity-60">
          ▸ TELEMETRIA
        </div>
        <div className="mb-1">
          LAT: {centroMappa.lat.toFixed(6)}
        </div>
        <div className="mb-1">
          LNG: {centroMappa.lng.toFixed(6)}
        </div>
        <div className="mb-1.5">
          ZOOM: {centroMappa.zoom}
        </div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className={settoreSicuro ? '' : ''} style={{ color: settoreSicuro ? '#00ff88' : '#ff2255' }}>
            {settoreSicuro ? '◉' : '⚠'}
          </span>
          <span style={{ color: settoreSicuro ? '#00ff88' : '#ff2255' }}>
            {settoreSicuro ? 'SETTORE SICURO' : 'SETTORE CRITICO'}
          </span>
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <span>INDICE CRITICITÀ</span>
            <span style={{ color: coloreBarra }}>{indiceCriticita}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,255,200,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${indiceCriticita}%`,
                backgroundColor: coloreBarra,
                boxShadow: `0 0 6px ${coloreBarra}88`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Overlay: Label sistema tattico */}
      <div
        className="absolute top-3 left-3 z-[1001] pannello-telemetria rounded px-2.5 py-1.5"
        style={{ fontSize: '10px', letterSpacing: '0.15em' }}
      >
        SISTEMA TATTICO v2.0
        <br />
        <span style={{ opacity: 0.5 }}>NARO — SICILIA</span>
      </div>
    </div>
  );
}
