// API per la gestione degli account amministrativi (RBAC)
// CRUD per account admin con privilegi
// Accessibile solo da super_admin

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Lista tutti gli account admin
export async function GET() {
  try {
    const accounts = await db.accountAdmin.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Non restituire le password
    const accountsSicuri = accounts.map((account) => {
      const { password: _pwd, ...safeAccount } = account;
      return {
        ...safeAccount,
        privilegi: JSON.parse(safeAccount.privilegi || '[]'),
      };
    });

    return NextResponse.json({ accounts: accountsSicuri });
  } catch (err) {
    console.error('Errore admin-accounts GET:', err);
    return NextResponse.json(
      { errore: 'Errore nel recupero degli account', dettaglio: String(err) },
      { status: 500 }
    );
  }
}

// POST: Crea nuovo account admin
export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const { username, nome, password, ruolo, privilegi } = corpo;

    if (!username || !nome || !password) {
      return NextResponse.json(
        { errore: 'Username, nome e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica se l'username esiste già
    const esistente = await db.accountAdmin.findUnique({
      where: { username },
    });

    if (esistente) {
      return NextResponse.json(
        { errore: 'Username già in uso' },
        { status: 409 }
      );
    }

    const nuovoAccount = await db.accountAdmin.create({
      data: {
        username,
        nome,
        password, // In produzione: hash bcrypt
        ruolo: ruolo || 'operatore',
        privilegi: JSON.stringify(privilegi || []),
      },
    });

    const { password: _, ...accountSicuro } = nuovoAccount;
    return NextResponse.json({ account: { ...accountSicuro, privilegi: JSON.parse(accountSicuro.privilegi || '[]') } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nella creazione dell\'account' },
      { status: 500 }
    );
  }
}

// PATCH: Aggiorna account admin
export async function PATCH(request: NextRequest) {
  try {
    const corpo = await request.json();
    const { id, attivo, privilegi, nome, email, telefono } = corpo;

    if (!id) {
      return NextResponse.json(
        { errore: 'ID account obbligatorio' },
        { status: 400 }
      );
    }

    const datiAggiornamento: Record<string, unknown> = {};
    if (attivo !== undefined) datiAggiornamento.attivo = attivo;
    if (privilegi !== undefined) datiAggiornamento.privilegi = JSON.stringify(privilegi);
    if (nome !== undefined) datiAggiornamento.nome = nome;
    if (email !== undefined) datiAggiornamento.email = email;
    if (telefono !== undefined) datiAggiornamento.telefono = telefono;

    const accountAggiornato = await db.accountAdmin.update({
      where: { id },
      data: datiAggiornamento,
    });

    const { password: _, ...accountSicuro } = accountAggiornato;
    return NextResponse.json({ account: { ...accountSicuro, privilegi: JSON.parse(accountSicuro.privilegi || '[]') } });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nell\'aggiornamento dell\'account' },
      { status: 500 }
    );
  }
}

// DELETE: Elimina account admin
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { errore: 'ID account obbligatorio' },
        { status: 400 }
      );
    }

    // Non permettere l'eliminazione di super_admin
    const account = await db.accountAdmin.findUnique({ where: { id } });
    if (account?.ruolo === 'super_admin') {
      return NextResponse.json(
        { errore: 'Impossibile eliminare un account Super Admin' },
        { status: 403 }
      );
    }

    await db.accountAdmin.delete({ where: { id } });
    return NextResponse.json({ successo: true });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nell\'eliminazione dell\'account' },
      { status: 500 }
    );
  }
}
