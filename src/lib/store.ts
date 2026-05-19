// Store Zustand per la gestione dello stato dell'applicazione
// Gestisce la navigazione tra le viste, la segnalazione selezionata e i filtri

import { create } from 'zustand';

// Tipi per la vista corrente
export type Vista = 'home' | 'segnala' | 'mappa' | 'dashboard';

// Interfaccia per i filtri
export interface Filtri {
  stato: string;
  urgenza: string;
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

  // Azioni
  impostaVista: (vista: Vista) => void;
  selezionaSegnalazione: (id: string | null) => void;
  impostaFiltri: (filtri: Partial<Filtri>) => void;
  impostaMenuMobile: (aperto: boolean) => void;
}

// Store principale dell'applicazione
export const useStore = create<StoreApplicazione>((set) => ({
  vistaAttuale: 'home',
  segnalazioneSelezionata: null,
  filtri: {
    stato: '',
    urgenza: '',
  },
  menuMobileAperto: false,

  impostaVista: (vista) => set({ vistaAttuale: vista, menuMobileAperto: false }),
  selezionaSegnalazione: (id) => set({ segnalazioneSelezionata: id }),
  impostaFiltri: (nuoviFiltri) =>
    set((stato) => ({
      filtri: { ...stato.filtri, ...nuoviFiltri },
    })),
  impostaMenuMobile: (aperto) => set({ menuMobileAperto: aperto }),
}));
