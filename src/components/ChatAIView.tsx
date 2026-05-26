// Vista Chat AI - Assistente virtuale per normative animali
// Risponde a domande sulle leggi italiane per la tutela degli animali

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  PawPrint,
} from 'lucide-react';

// Interfaccia messaggio
interface Messaggio {
  id: string;
  ruolo: 'user' | 'assistant';
  contenuto: string;
  timestamp: Date;
}

// Domande rapide
const domandeRapide = [
  'Cosa fare se trovo un cane randagio?',
  'Come segnalare un abbandono?',
  'Quali sono le leggi sui randagi?',
  'Come adottare un animale dal canile?',
  'Cosa dice la legge sul maltrattamento?',
];

// Messaggio di benvenuto (dinamico per multi-tenant)
const getMessaggioBenvenuto = (nomeApp: string) =>
  `Ciao! Sono l'assistente virtuale di ${nomeApp} 🐾 Posso aiutarti con informazioni sulle normative per la tutela degli animali, le procedure di segnalazione e i diritti dei cittadini. Come posso aiutarti?`;

export default function ChatAIView() {
  const { configComune } = useStore();
  const [messaggi, setMessaggi] = useState<Messaggio[]>([
    { id: 'welcome', ruolo: 'assistant', contenuto: getMessaggioBenvenuto(configComune.nomeApp), timestamp: new Date() },
  ]);
  const [inputMessaggio, setInputMessaggio] = useState('');
  const [inCaricamento, setInCaricamento] = useState(false);
  const [bannerEmergenza, setBannerEmergenza] = useState(true);
  const fineListaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    fineListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messaggi]);

  const inviaMessaggio = async (testo?: string) => {
    const messaggioUtente = testo || inputMessaggio.trim();
    if (!messaggioUtente || inCaricamento) return;

    setInputMessaggio('');
    const nuovoMessaggio: Messaggio = {
      id: `user-${Date.now()}`,
      ruolo: 'user',
      contenuto: messaggioUtente,
      timestamp: new Date(),
    };

    setMessaggi(prev => [...prev, nuovoMessaggio]);
    setInCaricamento(true);

    try {
      // Prepara la cronologia per il contesto
      const history = messaggi
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.ruolo === 'user' ? 'user' as const : 'assistant' as const,
          content: m.contenuto,
        }));

      const risposta = await fetch('/api/chat-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messaggioUtente, history }),
      });

      const dati = await risposta.json();
      const messaggioAI: Messaggio = {
        id: `ai-${Date.now()}`,
        ruolo: 'assistant',
        contenuto: dati.message || 'Mi dispiace, non sono riuscito a elaborare la risposta. Riprova tra poco.',
        timestamp: new Date(),
      };

      setMessaggi(prev => [...prev, messaggioAI]);
    } catch {
      const messaggioErrore: Messaggio = {
        id: `err-${Date.now()}`,
        ruolo: 'assistant',
        contenuto: `Si è verificato un errore di connessione. Verifica la tua connessione internet e riprova. Nel frattempo, puoi utilizzare l'app per inviare una segnalazione direttamente al ${configComune.nomeComune}.`,
        timestamp: new Date(),
      };
      setMessaggi(prev => [...prev, messaggioErrore]);
    } finally {
      setInCaricamento(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="container mx-auto px-4 space-y-4 pb-4 flex flex-col py-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Banner emergenza */}
      <AnimatePresence>
        {bannerEmergenza && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-red-50 to-yellow-50 border border-red-200 rounded-xl p-3 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Per emergenze animali</p>
              <p className="text-xs text-red-600 mt-0.5">
                Polizia Municipale: {configComune.telefonoEmergenza || 'N/D'} | Guardia Veterinaria: {configComune.telefonoVeterinaria || 'N/D'}
              </p>
            </div>
            <button onClick={() => setBannerEmergenza(false)} className="text-red-400 hover:text-red-600 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intestazione */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-yellow-800">Chat AI</h2>
          <p className="text-xs text-yellow-500">Assistente normative animali</p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-700 border-0 ml-2 text-[10px]">
          <Sparkles className="h-3 w-3 mr-1" />
          AI
        </Badge>
      </div>

      {/* Domande rapide */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {domandeRapide.map((domanda, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300 whitespace-nowrap text-xs shrink-0"
            onClick={() => inviaMessaggio(domanda)}
            disabled={inCaricamento}
          >
            <PawPrint className="h-3 w-3 mr-1.5" />
            {domanda}
          </Button>
        ))}
      </div>

      {/* Area chat */}
      <Card className="border-yellow-200/60 shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(100vh - 420px)' }}>
          {messaggi.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-2.5 ${msg.ruolo === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.ruolo === 'assistant' && (
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shrink-0 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.ruolo === 'user'
                  ? 'bg-yellow-600 text-white rounded-br-md'
                  : 'bg-white border border-yellow-100 text-yellow-900 rounded-bl-md shadow-sm'
              }`}>
                {msg.contenuto}
              </div>
              {msg.ruolo === 'user' && (
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Indicatore digitazione */}
          {inCaricamento && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5 justify-start"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-yellow-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={fineListaRef} />
        </CardContent>

        {/* Input */}
        <div className="p-3 border-t border-yellow-100 bg-yellow-50/30">
          <form
            onSubmit={(e) => { e.preventDefault(); inviaMessaggio(); }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              placeholder="Scrivi un messaggio..."
              value={inputMessaggio}
              onChange={(e) => setInputMessaggio(e.target.value)}
              className="border-yellow-200 focus:border-yellow-500 h-11"
              disabled={inCaricamento}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-yellow-600 hover:bg-yellow-700 text-white h-11 w-11 shrink-0 shadow-md shadow-yellow-600/20 transition-all duration-300 hover:scale-105"
              disabled={inCaricamento || !inputMessaggio.trim()}
            >
              {inCaricamento ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
