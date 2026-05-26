// API per aggiornamento impostazioni account admin
// Utilizza il campo JSON credenziali del modello Comune
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseCredenziali } from '@/lib/tenant';

export async function PATCH(request: NextRequest) {
  try {
    const corpo = await request.json();
    const { username } = corpo;

    if (!username) {
      return NextResponse.json(
        { errore: 'Username obbligatorio' },
        { status: 400 }
      );
    }

    const comune = await db.comune.findFirst({ where: { attivo: true } });
    if (!comune) {
      return NextResponse.json(
        { errore: 'Comune non configurato' },
        { status: 404 }
      );
    }

    const credenziali = parseCredenziali(comune.credenziali);
    const account = credenziali.find((c) => c.username === username);
    if (!account) {
      return NextResponse.json(
        { errore: 'Account non trovato' },
        { status: 404 }
      );
    }

    // Le impostazioni (notificheSonoro, notificheBrowser, tema) sono salvate lato client
    // in localStorage perché il modello Comune non ha questi campi.
    // Restituiamo solo i dati dell'account come conferma.
    const { password: _, ...accountSicuro } = account;
    return NextResponse.json({ account: accountSicuro });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nell\'aggiornamento delle impostazioni' },
      { status: 500 }
    );
  }
}
