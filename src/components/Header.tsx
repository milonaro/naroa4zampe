// Componente Header con navigazione principale
// Include logo, pulsanti di navigazione, campanella notifiche e menu mobile

'use client';

import { useStore, type Vista } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  Home,
  FileText,
  MapPin,
  BarChart3,
  Bell,
  Menu,
  Dog,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Interfaccia per le statistiche
interface Statistiche {
  notificheNonLette: number;
}

// Configurazione delle viste di navigazione
const visteNavigazione: { id: Vista; etichetta: string; icona: React.ReactNode }[] = [
  { id: 'home', etichetta: 'Home', icona: <Home className="h-4 w-4" /> },
  { id: 'segnala', etichetta: 'Segnala', icona: <FileText className="h-4 w-4" /> },
  { id: 'mappa', etichetta: 'Mappa', icona: <MapPin className="h-4 w-4" /> },
  { id: 'dashboard', etichetta: 'Dashboard', icona: <BarChart3 className="h-4 w-4" /> },
];

export default function Header() {
  const { vistaAttuale, impostaVista, menuMobileAperto, impostaMenuMobile } = useStore();

  // Recupero conteggio notifiche non lette
  const { data: statistiche } = useQuery<Statistiche>({
    queryKey: ['statistiche-notifiche'],
    queryFn: async () => {
      const risposta = await fetch('/api/segnalazioni/stats');
      return risposta.json();
    },
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo e titolo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-600 text-white">
            <Dog className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-amber-700 leading-tight">
              CaneRandagio
            </span>
            <span className="text-xs text-amber-600 font-medium leading-tight">
              Comune di Naro
            </span>
          </div>
        </div>

        {/* Navigazione desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {visteNavigazione.map((vista) => (
            <Button
              key={vista.id}
              variant={vistaAttuale === vista.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => impostaVista(vista.id)}
              className={
                vistaAttuale === vista.id
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
              }
            >
              {vista.icona}
              <span className="ml-1.5">{vista.etichetta}</span>
            </Button>
          ))}
        </nav>

        {/* Campanella notifiche e menu mobile */}
        <div className="flex items-center gap-2">
          {/* Campanella notifiche */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-amber-700 hover:text-amber-900 hover:bg-amber-50"
            onClick={() => impostaVista('dashboard')}
          >
            <Bell className="h-5 w-5" />
            {statistiche?.notificheNonLette > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0">
                {statistiche.notificheNonLette}
              </Badge>
            )}
          </Button>

          {/* Menu mobile */}
          <Sheet open={menuMobileAperto} onOpenChange={impostaMenuMobile}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-amber-700">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-amber-700 mb-4">Menu di Navigazione</SheetTitle>
              <nav className="flex flex-col gap-2">
                {visteNavigazione.map((vista) => (
                  <Button
                    key={vista.id}
                    variant={vistaAttuale === vista.id ? 'default' : 'ghost'}
                    onClick={() => impostaVista(vista.id)}
                    className={
                      vistaAttuale === vista.id
                        ? 'bg-amber-600 hover:bg-amber-700 text-white justify-start'
                        : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50 justify-start'
                    }
                  >
                    {vista.icona}
                    <span className="ml-2">{vista.etichetta}</span>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
