// API per la gestione di una singola segnalazione
// GET: dettaglio segnalazione
// PATCH: aggiornamento stato segnalazione
// DELETE: eliminazione segnalazione

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema di validazione per l'aggiornamento dello stato
const aggiornaStatoSchema = z.object({
  stato: z.enum(['ricevuta', 'in_lavorazione', 'risolta', 'archiviata']),
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
      include: { notifiche: { orderBy: { createdAt: 'desc' } } },
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

// PATCH - Aggiornamento stato segnalazione
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const datiValidati = aggiornaStatoSchema.parse(corpo);

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

    // Aggiornamento dello stato
    const segnalazione = await db.segnalazione.update({
      where: { id },
      data: { stato: datiValidati.stato },
    });

    // Creazione notifica per il cambio di stato
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
