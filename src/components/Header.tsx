// Componente Header con navigazione principale
// 6 tab: Home | Segnala | Mappa | Area Personale | Chat AI + Dashboard (solo se autenticato)
// Avatar dropdown quando autenticato, lock icon su dashboard se non autenticato

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
  LogIn,
  LogOut,
  Shield,
  Lock,
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

// Configurazione delle viste di navigazione (senza Dashboard - quella va nel dropdown)
const visteNavigazione: { id: Vista; etichetta: string; icona: React.ReactNode; richiedeAuth?: boolean; hideDesktop?: boolean }[] = [
  { id: 'home', etichetta: 'Home', icona: <Home className="h-4 w-4" /> },
  { id: 'segnala', etichetta: 'Segnala', icona: <FileText className="h-4 w-4" /> },
  { id: 'mappa', etichetta: 'Mappa', icona: <MapPin className="h-4 w-4" /> },
  { id: 'area-personale', etichetta: 'Area Personale', icona: <User className="h-4 w-4" /> },
  { id: 'chat-ai', etichetta: 'Chat AI', icona: <MessageSquare className="h-4 w-4" /> },
];

export default function Header() {
  const { vistaAttuale, impostaVista, menuMobileAperto, impostaMenuMobile, adminAutenticato, adminNome, adminUsername, adminRuolo, logoutAdmin } = useStore();

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
  const etichettaRuolo: Record<string, string> = {
    amministratore: 'Amministratore',
    polizia: 'Polizia Municipale',
    ufficio: 'Ufficio Animali',
    canile: 'DOG Village',
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-100/50 bg-white/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/75 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo e titolo */}
        <button
          onClick={() => impostaVista('home')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 transition-all duration-300">
            <Dog className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-amber-800 leading-tight tracking-tight">
              Naro a 4 Zampe
            </span>
            <span className="text-[11px] text-amber-500 font-medium leading-tight">
              Comune di Naro
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
                className={`relative transition-all duration-200 ${
                  attivo
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                {vista.icona}
                <span className="ml-1.5">{vista.etichetta}</span>
              </Button>
            );
          })}
          {/* Dashboard tab - visibile solo come icona con lock se non autenticato */}
          <Button
            variant={vistaAttuale === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={gestisciClickDashboard}
            className={`relative transition-all duration-200 ${
              vistaAttuale === 'dashboard'
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {!adminAutenticato && <Lock className="ml-1 h-3 w-3 opacity-60" />}
            <span className="ml-1.5 hidden xl:inline">Dashboard</span>
          </Button>
        </nav>

        {/* Campanella notifiche, avatar admin e menu mobile */}
        <div className="flex items-center gap-2">
          {/* Campanella notifiche */}
          {adminAutenticato && (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
              onClick={() => gestisciClickDashboard()}
            >
              <Bell className="h-5 w-5" />
              {statistiche?.notificheNonLette > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0 animate-pulse">
                  {statistiche.notificheNonLette}
                </Badge>
              )}
            </Button>
          )}

          {/* Avatar dropdown quando autenticato */}
          {adminAutenticato ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-amber-700 hover:bg-amber-50 transition-colors">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{adminNome}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-amber-800">{adminNome}</p>
                  <p className="text-xs text-amber-500">{etichettaRuolo[adminRuolo || ''] || 'Operatore'}</p>
                  {adminUsername && (
                    <p className="text-[10px] text-amber-400 font-mono">@{adminUsername}</p>
                  )}
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
          ) : null}

          {/* Menu mobile */}
          <Sheet open={menuMobileAperto} onOpenChange={impostaMenuMobile}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-amber-700">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              {/* Header menu mobile */}
              <div className="bg-gradient-to-br from-amber-600 via-orange-500 to-amber-600 p-5 text-white">
                <SheetTitle className="text-white mb-2 flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Dog className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-base font-bold leading-tight">Naro a 4 Zampe</span>
                    <span className="block text-[11px] text-amber-200 font-normal">Comune di Naro</span>
                  </div>
                </SheetTitle>
              </div>

              {/* Navigazione mobile */}
              <nav className="flex flex-col gap-1 p-4">
                {[...visteNavigazione, { id: 'dashboard' as Vista, etichetta: 'Dashboard', icona: <BarChart3 className="h-4 w-4" />, richiedeAuth: true }].map((vista) => {
                  const attivo = vistaAttuale === vista.id;
                  return (
                    <Button
                      key={vista.id}
                      variant={attivo ? 'default' : 'ghost'}
                      onClick={() => vista.id === 'dashboard' ? gestisciClickDashboard() : impostaVista(vista.id)}
                      className={`justify-start transition-all duration-200 ${
                        attivo
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                          : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      {vista.icona}
                      <span className="ml-2">{vista.etichetta}</span>
                      {vista.richiedeAuth && !adminAutenticato && (
                        <Lock className="ml-auto h-3.5 w-3.5 opacity-60" />
                      )}
                    </Button>
                  );
                })}

                {adminAutenticato && (
                  <>
                    <div className="border-t border-amber-100 my-3" />
                    <div className="px-3 py-2.5 bg-emerald-50 rounded-lg flex items-center gap-2 border border-emerald-100">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium text-emerald-800">{adminNome}</p>
                        <p className="text-[10px] text-emerald-500">{etichettaRuolo[adminRuolo || ''] || 'Operatore'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 justify-start transition-colors"
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
