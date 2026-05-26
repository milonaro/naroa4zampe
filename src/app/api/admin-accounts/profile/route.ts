// API per aggiornamento profilo account admin
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const corpo = await request.json();
    const { username, nome, email, telefono } = corpo;

    if (!username) {
      return NextResponse.json(
        { errore: 'Username obbligatorio' },
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

    const datiAggiornamento: Record<string, string> = {};
    if (nome !== undefined) datiAggiornamento.nome = nome;
    if (email !== undefined) datiAggiornamento.email = email;
    if (telefono !== undefined) datiAggiornamento.telefono = telefono;

    const accountAggiornato = await db.accountAdmin.update({
      where: { username },
      data: datiAggiornamento,
    });

    const { password: _, ...accountSicuro } = accountAggiornato;
    return NextResponse.json({ account: accountSicuro });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nell\'aggiornamento del profilo' },
      { status: 500 }
    );
  }
}
