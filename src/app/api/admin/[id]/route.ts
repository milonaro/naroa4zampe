// API per la gestione di un singolo admin
// PATCH: aggiorna ruolo/stato attivo (solo super_admin)
// DELETE: disattiva admin (solo super_admin)
// Utilizza il campo JSON credenziali del modello Comune

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { parseCredenziali } from '@/lib/tenant';

// Schema validazione per aggiornamento admin
const aggiornaAdminSchema = z.object({
  ruolo: z.enum(['super_admin', 'admin', 'operatore', 'consultatore']).optional(),
  attivo: z.boolean().optional(),
  nome: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  ruoloRichiedente: z.string(), // per verifica permessi
});

// Helper: leggi e aggiorna credenziali nel record Comune
async function getComuneAndCredenziali() {
  const comune = await db.comune.findFirst({ where: { attivo: true } });
  if (!comune) return null;
  const credenziali = parseCredenziali(comune.credenziali);
  return { comune, credenziali };
}

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

    const result = await getComuneAndCredenziali();
    if (!result) {
      return NextResponse.json({ errore: 'Comune non trovato' }, { status: 404 });
    }

    const { comune, credenziali } = result;
    const idx = parseInt(id, 10) - 1;

    if (idx < 0 || idx >= credenziali.length) {
      return NextResponse.json({ errore: 'Admin non trovato' }, { status: 404 });
    }

    const admin = credenziali[idx];

    // Aggiorna i campi forniti
    if (datiAggiornamento.ruolo !== undefined) admin.ruolo = datiAggiornamento.ruolo;
    if (datiAggiornamento.nome !== undefined) admin.nome = datiAggiornamento.nome;

    // Salva nel campo JSON del Comune
    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenziali) },
    });

    const { password: _, ...adminSenzaPassword } = admin;
    return NextResponse.json({ ...adminSenzaPassword, id });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.issues },
        { status: 400 }
      );
    }
    console.error('Errore nell\'aggiornamento admin:', errore);
    return NextResponse.json({ errore: 'Errore nell\'aggiornamento' }, { status: 500 });
  }
}

// DELETE - Rimuovi admin (rimuove la credenziale dal JSON)
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

    const result = await getComuneAndCredenziali();
    if (!result) {
      return NextResponse.json({ errore: 'Comune non trovato' }, { status: 404 });
    }

    const { comune, credenziali } = result;
    const idx = parseInt(id, 10) - 1;

    if (idx < 0 || idx >= credenziali.length) {
      return NextResponse.json({ errore: 'Admin non trovato' }, { status: 404 });
    }

    // Non permettere di eliminare l'ultimo admin
    if (credenziali.length <= 1) {
      return NextResponse.json(
        { errore: 'Impossibile eliminare l\'ultimo operatore' },
        { status: 400 }
      );
    }

    const adminRimosso = credenziali.splice(idx, 1)[0];

    // Salva nel campo JSON del Comune
    await db.comune.update({
      where: { id: comune.id },
      data: { credenziali: JSON.stringify(credenziali) },
    });

    const { password: _, ...adminSenzaPassword } = adminRimosso;
    return NextResponse.json({ ...adminSenzaPassword, id });
  } catch (errore) {
    console.error('Errore nella disattivazione admin:', errore);
    return NextResponse.json({ errore: 'Errore nella disattivazione' }, { status: 500 });
  }
}
