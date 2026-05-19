// Vista Mappa - Tactical Recon HUD
// Console di comando tattica per la localizzazione di cani randagi a Naro
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

// Colori urgenza neon
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
  in_lavorazione: 'In lavor.',
  risolta: 'Risolta',
  archiviata: 'Archiv.',
};

// Importazione dinamica del componente mappa Leaflet (solo client-side)
const MappaLeaflet = dynamic(() => import('./MappaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center rounded-lg" style={{ background: '#0a0a14' }}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: 'rgba(0,255,200,0.7)' }} />
        <p className="text-sm" style={{ color: 'rgba(0,255,200,0.5)', fontFamily: "'Courier New', monospace" }}>
          INIZIALIZZAZIONE SISTEMA TATTICO...
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
    <div className="space-y-0 pb-0" style={{ background: '#070a10', minHeight: 'calc(100vh - 160px)' }}>
      {/* Intestazione tattica */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="h-5 w-5" style={{ color: 'rgba(0,255,200,0.8)' }} />
          <h2 className="text-xl font-bold tracking-wider" style={{ color: 'rgba(0,255,200,0.9)', fontFamily: "'Courier New', monospace" }}>
            MAPPA TATTICA
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'rgba(0,255,200,0.5)', fontFamily: "'Courier New', monospace" }}>
          Console di ricognizione — Cani randagi sul territorio di Naro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Pannello laterale tattico */}
        <div className="lg:col-span-1 space-y-3">
          {/* Sistema e Audio */}
          <div
            className="rounded-lg p-3"
            style={{
              background: 'rgba(0,10,20,0.85)',
              border: '1px solid rgba(0,255,200,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] tracking-[0.2em] font-bold"
                style={{ color: 'rgba(0,255,200,0.7)', fontFamily: "'Courier New', monospace" }}
              >
                SISTEMA TATTICO
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
                <Filter className="h-3 w-3" style={{ color: 'rgba(0,255,200,0.6)' }} />
                <span className="text-[10px] tracking-wider" style={{ color: 'rgba(0,255,200,0.6)', fontFamily: "'Courier New', monospace" }}>
                  FILTRI
                </span>
              </div>

              {/* Filtro stato */}
              <div>
                <label className="text-[9px] tracking-wider mb-0.5 block" style={{ color: 'rgba(0,255,200,0.4)', fontFamily: "'Courier New', monospace" }}>
                  STATO
                </label>
                <Select
                  value={filtri.stato || 'tutti'}
                  onValueChange={(valore) =>
                    impostaFiltri({ stato: valore === 'tutti' ? '' : valore })
                  }
                >
                  <SelectTrigger
                    className="h-7 text-[10px]"
                    style={{
                      background: 'rgba(0,10,20,0.8)',
                      borderColor: 'rgba(0,255,200,0.3)',
                      color: 'rgba(0,255,200,0.8)',
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: 'rgba(0,10,20,0.95)',
                      borderColor: 'rgba(0,255,200,0.3)',
                      fontFamily: "'Courier New', monospace",
                    }}
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
                <label className="text-[9px] tracking-wider mb-0.5 block" style={{ color: 'rgba(0,255,200,0.4)', fontFamily: "'Courier New', monospace" }}>
                  URGENZA
                </label>
                <Select
                  value={filtri.urgenza || 'tutte'}
                  onValueChange={(valore) =>
                    impostaFiltri({ urgenza: valore === 'tutte' ? '' : valore })
                  }
                >
                  <SelectTrigger
                    className="h-7 text-[10px]"
                    style={{
                      background: 'rgba(0,10,20,0.8)',
                      borderColor: 'rgba(0,255,200,0.3)',
                      color: 'rgba(0,255,200,0.8)',
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    <SelectValue placeholder="Tutte" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: 'rgba(0,10,20,0.95)',
                      borderColor: 'rgba(0,255,200,0.3)',
                      fontFamily: "'Courier New', monospace",
                    }}
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

          {/* Lista contatti radar */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: 'rgba(0,10,20,0.85)',
              border: '1px solid rgba(0,255,200,0.25)',
            }}
          >
            {/* Header lista */}
            <div
              className="px-3 py-2 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,255,200,0.15)' }}
            >
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" style={{ color: 'rgba(0,255,200,0.7)' }} />
                <span
                  className="text-[10px] tracking-[0.15em] font-bold"
                  style={{ color: 'rgba(0,255,200,0.8)', fontFamily: "'Courier New', monospace" }}
                >
                  CONTATTI RADAR
                </span>
              </div>
              <span
                className="text-[10px]"
                style={{ color: 'rgba(0,255,200,0.5)', fontFamily: "'Courier New', monospace" }}
              >
                {segnalazioni.length} TGT
              </span>
            </div>

            {/* Statistiche rapide */}
            {segnalazioni.length > 0 && (
              <div
                className="px-3 py-1.5 flex gap-3"
                style={{ borderBottom: '1px solid rgba(0,255,200,0.1)' }}
              >
                <span className="text-[9px]" style={{ color: '#ff2255', fontFamily: "'Courier New', monospace" }}>
                  ⚠ {contattiCritici} CRIT
                </span>
                <span className="text-[9px]" style={{ color: '#ff8800', fontFamily: "'Courier New', monospace" }}>
                  ▲ {contattiAlti} ALT
                </span>
              </div>
            )}

            <ScrollArea className="h-[260px] lg:h-[360px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(0,255,200,0.6)' }} />
                </div>
              ) : segnalazioni.length === 0 ? (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: 'rgba(0,255,200,0.4)', fontFamily: "'Courier New', monospace" }}
                >
                  NESSUN CONTATTO RILEVATO
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
                              backgroundColor: coloriUrgenza[seg.urgenza] || '#ffcc00',
                              boxShadow: `0 0 6px ${coloriUrgenza[seg.urgenza] || '#ffcc00'}88`,
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* ID Tattico */}
                          <div className="flex items-center justify-between mb-0.5">
                            <span
                              className="text-[10px] font-bold tracking-wider"
                              style={{
                                color: coloriUrgenza[seg.urgenza] || 'rgba(0,255,200,0.8)',
                                fontFamily: "'Courier New', monospace",
                              }}
                            >
                              TGT-{seg.id.slice(0, 5).toUpperCase()}
                            </span>
                            <span
                              className="text-[8px] px-1 py-0 rounded"
                              style={{
                                backgroundColor: coloriUrgenza[seg.urgenza] + '22',
                                color: coloriUrgenza[seg.urgenza],
                                border: `1px solid ${coloriUrgenza[seg.urgenza]}44`,
                                fontFamily: "'Courier New', monospace",
                              }}
                            >
                              {etichetteUrgenza[seg.urgenza]}
                            </span>
                          </div>
                          {/* Titolo */}
                          <p
                            className="text-[11px] truncate mb-0.5"
                            style={{ color: 'rgba(0,255,200,0.75)', fontFamily: "'Courier New', monospace" }}
                          >
                            {seg.titolo}
                          </p>
                          {/* Coordinate */}
                          <p
                            className="text-[9px]"
                            style={{ color: 'rgba(0,255,200,0.4)', fontFamily: "'Courier New', monospace" }}
                          >
                            {seg.latitudine.toFixed(4)}N {seg.longitudine.toFixed(4)}E
                          </p>
                          {/* Stato */}
                          <div className="mt-0.5">
                            <span
                              className="text-[8px] px-1 py-0 rounded"
                              style={{
                                backgroundColor: 'rgba(0,255,200,0.08)',
                                color: 'rgba(0,255,200,0.5)',
                                border: '1px solid rgba(0,255,200,0.15)',
                                fontFamily: "'Courier New', monospace",
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

          {/* Legenda tattica */}
          <div
            className="rounded-lg p-3"
            style={{
              background: 'rgba(0,10,20,0.85)',
              border: '1px solid rgba(0,255,200,0.25)',
            }}
          >
            <div
              className="text-[10px] tracking-[0.15em] font-bold mb-2"
              style={{ color: 'rgba(0,255,200,0.6)', fontFamily: "'Courier New', monospace" }}
            >
              LEGENDA URGENZA
            </div>
            <div className="space-y-1.5">
              {Object.entries(coloriUrgenza).map(([chiave, colore]) => (
                <div key={chiave} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full punto-lampeggiante"
                    style={{ backgroundColor: colore, boxShadow: `0 0 4px ${colore}88` }}
                  />
                  <span
                    className="text-[10px]"
                    style={{ color: colore, fontFamily: "'Courier New', monospace" }}
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
            className="rounded-lg overflow-hidden"
            style={{
              border: '1px solid rgba(0,255,200,0.25)',
              boxShadow: '0 0 20px rgba(0,255,200,0.05)',
            }}
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
