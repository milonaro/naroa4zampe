// API per la gestione di una singola segnalazione
// GET: dettaglio segnalazione
// PATCH: aggiornamento stato segnalazione
// DELETE: eliminazione segnalazione

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema di validazione per l'aggiornamento della segnalazione
const aggiornaSegnalazioneSchema = z.object({
  stato: z.enum(['ricevuta', 'in_lavorazione', 'risolta', 'archiviata']).optional(),
  modificatoDa: z.string().optional(),
});

// GET - Dettaglio di una singola segnalazione
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const segnalazione = await db.segnalazione.findUnique({
      where: { id },
      include: {
        notifiche: { orderBy: { createdAt: 'desc' } },
        logModifiche: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!segnalazione) {
      return NextResponse.json(
        { errore: 'Segnalazione non trovata' },
        { status: 404 }
      );
    }

    return NextResponse.json(segnalazione);
  } catch (errore) {
    console.error('Errore nel recupero della segnalazione:', errore);
    return NextResponse.json(
      { errore: 'Errore nel recupero della segnalazione' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiornamento segnalazione
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const datiValidati = aggiornaSegnalazioneSchema.parse(corpo);

    // Verifica che la segnalazione esista
    const segnalazioneEsistente = await db.segnalazione.findUnique({
      where: { id },
    });

    if (!segnalazioneEsistente) {
      return NextResponse.json(
        { errore: 'Segnalazione non trovata' },
        { status: 404 }
      );
    }

    // Preparazione dati per l'aggiornamento
    const datiAggiornamento: Record<string, unknown> = {};

    // Aggiornamento dello stato se fornito
    if (datiValidati.stato !== undefined) {
      datiAggiornamento.stato = datiValidati.stato;
    }

    // Aggiornamento della segnalazione
    const segnalazione = await db.segnalazione.update({
      where: { id },
      data: datiAggiornamento,
    });

    // Creazione del log di modifica se lo stato è cambiato
    if (datiValidati.stato !== undefined && datiValidati.stato !== segnalazioneEsistente.stato) {
      await db.logModifica.create({
        data: {
          segnalazioneId: id,
          campoModificato: 'stato',
          valorePrecedente: segnalazioneEsistente.stato,
          valoreNuovo: datiValidati.stato,
          modificatoDa: corpo.modificatoDa || 'sconosciuto',
        },
      });
    }

    // Creazione notifica per il cambio di stato
    if (datiValidati.stato !== undefined) {
      const messaggiStato: Record<string, string> = {
        ricevuta: 'La segnalazione è stata registrata',
        in_lavorazione: 'La segnalazione è in fase di lavorazione',
        risolta: 'La segnalazione è stata risolta',
        archiviata: 'La segnalazione è stata archiviata',
      };

      await db.notifica.create({
        data: {
          messaggio: `${messaggiStato[datiValidati.stato]}: ${segnalazioneEsistente.titolo}`,
          tipo: 'aggiornamento_stato',
          segnalazioneId: id,
        },
      });
    }

    return NextResponse.json(segnalazione);
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.errors },
        { status: 400 }
      );
    }
    console.error("Errore nell'aggiornamento della segnalazione:", errore);
    return NextResponse.json(
      { errore: "Errore nell'aggiornamento della segnalazione" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminazione segnalazione
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Eliminazione log delle modifiche associati
    await db.logModifica.deleteMany({
      where: { segnalazioneId: id },
    });

    // Eliminazione notifiche associate
    await db.notifica.deleteMany({
      where: { segnalazioneId: id },
    });

    // Eliminazione segnalazione
    await db.segnalazione.delete({
      where: { id },
    });

    return NextResponse.json({ messaggio: 'Segnalazione eliminata con successo' });
  } catch (errore) {
    console.error("Errore nell'eliminazione della segnalazione:", errore);
    return NextResponse.json(
      { errore: "Errore nell'eliminazione della segnalazione" },
      { status: 500 }
    );
  }
}
