// API per l'autenticazione degli amministratori
// POST: verifica credenziali e restituisce risultato
// Le credenziali sono lette dal record Comune nel database (campo JSON)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { parseCredenziali, CREDENZIALI_DEFAULT } from '@/lib/tenant';

// Schema di validazione per il login
const loginSchema = z.object({
  username: z.string().min(1, 'Username obbligatorio'),
  password: z.string().min(1, 'Password obbligatoria'),
});

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const datiValidati = loginSchema.parse(corpo);

    // Carica credenziali dal database (campo JSON del Comune)
    let credenziali = CREDENZIALI_DEFAULT;
    try {
      const comune = await db.comune.findFirst({ where: { attivo: true } });
      if (comune?.credenziali) {
        credenziali = parseCredenziali(comune.credenziali);
      }
    } catch {
      // Fallback alle credenziali di default
    }

    const utente = credenziali.find(
      (cred) =>
        cred.username === datiValidati.username &&
        cred.password === datiValidati.password
    );

    if (!utente) {
      return NextResponse.json(
        { errore: 'Credenziali non valide', successo: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      successo: true,
      nome: utente.nome,
      username: utente.username,
      ruolo: utente.ruolo,
      messaggio: `Benvenuto, ${utente.nome}!`,
    });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', successo: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { errore: "Errore nell'autenticazione", successo: false },
      { status: 500 }
    );
  }
}
