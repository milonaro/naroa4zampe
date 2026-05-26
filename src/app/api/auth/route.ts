// API per l'autenticazione degli amministratori
// POST: verifica credenziali e restituisce risultato
// Le credenziali sono lette dal record Comune nel database (campo JSON)
// Le password sono hashate con bcryptjs (FIX-01)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { parseCredenziali, CREDENZIALI_DEFAULT } from '@/lib/tenant';
import { verifyPassword } from '@/lib/auth';

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

    // Cerca l'utente per username, poi verifica la password con bcrypt
    const utente = credenziali.find(
      (cred) => cred.username === datiValidati.username
    );

    if (!utente) {
      return NextResponse.json(
        { errore: 'Credenziali non valide', successo: false },
        { status: 401 }
      );
    }

    // Verifica la password usando bcrypt (supporta sia hash che chiaro per migrazione)
    const passwordCorretta = await verifyPassword(datiValidati.password, utente.password);

    if (!passwordCorretta) {
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
