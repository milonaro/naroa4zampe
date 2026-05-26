// Pagina principale dell'applicazione multi-comune "a 4 Zampe"
// Gestisce la navigazione tra le diverse viste tramite Zustand store
// Carica la configurazione del comune all'avvio

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import type { ConfigComune } from '@/lib/tenant';
import Header from '@/components/Header';
import HomeView from '@/components/HomeView';
import SegnalaView from '@/components/SegnalaView';
import MappaView from '@/components/MappaView';
import DashboardView from '@/components/DashboardView';
import LoginView from '@/components/LoginView';
import AreaPersonaleView from '@/components/AreaPersonaleView';
import ChatAIView from '@/components/ChatAIView';
import DettaglioSegnalazione from '@/components/DettaglioSegnalazione';
import SetupView from '@/components/SetupView';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Componente provider per React Query
function ProviderQuery({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Varianti animazione per cambio vista
const vistaVariante = {
  iniziale: { opacity: 0, y: 12 },
  finale: { opacity: 1, y: 0 },
  uscita: { opacity: 0, y: -8 },
};

// Componente contenuto principale
function ContenutoPrincipale() {
  const vistaAttuale = useStore((state) => state.vistaAttuale);
  const adminAutenticato = useStore((state) => state.adminAutenticato);
  const impostaConfigComune = useStore((state) => state.impostaConfigComune);
  const configComune = useStore((state) => state.configComune);
  const configComuneCaricata = useStore((state) => state.configComuneCaricata);

  // Carica configurazione del comune all'avvio
  useEffect(() => {
    async function caricaConfig() {
      try {
        const r = await fetch('/api/comune');
        if (r.ok) {
          const config: ConfigComune = await r.json();
          impostaConfigComune(config);
          // Se setup non completato, mostra la pagina di setup
          if (!config.setupCompletato) {
            useStore.getState().impostaVista('setup');
          }
        }
      } catch {
        // Usa la config di default (Naro)
        impostaConfigComune(configComune);
      }
    }
    if (!configComuneCaricata) {
      caricaConfig();
    }
  }, [configComuneCaricata, impostaConfigComune, configComune]);

  // Determina cosa mostrare per la vista dashboard
  const renderVista = () => {
    if (vistaAttuale === 'setup') return <SetupView />;
    if (vistaAttuale === 'dashboard' && !adminAutenticato) {
      return <LoginView />;
    }
    switch (vistaAttuale) {
      case 'home': return <HomeView />;
      case 'segnala': return <SegnalaView />;
      case 'mappa': return <MappaView />;
      case 'dashboard': return <DashboardView />;
      case 'area-personale': return <AreaPersonaleView />;
      case 'chat-ai': return <ChatAIView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/50 to-white">
      {vistaAttuale !== 'setup' && <Header />}
      <main className="flex-1 overflow-x-hidden">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={vistaAttuale + (adminAutenticato ? '-auth' : '-guest')}
              variants={vistaVariante}
              initial="iniziale"
              animate="finale"
              exit="uscita"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderVista()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      {vistaAttuale !== 'setup' && <Footer />}
      <DettaglioSegnalazione />
    </div>
  );
}

// Componente pagina principale
export default function Home() {
  return (
    <ProviderQuery>
      <ContenutoPrincipale />
      <Toaster position="top-right" richColors />
    </ProviderQuery>
  );
}
