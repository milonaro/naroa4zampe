// API per la gestione dei token di accesso all'Area Personale
// POST /api/token-accesso - Genera un nuovo token e lo invia via email (FIX-02)
// Se il corpo contiene { email, token } → verifica il token

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendOtpEmail } from '@/lib/email';
import { getComuneConfig } from '@/lib/tenant';
import { otpLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit';

// Schema validazione per richiesta token
const richiediTokenSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
});

// Schema validazione per verifica token
const verificaTokenSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
  token: z.string().length(6, 'Il codice deve essere di 6 cifre'),
});

// Genera un token numerico a 6 cifre usando crypto sicuro
function generaToken(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// POST: Genera un nuovo token di accesso o verifica un token esistente
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 richieste per IP ogni 15 minuti (si aggiunge al per-email)
    const ip = getClientIp(request);
    const rateLimitResponse = await checkRateLimit(otpLimiter, ip);
    if (rateLimitResponse) return rateLimitResponse;

    const corpo = await request.json();

    // Controlla se è una richiesta di verifica o generazione
    if ('token' in corpo) {
      // VERIFICA TOKEN
      const datiValidati = verificaTokenSchema.parse(corpo);

      // Cerca il token più recente per questa email
      const tokenRecord = await db.tokenAccesso.findFirst({
        where: {
          email: datiValidati.email.toLowerCase().trim(),
          token: datiValidati.token,
          usato: false,
          scadenza: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!tokenRecord) {
        return NextResponse.json(
          { errore: 'Codice non valido o scaduto. Richiedi un nuovo codice.', successo: false },
          { status: 400 }
        );
      }

      // Segna il token come usato
      await db.tokenAccesso.update({
        where: { id: tokenRecord.id },
        data: { usato: true },
      });

      return NextResponse.json({
        successo: true,
        email: tokenRecord.email,
        messaggio: 'Verifica completata con successo',
      });
    } else {
      // GENERAZIONE TOKEN
      const datiValidati = richiediTokenSchema.parse(corpo);
      const email = datiValidati.email.toLowerCase().trim();

      // Limita richieste: massimo 3 token non scaduti per email in 5 minuti
      const tokenRecenti = await db.tokenAccesso.count({
        where: {
          email,
          createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (tokenRecenti >= 3) {
        return NextResponse.json(
          { errore: 'Troppe richieste. Attendi qualche minuto prima di richiedere un nuovo codice.', successo: false },
          { status: 429 }
        );
      }

      // Invalida eventuali token precedenti non usati per questa email
      await db.tokenAccesso.updateMany({
        where: { email, usato: false },
        data: { usato: true },
      });

      // Genera nuovo token (scadenza: 15 minuti)
      const token = generaToken();
      const scadenza = new Date(Date.now() + 15 * 60 * 1000);

      await db.tokenAccesso.create({
        data: {
          email,
          token,
          scadenza,
        },
      });

      // Invia il token via email (FIX-02)
      let nomeComune = 'Comune di Naro';
      try {
        const config = await getComuneConfig(db);
        nomeComune = config.nomeComune;
      } catch {
        // fallback al default
      }

      const emailResult = await sendOtpEmail(email, token, nomeComune);

      if (!emailResult.success) {
        console.error('Errore nell\'invio dell\'email OTP:', emailResult.error);
        // Non esponiamo il token al client nemmeno in caso di errore email
        // In sviluppo, il token è loggato nella console del server
      }

      // In sviluppo (senza SMTP configurato), restituiamo il token come _demo_token
      // per permettere il testing dell'Area Personale
      // In produzione con SMTP reale, il token NON viene mai esposto al client
      const isDevMode = !process.env.RESEND_API_KEY;

      return NextResponse.json({
        successo: true,
        messaggio: 'Codice di verifica inviato alla tua email',
        ...(isDevMode ? { _demo_token: token } : {}),
      });
    }
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.issues, successo: false },
        { status: 400 }
      );
    }
    console.error('Errore token accesso:', errore);
    return NextResponse.json(
      { errore: "Errore nella generazione del codice", successo: false },
      { status: 500 }
    );
  }
}
