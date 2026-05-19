// Pagina principale dell'applicazione CaneRandagio Naro
// Gestisce la navigazione tra le diverse viste tramite Zustand store

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import HomeView from '@/components/HomeView';
import SegnalaView from '@/components/SegnalaView';
import MappaView from '@/components/MappaView';
import DashboardView from '@/components/DashboardView';
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

// Componente contenuto principale
function ContenutoPrincipale() {
  const vistaAttuale = useStore((state) => state.vistaAttuale);

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {vistaAttuale === 'home' && <HomeView />}
        {vistaAttuale === 'segnala' && <SegnalaView />}
        {vistaAttuale === 'mappa' && <MappaView />}
        {vistaAttuale === 'dashboard' && <DashboardView />}
      </main>
      <footer className="border-t bg-white/80 backdrop-blur py-4">
        <div className="container mx-auto px-4 text-center text-sm text-amber-600">
          &copy; {new Date().getFullYear()} Comune di Naro &mdash; CaneRandagio Naro &mdash; Servizio di segnalazione cani randagi
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
