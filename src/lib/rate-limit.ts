// Rate limiting per le API pubbliche di a4Zampe
// Utilizza rate-limiter-flexible con store in memoria (adatto a singolo server)
// Per deployment multi-istanza, sostituire con @upstash/ratelimit + Redis

import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter per la creazione di segnalazioni (POST /api/segnalazioni)
// 10 richieste per IP ogni 15 minuti
export const segnalazioniLimiter = new RateLimiterMemory({
  points: 10,             // Numero massimo di richieste
  duration: 15 * 60,      // Finestra temporale: 15 minuti (in secondi)
  blockDuration: 15 * 60, // Blocco per 15 minuti dopo il superamento
});

// Rate limiter per la generazione di token OTP (POST /api/token-accesso)
// 5 richieste per IP ogni 15 minuti (si aggiunge al rate limiting per email)
export const otpLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

// Rate limiter generico per API pubbliche
// 30 richieste per IP ogni minuto
export const genericLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  blockDuration: 60,
});

/**
 * Estrae l'indirizzo IP dal request, tenendo conto dei proxy
 * (X-Forwarded-For, X-Real-IP)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

/**
 * Verifica il rate limit e restituisce una risposta di errore se superato.
 * Ritorna null se il limite non è stato superato (la richiesta può procedere).
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  ip: string
): Promise<Response | null> {
  try {
    await limiter.consume(ip);
    return null;
  } catch {
    return new Response(
      JSON.stringify({
        errore: 'Troppe richieste. Attendi qualche minuto prima di riprovare.',
        successo: false,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '900', // 15 minuti
        },
      }
    );
  }
}
