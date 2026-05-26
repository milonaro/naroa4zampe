// Configurazione dinamica multi-comune
// Centralizza tutti i parametri specifici del comune per rendere l'app riutilizzabile
// Ogni deployment ha un solo record Comune nel DB

import type { PrismaClient } from '@prisma/client';

// ─── Interfaccia della configurazione del comune ────────────────────────────
export interface ConfigComune {
  nomeComune: string;          // "Comune di Naro"
  nomeApp: string;             // "Naro a 4 Zampe"
  slug: string;                // "naro"
  latCentro: number;           // 37.2964
  lngCentro: number;           // 13.7764
  raggioKm: number;            // 10
  regione: string;             // "Sicilia"
  provincia: string;           // "AG"
  telefonoEmergenza?: string;  // "0922 411111"
  telefonoVeterinaria?: string;// "0922 412222"
  emailComune?: string;        // "comune@comune.naro.it"
  colorePrimario: string;      // "yellow"
  setupCompletato: boolean;
}

// ─── Credenziali operatore ──────────────────────────────────────────────────
export interface CredenzialeOperatore {
  username: string;
  password: string;
  nome: string;
  ruolo: string;
}

// ─── Config di default (fallback se DB non configurato) ────────────────────
export const CONFIG_DEFAULT: ConfigComune = {
  nomeComune: 'Comune di Naro',
  nomeApp: 'Naro a 4 Zampe',
  slug: 'naro',
  latCentro: 37.2964,
  lngCentro: 13.7764,
  raggioKm: 10,
  regione: 'Sicilia',
  provincia: 'AG',
  telefonoEmergenza: '0922 411111',
  telefonoVeterinaria: '0922 412222',
  emailComune: 'comune@comune.naro.it',
  colorePrimario: 'yellow',
  setupCompletato: true,
};

// ─── Credenziali di default per Naro (legacy) ──────────────────────────────
export const CREDENZIALI_DEFAULT: CredenzialeOperatore[] = [
  { username: 'admin', password: 'Naro2024!', nome: 'Amministratore', ruolo: 'amministratore' },
  { username: 'polizia', password: 'NaroRandagio24', nome: 'Polizia Municipale', ruolo: 'polizia' },
  { username: 'ufficio', password: 'CaninaNaro!', nome: 'Ufficio Animali', ruolo: 'ufficio' },
  { username: 'dogvillage', password: 'DOGVillage24!', nome: 'DOG Village', ruolo: 'canile' },
];

// ─── Funzione per caricare la config dal DB (server-side) ──────────────────
// Chiamata dalle API routes per ottenere i dati del comune
export async function getComuneConfig(db: PrismaClient): Promise<ConfigComune> {
  const comune = await db.comune.findFirst({ where: { attivo: true } });
  if (!comune) return CONFIG_DEFAULT;

  return {
    nomeComune: comune.nomeComune,
    nomeApp: comune.nomeApp,
    slug: comune.slug,
    latCentro: comune.latCentro,
    lngCentro: comune.lngCentro,
    raggioKm: comune.raggioKm,
    regione: comune.regione,
    provincia: comune.provincia,
    telefonoEmergenza: comune.telefonoEmergenza || undefined,
    telefonoVeterinaria: comune.telefonoVeterinaria || undefined,
    emailComune: comune.emailComune || undefined,
    colorePrimario: comune.colorePrimario,
    setupCompletato: comune.setupCompletato,
  };
}

// ─── Funzione per parsare le credenziali dal campo JSON ─────────────────────
export function parseCredenziali(jsonStr: string): CredenzialeOperatore[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore
  }
  return CREDENZIALI_DEFAULT;
}

// Tipo restituito dal DB Prisma
interface ConfigComuneFromDB {
  nomeComune: string;
  nomeApp: string;
  slug: string;
  latCentro: number;
  lngCentro: number;
  raggioKm: number;
  regione: string;
  provincia: string;
  telefonoEmergenza: string | null;
  telefonoVeterinaria: string | null;
  emailComune: string | null;
  colorePrimario: string;
  setupCompletato: boolean;
}

// ─── Placeholder per gli indirizzi ─────────────────────────────────────────
export function getPlaceholderIndirizzo(config: ConfigComune): string {
  return `es. Via Roma 15, ${config.nomeComune.replace('Comune di ', '')}`;
}

// ─── Etichette dinamiche ────────────────────────────────────────────────────
export function getSubtitleSlider(config: ConfigComune): string {
  const nome = config.nomeComune.replace('Comune di ', '');
  return `Segnala animali randagi nel territorio di ${nome}`;
}

export function getTitoloNotifica(config: ConfigComune): string {
  return `${config.nomeApp} — Allarme`;
}

export function getCentroLabel(config: ConfigComune): string {
  const nome = config.nomeComune.replace('Comune di ', '');
  return `Centro di ${nome}`;
}

export function getFuoriZonaMessage(config: ConfigComune): string {
  return `Questa segnalazione è fuori dall'area di competenza del ${config.nomeComune}`;
}

export function getGDPRComune(config: ConfigComune): string {
  return `Responsabile della Protezione dei Dati del ${config.nomeComune}`;
}

export function getPrivacyTerritorio(config: ConfigComune): string {
  const nome = config.nomeComune.replace('Comune di ', '');
  return `nel territorio del ${config.nomeComune}`;
}

export function getEmailDomain(config: ConfigComune): string {
  if (config.emailComune) {
    const parts = config.emailComune.split('@');
    if (parts.length === 2) return parts[1];
  }
  return `comune.${config.slug}.it`;
}
