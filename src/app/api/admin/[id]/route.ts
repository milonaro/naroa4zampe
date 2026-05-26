// API per la gestione di un singolo admin
// PATCH: aggiorna ruolo/stato attivo (solo super_admin)
// DELETE: disattiva admin (solo super_admin)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema validazione per aggiornamento admin
const aggiornaAdminSchema = z.object({
  ruolo: z.enum(['super_admin', 'admin', 'operatore', 'consultatore']).optional(),
  attivo: z.boolean().optional(),
  nome: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  foto: z.string().optional(),
  ruoloRichiedente: z.string(), // per verifica permessi
});

// PATCH - Aggiorna admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const { ruoloRichiedente, ...datiAggiornamento } = aggiornaAdminSchema.parse(corpo);

    // Solo super_admin può aggiornare i ruoli
    if (ruoloRichiedente !== 'super_admin') {
      return NextResponse.json(
        { errore: 'Solo il Super Admin può modificare i ruoli degli operatori' },
        { status: 403 }
      );
    }

    // Verifica che l'admin esista
    const admin = await db.adminUtente.findUnique({ where: { id } });
    if (!admin) {
      return NextResponse.json({ errore: 'Admin non trovato' }, { status: 404 });
    }

    // Non permettere di disattivare l'ultimo super_admin
    if (admin.ruolo === 'super_admin' && datiAggiornamento.attivo === false) {
      const superAdminCount = await db.adminUtente.count({
        where: { ruolo: 'super_admin', attivo: true },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { errore: 'Impossibile disattivare l\'ultimo Super Admin' },
          { status: 400 }
        );
      }
    }

    const adminAggiornato = await db.adminUtente.update({
      where: { id },
      data: {
        ...datiAggiornamento,
        email: datiAggiornamento.email || undefined,
        telefono: datiAggiornamento.telefono || undefined,
        foto: datiAggiornamento.foto || undefined,
      },
    });

    const { password: _, ...adminSenzaPassword } = adminAggiornato;
    return NextResponse.json(adminSenzaPassword);
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.errors },
        { status: 400 }
      );
    }
    console.error('Errore nell\'aggiornamento admin:', errore);
    return NextResponse.json({ errore: 'Errore nell\'aggiornamento' }, { status: 500 });
  }
}

// DELETE - Disattiva admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const ruoloRichiedente = searchParams.get('ruolo');

    if (ruoloRichiedente !== 'super_admin') {
      return NextResponse.json(
        { errore: 'Solo il Super Admin può disattivare operatori' },
        { status: 403 }
      );
    }

    const admin = await db.adminUtente.findUnique({ where: { id } });
    if (!admin) {
      return NextResponse.json({ errore: 'Admin non trovato' }, { status: 404 });
    }

    // Imposta attivo = false invece di eliminare
    const adminDisattivato = await db.adminUtente.update({
      where: { id },
      data: { attivo: false },
    });

    const { password: _, ...adminSenzaPassword } = adminDisattivato;
    return NextResponse.json(adminSenzaPassword);
  } catch (errore) {
    console.error('Errore nella disattivazione admin:', errore);
    return NextResponse.json({ errore: 'Errore nella disattivazione' }, { status: 500 });
  }
}
