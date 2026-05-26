// API per la gestione degli utenti admin
// GET: elenco admin (solo super_admin)
// POST: creazione nuovo admin (solo super_admin)
// Utilizza il campo JSON credenziali del modello Comune

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { parseCredenziali, CREDENZIALI_DEFAULT } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';

// Schema validazione per nuovo admin
const creaAdminSchema = z.object({
  username: z.string().min(3, 'Username deve avere almeno 3 caratteri'),
  password: z.string().min(4, 'Password deve avere almeno 4 caratteri'),
  nome: z.string().min(2, 'Nome deve avere almeno 2 caratteri'),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  ruolo: z.enum(['super_admin', 'admin', 'operatore', 'consultatore']).default('operatore'),
});

// GET - Elenco admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const richiedenteRuolo = searchParams.get('ruolo');

    // Solo super_admin può vedere la lista
    if (richiedenteRuolo !== 'super_admin') {
      return NextResponse.json(
        { errore: 'Accesso non autorizzato. Solo il Super Admin può gestire gli operatori.' },
        { status: 403 }
      );
    }

    // Leggi credenziali dal record Comune
    const comune = await db.comune.findFirst({ where: { attivo: true } });
    const credenziali = comune?.credenziali
      ? parseCredenziali(comune.credenziali)
      : CREDENZIALI_DEFAULT;

    // Mappa le credenziali come oggetti admin (senza password)
    const admins = credenziali.map((cred, idx) => ({
      id: String(idx + 1),
      username: cred.username,
      nome: cred.nome,
      ruolo: cred.ruolo,
      attivo: true,
      createdAt: comune?.createdAt || new Date(),
    }));

    return NextResponse.json({ admins });
  } catch (errore) {
    console.error('Errore nel recupero admin:', errore);
    return NextResponse.json({ errore: 'Errore nel recupero degli admin' }, { status: 500 });
  }
}

// POST - Creazione nuovo admin
export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const { ruolo: ruoloRichiedente, ...datiAdmin } = corpo;

    // Solo super_admin può creare nuovi admin
    if (ruoloRichiedente !== 'super_admin') {
      return NextResponse.json(
        { errore: 'Solo il Super Admin può creare nuovi operatori' },
        { status: 403 }
      );
    }

    const datiValidati = creaAdminSchema.parse(datiAdmin);

    // Leggi credenziali esistenti dal record Comune
    const comune = await db.comune.findFirst({ where: { attivo: true } });
    if (!comune) {
      return NextResponse.json(
        { errore: 'Nessuna configurazione comune trovata' },
        { status: 404 }
      );
    }

    const credenziali = parseCredenziali(comune.credenziali);

    // Verifica username non già in uso
    const esistente = credenziali.find((c) => c.username === datiValidati.username);
    if (esistente) {
      return NextResponse.json(
        { errore: 'Username già in uso' },
        { status: 400 }
      );
    }

    // Hasha la password e aggiungi la nuova credenziale
    const hashedPassword = await hashPassword(datiValidati.password);
    const nuovaCredenziale = {
      username: datiValidati.username,
      password: hashedPassword,
      nome: datiValidati.nome,
      ruolo: datiValidati.ruolo,
    };

    const credenzialiAggiornate = [...credenziali, nuovaCredenziale];

    // Salva nel campo JSON del Comune
    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenzialiAggiornate) },
    });

    // Non restituire la password
    const { password: _, ...adminSenzaPassword } = nuovaCredenziale;
    return NextResponse.json({ ...adminSenzaPassword, id: String(credenzialiAggiornate.length) }, { status: 201 });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.issues },
        { status: 400 }
      );
    }
    console.error('Errore nella creazione admin:', errore);
    return NextResponse.json({ errore: 'Errore nella creazione dell\'admin' }, { status: 500 });
  }
}
