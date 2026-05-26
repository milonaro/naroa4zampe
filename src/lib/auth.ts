// Utilità per l'hashing e la verifica delle password
// Utilizza bcryptjs con 12 round di salt per conformità AgID
// Le password nel campo credenziali del modello Comune devono essere hashate

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Genera l'hash bcrypt di una password in chiaro.
 * L'hash risultante ha il formato `$2b$12$...` (versione 2b, 12 round).
 * @param plaintext La password in chiaro
 * @returns L'hash bcrypt come stringa
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Verifica se una password in chiaro corrisponde a un hash bcrypt.
 * Supporta sia hash `$2b$` che `$2a$` (formati bcrypt standard).
 * Supporta anche il confronto in chiaro come fallback per la migrazione
 * (le vecchie credenziali non hashate non iniziano con `$2`).
 * @param plaintext La password inserita dall'utente
 * @param stored Il valore memorizzato (hash bcrypt o, temporaneamente, password in chiaro)
 * @returns true se la password corrisponde
 */
export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<boolean> {
  // Se il valore memorizzato è un hash bcrypt (inizia con $2a$ o $2b$), verifica con bcrypt
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    return bcrypt.compare(plaintext, stored);
  }

  // Fallback per la migrazione: confronto in chiaro per credenziali non ancora hashate
  // Questo permette il login durante il periodo di transizione
  // Dopo aver eseguito lo script di migrazione, questo ramo non sarà più raggiunto
  return plaintext === stored;
}

/**
 * Verifica se una stringa è già un hash bcrypt.
 * Utile per determinare se una credenziale necessita di migrazione.
 * @param value Il valore da controllare
 * @returns true se il valore è un hash bcrypt
 */
export function isHashed(value: string): boolean {
  return value.startsWith('$2a$') || value.startsWith('$2b$');
}
