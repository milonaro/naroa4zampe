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

// Tipo tema accessibilità
export type Tema = 'chiaro' | 'scuro' | 'alto-contrasto';

// Tipo dimensione testo accessibilità
export type DimensioneTesto = 'normale' | 'grande' | 'molto-grande' | 'extra-grande';

// Tipo privilegio RBAC
export type Privilegio =
  | 'segnalazioni_read'
  | 'segnalazioni_write'
  | 'utenti_read'
  | 'notifiche_manage'
  | 'inserimento_manuale'
  | 'admin_manage'
  | 'statistiche_view'
  | 'export_data';

// Costanti privilegi
export const PRIVILEGI_DISPONIBILI: Privilegio[] = [
  'segnalazioni_read',
  'segnalazioni_write',
  'utenti_read',
  'notifiche_manage',
  'inserimento_manuale',
  'admin_manage',
  'statistiche_view',
  'export_data',
];

export const ETICHETTE_PRIVILEGI: Record<Privilegio, string> = {
  segnalazioni_read: 'Lettura segnalazioni',
  segnalazioni_write: 'Scrittura segnalazioni',
  utenti_read: 'Lettura utenti',
  notifiche_manage: 'Gestione notifiche',
  inserimento_manuale: 'Inserimento manuale',
  admin_manage: 'Gestione admin',
  statistiche_view: 'Visualizzazione statistiche',
  export_data: 'Esportazione dati',
};

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
  adminEmail: string | null;
  adminTelefono: string | null;
  adminFoto: string | null;
  // Dialog profilo admin
  profiloAdminAperto: boolean;
  // Configurazione del comune (caricata via API)
  configComune: ConfigComune;
  configComuneCaricata: boolean;
  // Accessibilità
  tema: Tema;
  dimensioneTesto: DimensioneTesto;
  riduzioneAnimazioni: boolean;
  toolbarAccessibilitaAperta: boolean;

  // Azioni
  impostaVista: (vista: Vista) => void;
  selezionaSegnalazione: (id: string | null) => void;
  impostaFiltri: (filtri: Partial<Filtri>) => void;
  impostaMenuMobile: (aperto: boolean) => void;
  loginAdmin: (nome: string, username?: string, email?: string, telefono?: string, foto?: string, ruolo?: string) => void;
  logoutAdmin: () => void;
  impostaConfigComune: (config: ConfigComune) => void;
  impostaProfiloAdmin: (aperto: boolean) => void;
  impostaTema: (tema: Tema) => void;
  impostaDimensioneTesto: (dimensione: DimensioneTesto) => void;
  impostaRiduzioneAnimazioni: (riduci: boolean) => void;
  impostaToolbarAccessibilita: (aperta: boolean) => void;
  isSuperAdmin: () => boolean;
}

// Store principale dell'applicazione
export const useStore = create<StoreApplicazione>((set, get) => ({
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
  adminEmail: null,
  adminTelefono: null,
  adminFoto: null,
  profiloAdminAperto: false,
  configComune: CONFIG_DEFAULT,
  configComuneCaricata: false,
  tema: 'chiaro',
  dimensioneTesto: 'normale',
  riduzioneAnimazioni: false,
  toolbarAccessibilitaAperta: false,

  impostaVista: (vista) => set({ vistaAttuale: vista, menuMobileAperto: false }),
  selezionaSegnalazione: (id) => set({ segnalazioneSelezionata: id }),
  impostaFiltri: (nuoviFiltri) =>
    set((stato) => ({
      filtri: { ...stato.filtri, ...nuoviFiltri },
    })),
  impostaMenuMobile: (aperto) => set({ menuMobileAperto: aperto }),
  loginAdmin: (nome, username, email, telefono, foto, ruolo) => set({
    adminAutenticato: true,
    adminNome: nome,
    adminUsername: username || null,
    adminEmail: email || null,
    adminTelefono: telefono || null,
    adminFoto: foto || null,
    adminRuolo: ruolo || 'amministratore',
  }),
  logoutAdmin: () => set({
    adminAutenticato: false,
    adminNome: null,
    adminUsername: null,
    adminRuolo: null,
    adminEmail: null,
    adminTelefono: null,
    adminFoto: null,
    vistaAttuale: 'home',
  }),
  impostaConfigComune: (config) => set({ configComune: config, configComuneCaricata: true }),
  impostaProfiloAdmin: (aperto) => set({ profiloAdminAperto: aperto }),
  impostaTema: (tema) => set({ tema }),
  impostaDimensioneTesto: (dimensione) => set({ dimensioneTesto: dimensione }),
  impostaRiduzioneAnimazioni: (riduci) => set({ riduzioneAnimazioni: riduci }),
  impostaToolbarAccessibilita: (aperta) => set({ toolbarAccessibilitaAperta: aperta }),
  isSuperAdmin: () => get().adminRuolo === 'amministratore' || get().adminRuolo === 'super_admin',
}));
