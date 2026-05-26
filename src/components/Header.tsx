// Componente Header con navigazione principale
// 6 tab: Home | Segnala | Mappa | Area Personale | Chat AI + Dashboard (solo se autenticato)
// Avatar dropdown quando autenticato, lock icon su dashboard se non autenticato
// Branding dinamico dal config del comune

'use client';

import { useStore, type Vista } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  Home,
  FileText,
  MapPin,
  User,
  MessageSquare,
  BarChart3,
  Bell,
  Menu,
  Dog,
  LogOut,
  Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ETICHETTE_RUOLO } from '@/lib/constants';
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
const visteNavigazione: { id: Vista; etichetta: string; icona: React.ReactNode; richiedeAuth?: boolean; hideDesktop?: boolean }[] = [
  { id: 'home', etichetta: 'Home', icona: <Home className="h-7 w-7" /> },
  { id: 'segnala', etichetta: 'Segnala', icona: <FileText className="h-7 w-7" /> },
  { id: 'mappa', etichetta: 'Mappa', icona: <MapPin className="h-7 w-7" /> },
  { id: 'area-personale', etichetta: 'Area Personale', icona: <User className="h-7 w-7" /> },
  { id: 'chat-ai', etichetta: 'Chat AI', icona: <MessageSquare className="h-7 w-7" /> },
];

export default function Header() {
  const { vistaAttuale, impostaVista, menuMobileAperto, impostaMenuMobile, adminAutenticato, adminNome, adminUsername, adminRuolo, logoutAdmin, configComune } = useStore();

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
    impostaVista('dashboard');
  };

  // Gestione logout
  const gestisciLogout = () => {
    logoutAdmin();
    toast.success('Logout effettuato', { description: 'Sessione terminata con successo' });
  };

  // Etichetta ruolo
  const etichettaRuolo = ETICHETTE_RUOLO;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-yellow-100/50 bg-white/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/75 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo e titolo */}
        <button
          onClick={() => impostaVista('home')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md shadow-yellow-500/30 transition-all duration-300">
            <Dog className="h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-yellow-800 leading-tight tracking-tight">
              {configComune.nomeApp}
            </span>
            <span className="text-[11px] text-yellow-500 font-medium leading-tight">
              {configComune.nomeComune}
            </span>
          </div>
        </button>

        {/* Navigazione desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {visteNavigazione.map((vista) => {
            const attivo = vistaAttuale === vista.id;
            return (
              <Button
                key={vista.id}
                variant={attivo ? 'default' : 'ghost'}
                size="sm"
                onClick={() => impostaVista(vista.id)}
                className={`relative transition-all duration-200 cursor-pointer ${
                  attivo
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm'
                    : 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50'
                }`}
              >
                {vista.icona}
                <span className="ml-1.5">{vista.etichetta}</span>
              </Button>
            );
          })}
          {/* Dashboard - visibile solo se autenticato */}
          {adminAutenticato && (
            <Button
              variant={vistaAttuale === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={gestisciClickDashboard}
              className={`relative transition-all duration-200 cursor-pointer ${
                vistaAttuale === 'dashboard'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm'
                  : 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50'
              }`}
            >
              <BarChart3 className="h-7 w-7" />
              <span className="ml-1.5 hidden xl:inline">Dashboard</span>
            </Button>
          )}
        </nav>

        {/* Campanella notifiche, avatar admin e menu mobile */}
        <div className="flex items-center gap-2">
          {/* Campanella notifiche */}
          {adminAutenticato && (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50 transition-colors cursor-pointer"
              onClick={() => gestisciClickDashboard()}
            >
              <Bell className="h-6 w-6" />
              {(statistiche?.notificheNonLette ?? 0) > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0 animate-pulse">
                  {statistiche?.notificheNonLette}
                </Badge>
              )}
            </Button>
          )}

          {/* Avatar dropdown quando autenticato */}
          {adminAutenticato ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-yellow-700 hover:bg-yellow-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{adminNome}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-yellow-800">{adminNome}</p>
                  <p className="text-xs text-yellow-500">{etichettaRuolo[adminRuolo || ''] || 'Operatore'}</p>
                  {adminUsername && (
                    <p className="text-[10px] text-yellow-400 font-mono">@{adminUsername}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => impostaVista('dashboard')} className="text-yellow-700 cursor-pointer">
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
          ) : null}

          {/* Menu mobile */}
          <Sheet open={menuMobileAperto} onOpenChange={impostaMenuMobile}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-yellow-700 cursor-pointer">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              {/* Header menu mobile */}
              <div className="bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600 p-5 text-white">
                <SheetTitle className="text-white mb-2 flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Dog className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-base font-bold leading-tight">{configComune.nomeApp}</span>
                    <span className="block text-[11px] text-yellow-200 font-normal">{configComune.nomeComune}</span>
                  </div>
                </SheetTitle>
              </div>

              {/* Navigazione mobile */}
              <nav className="flex flex-col gap-1 p-4">
                {[...visteNavigazione, { id: 'dashboard' as Vista, etichetta: 'Dashboard', icona: <BarChart3 className="h-7 w-7" />, richiedeAuth: true }].map((vista) => {
                  const attivo = vistaAttuale === vista.id;
                  // Nascondi Dashboard nel menu mobile se non autenticato
                  if (vista.richiedeAuth && !adminAutenticato) return null;
                  return (
                    <Button
                      key={vista.id}
                      variant={attivo ? 'default' : 'ghost'}
                      onClick={() => vista.id === 'dashboard' ? gestisciClickDashboard() : impostaVista(vista.id)}
                      className={`justify-start transition-all duration-200 cursor-pointer ${
                        attivo
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm'
                          : 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50'
                      }`}
                    >
                      {vista.icona}
                      <span className="ml-2">{vista.etichetta}</span>
                    </Button>
                  );
                })}

                {adminAutenticato && (
                  <>
                    <div className="border-t border-yellow-100 my-3" />
                    <div className="px-3 py-2.5 bg-emerald-50 rounded-lg flex items-center gap-2 border border-emerald-100">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium text-emerald-800">{adminNome}</p>
                        <p className="text-[10px] text-emerald-500">{etichettaRuolo[adminRuolo || ''] || 'Operatore'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 justify-start transition-colors cursor-pointer"
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
