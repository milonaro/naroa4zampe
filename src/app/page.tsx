// Pagina principale dell'applicazione CaneRandagio Naro
// Gestisce la navigazione tra le diverse viste tramite Zustand store

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import HomeView from '@/components/HomeView';
import SegnalaView from '@/components/SegnalaView';
import MappaView from '@/components/MappaView';
import DashboardView from '@/components/DashboardView';
import LoginView from '@/components/LoginView';
import DettaglioSegnalazione from '@/components/DettaglioSegnalazione';

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

  // Determina cosa mostrare per la vista dashboard
  const renderVista = () => {
    if (vistaAttuale === 'dashboard' && !adminAutenticato) {
      return <LoginView />;
    }
    switch (vistaAttuale) {
      case 'home': return <HomeView />;
      case 'segnala': return <SegnalaView />;
      case 'mappa': return <MappaView />;
      case 'dashboard': return <DashboardView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/50 to-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={vistaAttuale + (adminAutenticato ? '-auth' : '-guest')}
            variants={vistaVariante}
            initial="iniziale"
            animate="finale"
            exit="uscita"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {renderVista()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t bg-white/80 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 text-center text-sm text-amber-500">
          &copy; {new Date().getFullYear()} Comune di Naro &mdash; CaneRandagio &mdash; Servizio segnalazione cani randagi
        </div>
      </footer>
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
