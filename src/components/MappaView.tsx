// Vista Mappa - Layout full-width
// Filtri e legenda SOPRA la mappa, lista segnalazioni SOTTO la mappa
// Mappa larga quanto la pagina, nessuna sidebar

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Loader2, Volume2, VolumeX, Crosshair, Radio, MapPin, Dog, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { NARO_LAT, NARO_LNG, COLORI_URGENZA_HEX, ETICHETTE_URGENZA, ETICHETTE_STATO, ETICHETTE_MOTIVAZIONE } from '@/lib/constants';

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
  motivazione?: string;
  tipoAnimale?: string;
  razza?: string;
  colore?: string;
  taglia?: string;
  createdAt: string;
}

// Costanti importate da lib/constants.ts

// Importazione dinamica del componente mappa Leaflet
const MappaLeaflet = dynamic(() => import('./MappaLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] flex items-center justify-center bg-gray-50 rounded-xl">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-yellow-600" />
        <p className="text-sm text-gray-500">Caricamento mappa...</p>
      </div>
    </div>
  ),
});

export default function MappaView() {
  const { filtri, impostaFiltri, selezionaSegnalazione } = useStore();
  const [segnalazioneHover, setSegnalazioneHover] = useState<string | null>(null);
  const [bersaglioVolo, setBersaglioVolo] = useState<{ lat: number; lng: number } | null>(null);
  const [audioAttivo, setAudioAttivo] = useState(false);
  const [listaEspansa, setListaEspansa] = useState(true);
  const audioEngineRef = useRef<AudioEngineTattico | null>(null);
  const sonarIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recupero segnalazioni
  const { data, isLoading } = useQuery<{ segnalazioni: Segnalazione[] }>({
    queryKey: ['segnalazioni-mappa', filtri.stato, filtri.urgenza, filtri.motivazione],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtri.stato) params.set('stato', filtri.stato);
      if (filtri.urgenza) params.set('urgenza', filtri.urgenza);
      if (filtri.motivazione) params.set('motivazione', filtri.motivazione);
      params.set('perPagina', '100');
      const risposta = await fetch(`/api/segnalazioni?${params.toString()}`);
      return risposta.json();
    },
  });

  const segnalazioni = data?.segnalazioni || [];

  // Statistiche
  const contattiCritici = segnalazioni.filter(s => s.urgenza === 'critica').length;
  const contattiAlti = segnalazioni.filter(s => s.urgenza === 'alta').length;

  // Audio engine
  const inizializzaAudio = useCallback(() => {
    if (!audioEngineRef.current) {
      const engine = new AudioEngineTattico();
      engine.inizializza();
      audioEngineRef.current = engine;
    }
  }, []);

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

  const suonoSelezione = useCallback(() => {
    if (!audioEngineRef.current) inizializzaAudio();
    if (audioEngineRef.current?.attivo) audioEngineRef.current.suonoSelezione();
  }, [inizializzaAudio]);

  // Sonar periodico
  useEffect(() => {
    if (audioAttivo && audioEngineRef.current?.attivo) {
      sonarIntervalRef.current = setInterval(() => audioEngineRef.current?.suonoSonar(), 4000);
    } else if (sonarIntervalRef.current) {
      clearInterval(sonarIntervalRef.current);
      sonarIntervalRef.current = null;
    }
    return () => { if (sonarIntervalRef.current) clearInterval(sonarIntervalRef.current); };
  }, [audioAttivo]);

  useEffect(() => { return () => { audioEngineRef.current?.distruggi(); }; }, []);

  const volaAlBersaglio = useCallback((seg: Segnalazione) => {
    setBersaglioVolo({ lat: seg.latitudine, lng: seg.longitudine });
    setSegnalazioneHover(seg.id);
    suonoSelezione();
    setTimeout(() => setBersaglioVolo(null), 2000);
  }, [suonoSelezione]);

  const filtriAttivi = !!(filtri.stato || filtri.urgenza || filtri.motivazione);

  return (
    <div className="space-y-4 pb-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-800">Mappa Interattiva</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            {segnalazioni.length} segnalazioni
          </Badge>
          <button
            onClick={toggleAudio}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              audioAttivo
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {audioAttivo ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── BARRA FILTRI + LEGENDA SOPRA LA MAPPA ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro Stato */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Stato:</span>
            <Select
              value={filtri.stato || 'tutti'}
              onValueChange={(valore) => impostaFiltri({ stato: valore === 'tutti' ? '' : valore })}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs bg-white border-gray-200">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="tutti">Tutti gli stati</SelectItem>
                <SelectItem value="ricevuta">Ricevuta</SelectItem>
                <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                <SelectItem value="risolta">Risolta</SelectItem>
                <SelectItem value="archiviata">Archiviata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Urgenza */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Urgenza:</span>
            <Select
              value={filtri.urgenza || 'tutte'}
              onValueChange={(valore) => impostaFiltri({ urgenza: valore === 'tutte' ? '' : valore })}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-gray-200">
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="tutte">Tutte</SelectItem>
                <SelectItem value="bassa">Bassa</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Critica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Motivazione */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Motivazione:</span>
            <Select
              value={filtri.motivazione || 'tutte'}
              onValueChange={(valore) => impostaFiltri({ motivazione: valore === 'tutte' ? '' : valore })}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-gray-200">
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="tutte">Tutte</SelectItem>
                <SelectItem value="randagismo">Randagismo</SelectItem>
                <SelectItem value="abbandono">Abbandono</SelectItem>
                <SelectItem value="maltrattamento">Maltrattamento</SelectItem>
                <SelectItem value="smarrimento">Smarrimento</SelectItem>
                <SelectItem value="rinvenimento">Rinvenimento</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset filtri */}
          {filtriAttivi && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => impostaFiltri({ stato: '', urgenza: '', motivazione: '' })}
              className="h-8 text-xs text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 cursor-pointer"
            >
              ✕ Reset
            </Button>
          )}

          {/* Separatore */}
          <div className="hidden md:block w-px h-6 bg-gray-200" />

          {/* Legenda urgenza */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-medium text-gray-500">Legenda:</span>
            {Object.entries(COLORI_URGENZA_HEX).map(([chiave, colore]) => (
              <div key={chiave} className="flex items-center gap-1">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colore }}
                />
                <span className="text-[11px] text-gray-600">{ETICHETTE_URGENZA[chiave]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiche rapide */}
        {segnalazioni.length > 0 && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100">
            <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              {contattiCritici} critic{contattiCritici === 1 ? 'a' : 'he'}
            </span>
            <span className="text-[11px] text-orange-600 font-medium flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
              {contattiAlti} alt{contattiAlti === 1 ? 'a' : 'e'}
            </span>
          </div>
        )}
      </div>

      {/* ── MAPPA FULL-WIDTH ── */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm -mx-4 md:mx-0">
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

      {/* ── LISTA SEGNALAZIONI SOTTO LA MAPPA ── */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader
          className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
          onClick={() => setListaEspansa(!listaEspansa)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <Radio className="h-4 w-4 text-yellow-600" />
              Lista Segnalazioni
              <Badge className="bg-yellow-100 text-yellow-800 border-0 text-[10px]">
                {segnalazioni.length}
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer">
              {listaEspansa ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {listaEspansa && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                  </div>
                ) : segnalazioni.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nessuna segnalazione trovata
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {segnalazioni.map((seg) => (
                      <motion.div
                        key={seg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                          segnalazioneHover === seg.id
                            ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-200'
                            : 'border-gray-100 bg-white hover:border-yellow-200 hover:bg-yellow-50/50'
                        }`}
                        style={{
                          borderLeftWidth: '3px',
                          borderLeftColor: COLORI_URGENZA_HEX[seg.urgenza] || '#eab308',
                        }}
                        onMouseEnter={() => setSegnalazioneHover(seg.id)}
                        onMouseLeave={() => setSegnalazioneHover(null)}
                        onClick={() => volaAlBersaglio(seg)}
                      >
                        {/* Icona */}
                        <div className="flex items-center justify-center h-9 w-9 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: COLORI_URGENZA_HEX[seg.urgenza] + '18' }}
                        >
                          <Dog className="h-4 w-4" style={{ color: COLORI_URGENZA_HEX[seg.urgenza] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{seg.titolo}</p>
                          {seg.indirizzo && (
                            <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {seg.indirizzo}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: COLORI_URGENZA_HEX[seg.urgenza] + '18',
                                color: COLORI_URGENZA_HEX[seg.urgenza],
                              }}
                            >
                              {ETICHETTE_URGENZA[seg.urgenza]}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {ETICHETTE_STATO[seg.stato]}
                            </span>
                            {seg.motivazione && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                                {ETICHETTE_MOTIVAZIONE[seg.motivazione] || seg.motivazione}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(seg.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

// AudioEngineTattico
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

  muta() { this.attivo = false; }
  attiva() { if (this.contesto) this.attivo = true; }
  distruggi() { this.contesto?.close(); this.contesto = null; this.attivo = false; }
}
