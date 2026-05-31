import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema per la validazione del cambio stato
const patchSegnalazioneSchema = z.object({
  stato: z.enum(['ricevuta', 'in_lavorazione', 'risolta', 'archiviata']),
  modificatoDa: z.string().email(),
  creaAnagrafica: z.boolean().optional(), // Se true, crea automaticamente il record Animale
});

/**
 * GET - Recupera il dettaglio completo di una segnalazione inclusi i log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const segnalazione = await db.segnalazione.findUnique({
      where: { id },
      include: {
        logModifiche: { orderBy: { createdAt: 'desc' } },
        animale: true,
      },
    });

    if (!segnalazione) {
      return NextResponse.json({ errore: 'Segnalazione non trovata' }, { status: 404 });
    }

    return NextResponse.json(segnalazione);
  } catch (errore) {
    return NextResponse.json({ errore: 'Errore interno' }, { status: 500 });
  }
}

/**
 * PATCH - Aggiorna lo stato e gestisce la logica di approvazione
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const { stato: nuovoStato, modificatoDa, creaAnagrafica } = patchSegnalazioneSchema.parse(corpo);

    const segnalazioneEsistente = await db.segnalazione.findUnique({
      where: { id },
      include: { animale: true }
    });

    if (!segnalazioneEsistente) {
      return NextResponse.json({ errore: 'Segnalazione non trovata' }, { status: 404 });
    }

    const vecchioStato = segnalazioneEsistente.stato;

    const risultato = await db.$transaction(async (tx) => {
      // 1. Aggiorna lo stato della segnalazione
      const aggiornata = await tx.segnalazione.update({
        where: { id },
        data: { stato: nuovoStato },
      });

      // 2. Registra la modifica nei log (Audit Trail)
      if (vecchioStato !== nuovoStato) {
        await tx.logModifica.create({
          data: {
            segnalazioneId: id,
            campoModificato: 'stato',
            valorePrecedente: vecchioStato,
            valoreNuovo: nuovoStato,
            modificatoDa,
          },
        });
      }

      // 3. Creazione automatica Anagrafica (se richiesto e non esiste già)
      if (nuovoStato === 'in_lavorazione' && creaAnagrafica && !segnalazioneEsistente.animale) {
        await tx.animale.create({
          data: {
            segnalazioneOrigineId: id,
            nome: `ID-${id.slice(-4)}`, // Nome temporaneo
            specie: segnalazioneEsistente.tipoAnimale,
            razza: segnalazioneEsistente.razza || 'Meticcio',
            coloreMantello: segnalazioneEsistente.colore || 'N/D',
            taglia: segnalazioneEsistente.taglia || 'media',
            sesso: 'M', // Default da editare in seguito
            statoGiuridico: 'territorio',
          }
        });
      }

      return aggiornata;
    });

    return NextResponse.json(risultato);
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json({ errore: 'Dati non validi', dettagli: errore.issues }, { status: 400 });
    }
    return NextResponse.json({ errore: 'Errore durante l\'aggiornamento' }, { status: 500 });
  }
}