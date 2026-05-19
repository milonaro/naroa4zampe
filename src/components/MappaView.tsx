// Vista Mappa - Tactical Recon HUD
// Console di comando tattica per la localizzazione di animali randagi a Naro
// Importazione dinamica per evitare errori SSR (window is not defined)

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Loader2, Volume2, VolumeX, Crosshair, Radio } from 'lucide-react';
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

// Colori urgenza (standard, leggibili su sfondo chiaro)
const coloriUrgenza: Record<string, string> = {
  bassa: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
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
  in_lavorazione: 'In lavor.',
  risolta: 'Risolta',
  archiviata: 'Archiv.',
};

// Importazione dinamica del componente mappa Leaflet (solo client-side)
const MappaLeaflet = dynamic(() => import('./MappaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center rounded-lg bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-amber-600" />
        <p className="text-sm text-gray-500 font-mono">
          Caricamento mappa...
        </p>
      </div>
    </div>
  ),
});

export default function MappaView() {
  const { filtri, impostaFiltri, selezionaSegnalazione } = useStore();
  const [segnalazioneHover, setSegnalazioneHover] = useState<string | null>(null);
  const [bersaglioVolo, setBersaglioVolo] = useState<{ lat: number; lng: number } | null>(null);
  const [audioAttivo, setAudioAttivo] = useState(false);
  const audioEngineRef = useRef<AudioEngineTattico | null>(null);
  const sonarIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Inizializzazione audio engine
  const inizializzaAudio = useCallback(() => {
    if (!audioEngineRef.current) {
      const engine = new AudioEngineTattico();
      engine.inizializza();
      audioEngineRef.current = engine;
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!audioEngineRef.current) {
      inizializzaAudio();
      setAudioAttivo(true);
      return;
    }
    if (audioAttivo) {
      audioEngineRef.current.muta();
      setAudioAttivo(false);
    } else {
      audioEngineRef.current.attiva();
      setAudioAttivo(true);
    }
  }, [audioAttivo, inizializzaAudio]);

  // Suono selezione marker
  const suonoSelezione = useCallback(() => {
    if (!audioEngineRef.current) {
      inizializzaAudio();
    }
    if (audioEngineRef.current?.attivo) {
      audioEngineRef.current.suonoSelezione();
    }
  }, [inizializzaAudio]);

  // Sonar periodico
  useEffect(() => {
    if (audioAttivo && audioEngineRef.current?.attivo) {
      sonarIntervalRef.current = setInterval(() => {
        audioEngineRef.current?.suonoSonar();
      }, 4000);
    } else {
      if (sonarIntervalRef.current) {
        clearInterval(sonarIntervalRef.current);
        sonarIntervalRef.current = null;
      }
    }
    return () => {
      if (sonarIntervalRef.current) {
        clearInterval(sonarIntervalRef.current);
      }
    };
  }, [audioAttivo]);

  // Cleanup audio engine
  useEffect(() => {
    return () => {
      audioEngineRef.current?.distruggi();
    };
  }, []);

  // Fly to target quando si clicca una segnalazione nella lista
  const volaAlBersaglio = useCallback((seg: Segnalazione) => {
    setBersaglioVolo({ lat: seg.latitudine, lng: seg.longitudine });
    setSegnalazioneHover(seg.id);
    suonoSelezione();
    // Reset bersaglio dopo il volo per permettere re-click
    setTimeout(() => setBersaglioVolo(null), 2000);
  }, [suonoSelezione]);

  // Calcola statistiche radar
  const contattiCritici = segnalazioni.filter(s => s.urgenza === 'critica').length;
  const contattiAlti = segnalazioni.filter(s => s.urgenza === 'alta').length;

  return (
    <div className="space-y-0 pb-0 bg-gray-50" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* Intestazione */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-bold tracking-wider text-gray-800">
            Mappa Interattiva
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Segnalazioni di cani randagi sul territorio di Naro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Pannello laterale tattico */}
        <div className="lg:col-span-1 space-y-3">
          {/* Sistema e Audio */}
          <div
            className="rounded-lg p-3 bg-white border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] tracking-[0.2em] font-bold text-amber-700"
              >
                FILTRI E CONTROLLI
              </div>
              <button
                onClick={toggleAudio}
                className={`pulsante-hud px-2 py-1 rounded ${!audioAttivo ? 'disattivo' : ''}`}
              >
                {audioAttivo ? (
                  <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> ON</span>
                ) : (
                  <span className="flex items-center gap-1"><VolumeX className="h-3 w-3" /> OFF</span>
                )}
              </button>
            </div>

            {/* Filtri */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Filter className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] tracking-wider text-gray-500 font-mono">
                  FILTRI
                </span>
              </div>

              {/* Filtro stato */}
              <div>
                <label className="text-[9px] tracking-wider mb-0.5 block text-gray-500 font-mono">
                  STATO
                </label>
                <Select
                  value={filtri.stato || 'tutti'}
                  onValueChange={(valore) =>
                    impostaFiltri({ stato: valore === 'tutti' ? '' : valore })
                  }
                >
                  <SelectTrigger
                    className="h-7 text-[10px] bg-white border-gray-200 text-gray-700"
                  >
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-white border-gray-200"
                  >
                    <SelectItem value="tutti">Tutti gli stati</SelectItem>
                    <SelectItem value="ricevuta">Ricevuta</SelectItem>
                    <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                    <SelectItem value="risolta">Risolta</SelectItem>
                    <SelectItem value="archiviata">Archiviata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro urgenza */}
              <div>
                <label className="text-[9px] tracking-wider mb-0.5 block text-gray-500 font-mono">
                  URGENZA
                </label>
                <Select
                  value={filtri.urgenza || 'tutte'}
                  onValueChange={(valore) =>
                    impostaFiltri({ urgenza: valore === 'tutte' ? '' : valore })
                  }
                >
                  <SelectTrigger
                    className="h-7 text-[10px] bg-white border-gray-200 text-gray-700"
                  >
                    <SelectValue placeholder="Tutte" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-white border-gray-200"
                  >
                    <SelectItem value="tutte">Tutte le urgenze</SelectItem>
                    <SelectItem value="bassa">Bassa</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Critica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={() => impostaFiltri({ stato: '', urgenza: '' })}
                className="w-full pulsante-hud py-1 rounded text-[9px] tracking-wider"
              >
                [ RESET FILTRI ]
              </button>
            </div>
          </div>

          {/* Lista segnalazioni */}
          <div
            className="rounded-lg overflow-hidden bg-white border border-gray-200"
          >
            {/* Header lista */}
            <div
              className="px-3 py-2 flex items-center justify-between border-b border-gray-100"
            >
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-amber-600" />
                <span
                  className="text-[10px] tracking-[0.15em] font-bold text-amber-700"
                >
                  SEGNALAZIONI
                </span>
              </div>
              <span
                className="text-[10px] text-gray-400 font-mono"
              >
                {segnalazioni.length} contatti
              </span>
            </div>

            {/* Statistiche rapide */}
            {segnalazioni.length > 0 && (
              <div
                className="px-3 py-1.5 flex gap-3 border-b border-gray-100"
              >
                <span className="text-[9px] font-mono" style={{ color: '#ef4444' }}>
                  ⚠ {contattiCritici} critici
                </span>
                <span className="text-[9px] font-mono" style={{ color: '#f97316' }}>
                  ▲ {contattiAlti} alti
                </span>
              </div>
            )}

            <ScrollArea className="h-[260px] lg:h-[360px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                </div>
              ) : segnalazioni.length === 0 ? (
                <div
                  className="text-center py-8 text-sm text-gray-400"
                >
                  Nessuna segnalazione trovata
                </div>
              ) : (
                <div className="p-1.5 space-y-1">
                  {segnalazioni.map((seg) => (
                    <div
                      key={seg.id}
                      className={`contatto-radar rounded p-2 ${
                        segnalazioneHover === seg.id ? 'ring-1' : ''
                      }`}
                      style={{
                        ringColor: coloriUrgenza[seg.urgenza] + '44',
                        borderColor: segnalazioneHover === seg.id
                          ? coloriUrgenza[seg.urgenza] + '88'
                          : undefined,
                      }}
                      onMouseEnter={() => setSegnalazioneHover(seg.id)}
                      onMouseLeave={() => setSegnalazioneHover(null)}
                      onClick={() => volaAlBersaglio(seg)}
                    >
                      <div className="flex items-start gap-2">
                        {/* Punto lampeggiante urgenza */}
                        <div className="mt-1 flex-shrink-0">
                          <div
                            className={`h-2.5 w-2.5 rounded-full punto-lampeggiante`}
                            style={{
                              backgroundColor: coloriUrgenza[seg.urgenza] || '#eab308',
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* ID Tattico */}
                          <div className="flex items-center justify-between mb-0.5">
                            <span
                              className="text-[10px] font-bold tracking-wider font-mono"
                              style={{
                                color: coloriUrgenza[seg.urgenza] || '#eab308',
                              }}
                            >
                              TGT-{seg.id.slice(0, 5).toUpperCase()}
                            </span>
                            <span
                              className="text-[8px] px-1 py-0 rounded font-mono"
                              style={{
                                backgroundColor: coloriUrgenza[seg.urgenza] + '22',
                                color: coloriUrgenza[seg.urgenza],
                                border: `1px solid ${coloriUrgenza[seg.urgenza]}44`,
                              }}
                            >
                              {etichetteUrgenza[seg.urgenza]}
                            </span>
                          </div>
                          {/* Titolo */}
                          <p
                            className="text-[11px] truncate mb-0.5 text-gray-700"
                          >
                            {seg.titolo}
                          </p>
                          {/* Coordinate */}
                          <p
                            className="text-[9px] text-gray-400 font-mono"
                          >
                            {seg.latitudine.toFixed(4)}N {seg.longitudine.toFixed(4)}E
                          </p>
                          {/* Stato */}
                          <div className="mt-0.5">
                            <span
                              className="text-[8px] px-1 py-0 rounded font-mono"
                              style={{
                                backgroundColor: 'rgba(100,100,100,0.08)',
                                color: '#666',
                                border: '1px solid rgba(100,100,100,0.15)',
                              }}
                            >
                              {etichetteStato[seg.stato] || seg.stato}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Legenda urgenza */}
          <div
            className="rounded-lg p-3 bg-white border border-gray-200"
          >
            <div
              className="text-[10px] tracking-[0.15em] font-bold mb-2 text-amber-700"
            >
              LEGENDA URGENZA
            </div>
            <div className="space-y-1.5">
              {Object.entries(coloriUrgenza).map(([chiave, colore]) => (
                <div key={chiave} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full punto-lampeggiante"
                    style={{ backgroundColor: colore }}
                  />
                  <span
                    className="text-[10px]"
                    style={{ color: colore }}
                  >
                    {etichetteUrgenza[chiave] || chiave}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Mappa Tattica */}
        <div className="lg:col-span-3">
          <div
            className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
          >
            <MappaLeaflet
              segnalazioni={segnalazioni}
              segnalazioneHover={segnalazioneHover}
              bersaglioVolo={bersaglioVolo}
              onSeleziona={selezionaSegnalazione}
              onHover={setSegnalazioneHover}
              audioAttivo={audioAttivo}
              onToggleAudio={toggleAudio}
              onSuonoSelezione={suonoSelezione}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// AudioEngineTattico - definito qui per essere usato in MappaView
class AudioEngineTattico {
  private contesto: AudioContext | null = null;
  attivo: boolean = false;

  inizializza() {
    this.contesto = new AudioContext();
    this.attivo = true;
  }

  suonoSonar() {
    if (!this.contesto || !this.attivo) return;
    const osc = this.contesto.createOscillator();
    const gain = this.contesto.createGain();
    osc.connect(gain);
    gain.connect(this.contesto.destination);
    osc.frequency.setValueAtTime(1200, this.contesto.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.contesto.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.contesto.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.contesto.currentTime + 0.5);
    osc.start();
    osc.stop(this.contesto.currentTime + 0.5);
  }

  suonoSelezione() {
    if (!this.contesto || !this.attivo) return;
    const osc = this.contesto.createOscillator();
    const gain = this.contesto.createGain();
    osc.connect(gain);
    gain.connect(this.contesto.destination);
    osc.frequency.setValueAtTime(880, this.contesto.currentTime);
    gain.gain.setValueAtTime(0.12, this.contesto.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.contesto.currentTime + 0.15);
    osc.start();
    osc.stop(this.contesto.currentTime + 0.15);
  }

  suonoAllarme() {
    if (!this.contesto || !this.attivo) return;
    const osc = this.contesto.createOscillator();
    const gain = this.contesto.createGain();
    osc.connect(gain);
    gain.connect(this.contesto.destination);
    osc.frequency.setValueAtTime(600, this.contesto.currentTime);
    osc.frequency.setValueAtTime(800, this.contesto.currentTime + 0.2);
    osc.frequency.setValueAtTime(600, this.contesto.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, this.contesto.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.contesto.currentTime + 0.6);
    osc.start();
    osc.stop(this.contesto.currentTime + 0.6);
  }

  suonoSuccesso() {
    if (!this.contesto || !this.attivo) return;
    [440, 554, 659].forEach((freq, i) => {
      const osc = this.contesto!.createOscillator();
      const gain = this.contesto!.createGain();
      osc.connect(gain);
      gain.connect(this.contesto!.destination);
      osc.frequency.setValueAtTime(freq, this.contesto!.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.1, this.contesto!.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.contesto!.currentTime + i * 0.12 + 0.2);
      osc.start(this.contesto!.currentTime + i * 0.12);
      osc.stop(this.contesto!.currentTime + i * 0.12 + 0.2);
    });
  }

  muta() { this.attivo = false; }
  attiva() { if (this.contesto) this.attivo = true; }
  distruggi() { this.contesto?.close(); this.contesto = null; this.attivo = false; }
}
