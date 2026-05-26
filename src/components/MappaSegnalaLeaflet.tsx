// Componente MappaSegnalaLeaflet - Mappa interattiva per il form di segnalazione
// Permette di cliccare per posizionare un marker
// Importazione dinamica per evitare errori SSR

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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

import { useStore } from '@/lib/store';

// Fix per le icone predefinite di Leaflet
const iconaPredefinita = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete iconaPredefinita._getIconUrl;

// Icona marker rossa per la posizione selezionata
function creaIconaMarker(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker-segnala',
    html: `<div style="
      background-color: #ef4444;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(239,68,68,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Componente per gestire i click sulla mappa
function GestoreClick({
  posizione,
  onClickMappa,
}: {
  posizione: { lat: number; lng: number } | null;
  onClickMappa: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onClickMappa(e.latlng.lat, e.latlng.lng);
    },
  });

  return posizione ? (
    <Marker position={[posizione.lat, posizione.lng]} icon={creaIconaMarker()} />
  ) : null;
}

// Props del componente
interface PropsMappaSegnala {
  posizione: { lat: number; lng: number } | null;
  onClickMappa: (lat: number, lng: number) => void;
}

// Componente mappa per il form di segnalazione
export default function MappaSegnalaLeaflet({ posizione, onClickMappa }: PropsMappaSegnala) {
  const configComune = useStore((s) => s.configComune);
  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      {/* Overlay GPS info */}
      <div className="absolute top-2 left-2 z-[1000] bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-amber-700">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Posizione</span>
        </div>
        {posizione && (
          <div className="text-[9px] text-gray-500 mt-0.5">
            {posizione.lat.toFixed(4)}N {posizione.lng.toFixed(4)}E
          </div>
        )}
      </div>

      {!posizione && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg">
            <div className="text-amber-700 text-xs flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Clicca per posizionare il marker
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={[configComune.latCentro, configComune.lngCentro]}
        zoom={14}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <GestoreClick posizione={posizione} onClickMappa={onClickMappa} />
      </MapContainer>
    </div>
  );
}
