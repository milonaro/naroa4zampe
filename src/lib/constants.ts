// Costanti condivise per l'applicazione multi-comune "a 4 Zampe"
// Centralizza etichette, colori e configurazioni usate in più componenti
// Le coordinate e i dati specifici del comune sono in src/lib/tenant.ts

// Re-export tenant types and config for convenience
export { CONFIG_DEFAULT, type ConfigComune } from './tenant';

// ─── Colori Urgenza (esadecimali per Leaflet / stile inline) ─────────────────
export const COLORI_URGENZA_HEX: Record<string, string> = {
  bassa: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
};

// ─── Colori Urgenza (classi Tailwind per badge/chip) ──────────────────────────
export const COLORI_URGENZA_BADGE: Record<string, string> = {
  bassa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

// ─── Colori Stato (classi Tailwind per badge) ────────────────────────────────
export const COLORI_STATO_BADGE: Record<string, string> = {
  ricevuta: 'bg-sky-100 text-sky-800',
  in_lavorazione: 'bg-yellow-100 text-yellow-800',
  risolta: 'bg-emerald-100 text-emerald-800',
  archiviata: 'bg-gray-100 text-gray-800',
};

// ─── Colori Motivazione (classi Tailwind) ────────────────────────────────────
export const COLORI_MOTIVAZIONE_BADGE: Record<string, string> = {
  randagismo: 'bg-yellow-100 text-yellow-800',
  abbandono: 'bg-red-100 text-red-800',
  maltrattamento: 'bg-purple-100 text-purple-800',
  smarrimento: 'bg-sky-100 text-sky-800',
  rinvenimento: 'bg-teal-100 text-teal-800',
  altro: 'bg-gray-100 text-gray-800',
};

// ─── Colori Tipo Animale (classi Tailwind) ──────────────────────────────────
export const COLORI_TIPO_BADGE: Record<string, string> = {
  cane: 'bg-yellow-100 text-yellow-800',
  gatto: 'bg-indigo-100 text-indigo-800',
  altro: 'bg-slate-100 text-slate-800',
};

// ─── Etichette in italiano ──────────────────────────────────────────────────
export const ETICHETTE_URGENZA: Record<string, string> = {
  bassa: 'Bassa',
  media: 'Media',
  alta: 'Alta',
  critica: 'Critica',
};

export const ETICHETTE_STATO: Record<string, string> = {
  ricevuta: 'Ricevuta',
  in_lavorazione: 'In lavorazione',
  risolta: 'Risolta',
  archiviata: 'Archiviata',
};

export const ETICHETTE_MOTIVAZIONE: Record<string, string> = {
  randagismo: 'Randagismo',
  abbandono: 'Abbandono',
  maltrattamento: 'Maltrattamento',
  smarrimento: 'Smarrimento',
  rinvenimento: 'Rinvenimento',
  altro: 'Altro',
};

export const ETICHETTE_TIPO: Record<string, string> = {
  cane: 'Cane 🐕',
  gatto: 'Gatto 🐈',
  altro: 'Altro 🐾',
};

export const ETICHETTE_TAGLIA: Record<string, string> = {
  piccola: 'Piccola',
  media: 'Media',
  grande: 'Grande',
  molto_grande: 'Molto grande',
};

// ─── Etichette Ruolo Admin ──────────────────────────────────────────────────
export const ETICHETTE_RUOLO: Record<string, string> = {
  amministratore: 'Amministratore',
  polizia: 'Polizia Municipale',
  ufficio: 'Ufficio Animali',
  canile: 'DOG Village',
};

// ─── Colori per grafici Recharts ────────────────────────────────────────────
export const COLORI_URGENZA_CHART: Record<string, string> = {
  bassa: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
};
