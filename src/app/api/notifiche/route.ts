// API per la gestione delle notifiche
// GET: elenco notifiche
// PATCH: segna notifiche come lette

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema per segnare notifiche come lette
const segnaComeLetteSchema = z.object({
  ids: z.array(z.string()).optional(),
  segnaTutte: z.boolean().optional(),
});

// GET - Elenco notifiche
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '20');
    const soloNonLette = searchParams.get('nonLette') === 'true';

    const notifiche = await db.notifica.findMany({
      where: soloNonLette ? { letta: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limite,
      include: {
        segnalazione: {
          select: {
            id: true,
            titolo: true,
            urgenza: true,
          },
        },
      },
    });

    const nonLette = await db.notifica.count({
      where: { letta: false },
    });

    return NextResponse.json({ notifiche, nonLette });
  } catch (errore) {
    console.error('Errore nel recupero delle notifiche:', errore);
    return NextResponse.json(
      { errore: 'Errore nel recupero delle notifiche' },
      { status: 500 }
    );
  }
}

// PATCH - Segna notifiche come lette
export async function PATCH(request: NextRequest) {
  try {
    const corpo = await request.json();
    const datiValidati = segnaComeLetteSchema.parse(corpo);

    if (datiValidati.segnaTutte) {
      // Segna tutte le notifiche come lette
      await db.notifica.updateMany({
        where: { letta: false },
        data: { letta: true },
      });
    } else if (datiValidati.ids && datiValidati.ids.length > 0) {
      // Segna notifiche specifiche come lette
      await db.notifica.updateMany({
        where: { id: { in: datiValidati.ids } },
        data: { letta: true },
      });
    }

    return NextResponse.json({ messaggio: 'Notifiche aggiornate con successo' });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.issues },
        { status: 400 }
      );
    }
    console.error("Errore nell'aggiornamento delle notifiche:", errore);
    return NextResponse.json(
      { errore: "Errore nell'aggiornamento delle notifiche" },
      { status: 500 }
    );
  }
}
