// API per cambio password account admin
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const account = await db.accountAdmin.findUnique({ where: { username } });
    if (!account) {
      return NextResponse.json(
        { errore: 'Account non trovato' },
        { status: 404 }
      );
    }

    // Verifica password attuale (in produzione: bcrypt compare)
    if (account.password !== passwordAttuale) {
      return NextResponse.json(
        { errore: 'Password attuale non corretta' },
        { status: 401 }
      );
    }

    // Aggiorna password (in produzione: bcrypt hash)
    await db.accountAdmin.update({
      where: { username },
      data: { password: nuovaPassword },
    });

    return NextResponse.json({ successo: true, messaggio: 'Password aggiornata' });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nel cambio password' },
      { status: 500 }
    );
  }
}
