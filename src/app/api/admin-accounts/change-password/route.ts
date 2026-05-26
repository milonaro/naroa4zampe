// API per cambio password account admin
// Utilizza il campo JSON credenziali del modello Comune
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseCredenziali } from '@/lib/tenant';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const { username, passwordAttuale, nuovaPassword } = corpo;

    if (!username || !passwordAttuale || !nuovaPassword) {
      return NextResponse.json(
        { errore: 'Tutti i campi sono obbligatori' },
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

    // Verifica password attuale
    const passwordCorretta = await verifyPassword(passwordAttuale, account.password);
    if (!passwordCorretta) {
      return NextResponse.json(
        { errore: 'Password attuale non corretta' },
        { status: 401 }
      );
    }

    // Aggiorna password con hash
    account.password = await hashPassword(nuovaPassword);

    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenziali) },
    });

    return NextResponse.json({ successo: true, messaggio: 'Password aggiornata' });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nel cambio password' },
      { status: 500 }
    );
  }
}
