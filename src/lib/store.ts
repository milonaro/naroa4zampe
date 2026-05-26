// Store Zustand per la gestione dello stato dell'applicazione
// Gestisce la navigazione tra le viste, la segnalazione selezionata, i filtri, l'autenticazione
// e la configurazione dinamica del comune

import { create } from 'zustand';
import type { ConfigComune } from '@/lib/tenant';
import { CONFIG_DEFAULT } from '@/lib/tenant';

// Tipi per la vista corrente
export type Vista = 'home' | 'segnala' | 'mappa' | 'dashboard' | 'area-personale' | 'chat-ai' | 'setup';

// Interfaccia per i filtri
export interface Filtri {
  stato: string;
  urgenza: string;
  motivazione: string;
}

// Interfaccia dello store
interface StoreApplicazione {
  // Vista corrente dell'applicazione
  vistaAttuale: Vista;
  // ID della segnalazione selezionata per il dettaglio
  segnalazioneSelezionata: string | null;
  // Filtri attivi per la mappa e la lista
  filtri: Filtri;
  // Stato del menu mobile
  menuMobileAperto: boolean;
  // Autenticazione admin
  adminAutenticato: boolean;
  adminNome: string | null;
  adminUsername: string | null;
  adminRuolo: string | null;
  // Configurazione del comune (caricata via API)
  configComune: ConfigComune;
  configComuneCaricata: boolean;

  // Azioni
  impostaVista: (vista: Vista) => void;
  selezionaSegnalazione: (id: string | null) => void;
  impostaFiltri: (filtri: Partial<Filtri>) => void;
  impostaMenuMobile: (aperto: boolean) => void;
  loginAdmin: (nome: string, username?: string, ruolo?: string) => void;
  logoutAdmin: () => void;
  impostaConfigComune: (config: ConfigComune) => void;
}

// Store principale dell'applicazione
export const useStore = create<StoreApplicazione>((set) => ({
  vistaAttuale: 'home',
  segnalazioneSelezionata: null,
  filtri: {
    stato: '',
    urgenza: '',
    motivazione: '',
  },
  menuMobileAperto: false,
  adminAutenticato: false,
  adminNome: null,
  adminUsername: null,
  adminRuolo: null,
  configComune: CONFIG_DEFAULT,
  configComuneCaricata: false,

  impostaVista: (vista) => set({ vistaAttuale: vista, menuMobileAperto: false }),
  selezionaSegnalazione: (id) => set({ segnalazioneSelezionata: id }),
  impostaFiltri: (nuoviFiltri) =>
    set((stato) => ({
      filtri: { ...stato.filtri, ...nuoviFiltri },
    })),
  impostaMenuMobile: (aperto) => set({ menuMobileAperto: aperto }),
  loginAdmin: (nome, username, ruolo) => set({ adminAutenticato: true, adminNome: nome, adminUsername: username || null, adminRuolo: ruolo || 'amministratore' }),
  logoutAdmin: () => set({ adminAutenticato: false, adminNome: null, adminUsername: null, adminRuolo: null, vistaAttuale: 'home' }),
  impostaConfigComune: (config) => set({ configComune: config, configComuneCaricata: true }),
}));
