// Componente Header con navigazione principale
// Include logo, pulsanti di navigazione, campanella notifiche, login/logout e menu mobile

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
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Interfaccia per le statistiche
interface Statistiche {
  notificheNonLette: number;
}

// Configurazione delle viste di navigazione
const visteNavigazione: { id: Vista; etichetta: string; icona: React.ReactNode; richiedeAuth?: boolean }[] = [
  { id: 'home', etichetta: 'Home', icona: <Home className="h-4 w-4" /> },
  { id: 'segnala', etichetta: 'Segnala', icona: <FileText className="h-4 w-4" /> },
  { id: 'mappa', etichetta: 'Mappa', icona: <MapPin className="h-4 w-4" /> },
  { id: 'dashboard', etichetta: 'Dashboard', icona: <BarChart3 className="h-4 w-4" />, richiedeAuth: true },
];

export default function Header() {
  const { vistaAttuale, impostaVista, menuMobileAperto, impostaMenuMobile, adminAutenticato, adminNome, logoutAdmin } = useStore();

  // Recupero conteggio notifiche non lette
  const { data: statistiche } = useQuery<Statistiche>({
    queryKey: ['statistiche-notifiche'],
    queryFn: async () => {
      const risposta = await fetch('/api/segnalazioni/stats');
      return risposta.json();
    },
    refetchInterval: 30000,
  });

  // Gestione click su Dashboard
  const gestisciClickDashboard = () => {
    if (!adminAutenticato) {
      impostaVista('dashboard');
    } else {
      impostaVista('dashboard');
    }
  };

  // Gestione logout
  const gestisciLogout = () => {
    logoutAdmin();
    toast.success('Logout effettuato', { description: 'Sessione terminata con successo' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo e titolo */}
        <button
          onClick={() => impostaVista('home')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20">
            <Dog className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-amber-800 leading-tight tracking-tight">
              CaneRandagio
            </span>
            <span className="text-[11px] text-amber-500 font-medium leading-tight">
              Comune di Naro
            </span>
          </div>
        </button>

        {/* Navigazione desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {visteNavigazione.map((vista) => (
            <Button
              key={vista.id}
              variant={vistaAttuale === vista.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => vista.id === 'dashboard' ? gestisciClickDashboard() : impostaVista(vista.id)}
              className={
                vistaAttuale === vista.id
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
              }
            >
              {vista.icona}
              <span className="ml-1.5">{vista.etichetta}</span>
              {vista.richiedeAuth && !adminAutenticato && (
                <LogIn className="ml-1 h-3 w-3 opacity-60" />
              )}
            </Button>
          ))}
        </nav>

        {/* Campanella notifiche, avatar admin e menu mobile */}
        <div className="flex items-center gap-2">
          {/* Campanella notifiche */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-amber-700 hover:text-amber-900 hover:bg-amber-50"
            onClick={() => gestisciClickDashboard()}
          >
            <Bell className="h-5 w-5" />
            {statistiche?.notificheNonLette > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0 animate-pulse">
                {statistiche.notificheNonLette}
              </Badge>
            )}
          </Button>

          {/* Menu admin o login */}
          {adminAutenticato ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-amber-700 hover:bg-amber-50">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{adminNome}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-amber-800">{adminNome}</p>
                  <p className="text-xs text-amber-500">Amministratore</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => impostaVista('dashboard')} className="text-amber-700 cursor-pointer">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={gestisciLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-600 hover:bg-amber-50 hover:text-amber-800 gap-1.5"
              onClick={() => impostaVista('dashboard')}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Admin</span>
            </Button>
          )}

          {/* Menu mobile */}
          <Sheet open={menuMobileAperto} onOpenChange={impostaMenuMobile}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-amber-700">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-amber-700 mb-4 flex items-center gap-2">
                <Dog className="h-5 w-5" />
                Menu di Navigazione
              </SheetTitle>
              <nav className="flex flex-col gap-2">
                {visteNavigazione.map((vista) => (
                  <Button
                    key={vista.id}
                    variant={vistaAttuale === vista.id ? 'default' : 'ghost'}
                    onClick={() => vista.id === 'dashboard' ? gestisciClickDashboard() : impostaVista(vista.id)}
                    className={
                      vistaAttuale === vista.id
                        ? 'bg-amber-600 hover:bg-amber-700 text-white justify-start'
                        : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50 justify-start'
                    }
                  >
                    {vista.icona}
                    <span className="ml-2">{vista.etichetta}</span>
                    {vista.richiedeAuth && !adminAutenticato && (
                      <LogIn className="ml-auto h-3.5 w-3.5 opacity-60" />
                    )}
                  </Button>
                ))}

                {adminAutenticato && (
                  <>
                    <div className="border-t my-2" />
                    <div className="px-3 py-2 bg-emerald-50 rounded-lg flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium text-emerald-800">{adminNome}</p>
                        <p className="text-[10px] text-emerald-500">Amministratore connesso</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 justify-start"
                      onClick={gestisciLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Esci dall&apos;account
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
