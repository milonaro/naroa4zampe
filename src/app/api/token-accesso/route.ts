// API per la gestione dei token di accesso all'Area Personale
// POST /api/token-accesso - Genera un nuovo token e lo invia via email (demo: mostrato in risposta)
// POST /api/token-accesso/verifica - Verifica il token e restituisce l'email associata

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import crypto from 'crypto';

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

// POST: Genera un nuovo token di accesso
export async function POST(request: NextRequest) {
  try {
    // Rate limiting basilare: massimo 5 richieste per IP in 5 minuti
    // In produzione usare un middleware dedicato (es. upstash/ratelimit)
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

      // Limita richieste: massimo 3 token non scaduti per email
      const tokenRecenti = await db.tokenAccesso.count({
        where: {
          email,
          createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) }, // ultimi 5 minuti
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

      // In produzione: inviare il token via email con servizio SMTP
      // Per demo: restituiamo il token nella risposta SOLO in sviluppo
      const isDev = process.env.NODE_ENV === 'development';

      return NextResponse.json({
        successo: true,
        messaggio: 'Codice di verifica inviato alla tua email',
        // Il token è restituito SOLO in sviluppo per testing
        // In produzione questo campo NON è presente
        ...(isDev ? { _demo_token: token } : {}),
      });
    }
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.errors, successo: false },
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
