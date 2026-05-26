// API per la gestione degli account amministrativi (RBAC)
// CRUD per account admin con privilegi
// Accessibile solo da super_admin
// Utilizza il campo JSON credenziali del modello Comune

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseCredenziali } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';

// GET: Lista tutti gli account admin
export async function GET() {
  try {
    const comune = await db.comune.findFirst({ where: { attivo: true } });
    const credenziali = comune?.credenziali
      ? parseCredenziali(comune.credenziali)
      : [];

    // Non restituire le password
    const accountsSicuri = credenziali.map((cred, idx) => ({
      id: String(idx + 1),
      username: cred.username,
      nome: cred.nome,
      ruolo: cred.ruolo,
      attivo: true,
      privilegi: [],
    }));

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
    const { username, nome, password, ruolo } = corpo;

    if (!username || !nome || !password) {
      return NextResponse.json(
        { errore: 'Username, nome e password sono obbligatori' },
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

    // Verifica se l'username esiste già
    const esistente = credenziali.find((c) => c.username === username);
    if (esistente) {
      return NextResponse.json(
        { errore: 'Username già in uso' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const nuovaCredenziale = {
      username,
      nome,
      password: hashedPassword,
      ruolo: ruolo || 'operatore',
    };

    const credenzialiAggiornate = [...credenziali, nuovaCredenziale];

    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenzialiAggiornate) },
    });

    const { password: _, ...accountSicuro } = nuovaCredenziale;
    return NextResponse.json({
      account: { ...accountSicuro, id: String(credenzialiAggiornate.length), attivo: true, privilegi: [] },
    }, { status: 201 });
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
    const { id, nome, ruolo } = corpo;

    if (!id) {
      return NextResponse.json(
        { errore: 'ID account obbligatorio' },
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
    const idx = parseInt(id, 10) - 1;

    if (idx < 0 || idx >= credenziali.length) {
      return NextResponse.json(
        { errore: 'Account non trovato' },
        { status: 404 }
      );
    }

    // Aggiorna i campi forniti
    if (nome !== undefined) credenziali[idx].nome = nome;
    if (ruolo !== undefined) credenziali[idx].ruolo = ruolo;

    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenziali) },
    });

    const { password: _, ...accountSicuro } = credenziali[idx];
    return NextResponse.json({
      account: { ...accountSicuro, id, attivo: true, privilegi: [] },
    });
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

    const comune = await db.comune.findFirst({ where: { attivo: true } });
    if (!comune) {
      return NextResponse.json(
        { errore: 'Comune non configurato' },
        { status: 404 }
      );
    }

    const credenziali = parseCredenziali(comune.credenziali);
    const idx = parseInt(id, 10) - 1;

    if (idx < 0 || idx >= credenziali.length) {
      return NextResponse.json(
        { errore: 'Account non trovato' },
        { status: 404 }
      );
    }

    // Non permettere l'eliminazione dell'ultimo admin
    if (credenziali.length <= 1) {
      return NextResponse.json(
        { errore: 'Impossibile eliminare l\'ultimo account' },
        { status: 403 }
      );
    }

    credenziali.splice(idx, 1);

    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenziali) },
    });

    return NextResponse.json({ successo: true });
  } catch {
    return NextResponse.json(
      { errore: 'Errore nell\'eliminazione dell\'account' },
      { status: 500 }
    );
  }
}
