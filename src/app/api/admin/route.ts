// API per la gestione degli utenti admin
// GET: elenco admin (solo super_admin)
// POST: creazione nuovo admin (solo super_admin)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

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

    const admins = await db.adminUtente.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        nome: true,
        email: true,
        telefono: true,
        foto: true,
        ruolo: true,
        attivo: true,
        ultimoAccesso: true,
        createdAt: true,
      },
    });

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

    // Verifica username non già in uso
    const esistente = await db.adminUtente.findUnique({
      where: { username: datiValidati.username },
    });

    if (esistente) {
      return NextResponse.json(
        { errore: 'Username già in uso' },
        { status: 400 }
      );
    }

    const nuovoAdmin = await db.adminUtente.create({
      data: {
        username: datiValidati.username,
        password: datiValidati.password, // In produzione: hash con bcrypt
        nome: datiValidati.nome,
        email: datiValidati.email || null,
        telefono: datiValidati.telefono || null,
        ruolo: datiValidati.ruolo,
        attivo: true,
      },
    });

    // Non restituire la password
    const { password: _, ...adminSenzaPassword } = nuovoAdmin;
    return NextResponse.json(adminSenzaPassword, { status: 201 });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.errors },
        { status: 400 }
      );
    }
    console.error('Errore nella creazione admin:', errore);
    return NextResponse.json({ errore: 'Errore nella creazione dell\'admin' }, { status: 500 });
  }
}
