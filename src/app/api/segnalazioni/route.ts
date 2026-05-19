// API per la gestione delle segnalazioni di cani randagi
// GET: elenco segnalazioni con filtri opzionali
// POST: creazione di una nuova segnalazione

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema di validazione per la creazione di una segnalazione
const creaSegnalazioneSchema = z.object({
  titolo: z.string().min(3, 'Il titolo deve avere almeno 3 caratteri'),
  descrizione: z.string().min(10, 'La descrizione deve avere almeno 10 caratteri'),
  latitudine: z.number().min(-90).max(90),
  longitudine: z.number().min(-180).max(180),
  indirizzo: z.string().optional(),
  razza: z.string().optional(),
  colore: z.string().optional(),
  taglia: z.enum(['piccola', 'media', 'grande']).optional(),
  urgenza: z.enum(['bassa', 'media', 'alta', 'critica']).default('media'),
  fotoUrl: z.string().optional(),
  nomeSegnalatore: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  cognomeSegnalatore: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  emailSegnalatore: z.string().email('Email non valida'),
  telefonoSegnalatore: z.string().optional(),
  utenteId: z.string().optional(),
});

// GET - Elenco segnalazioni con filtri e paginazione
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get('stato');
    const urgenza = searchParams.get('urgenza');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const perPagina = parseInt(searchParams.get('perPagina') || '20');

    // Costruzione filtri
    const filtri: Record<string, unknown> = {};
    if (stato) filtri.stato = stato;
    if (urgenza) filtri.urgenza = urgenza;

    const [segnalazioni, totale] = await Promise.all([
      db.segnalazione.findMany({
        where: filtri,
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * perPagina,
        take: perPagina,
        include: {
          notifiche: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      db.segnalazione.count({ where: filtri }),
    ]);

    return NextResponse.json({
      segnalazioni,
      paginazione: {
        pagina,
        perPagina,
        totale,
        totalePagine: Math.ceil(totale / perPagina),
      },
    });
  } catch (errore) {
    console.error('Errore nel recupero delle segnalazioni:', errore);
    return NextResponse.json(
      { errore: 'Errore nel recupero delle segnalazioni' },
      { status: 500 }
    );
  }
}

// POST - Creazione nuova segnalazione
export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const datiValidati = creaSegnalazioneSchema.parse(corpo);

    // Creazione della segnalazione
    const segnalazione = await db.segnalazione.create({
      data: datiValidati,
    });

    // Creazione notifica automatica
    const tipoNotifica = datiValidati.urgenza === 'critica' || datiValidati.urgenza === 'alta'
      ? 'urgenza_alta'
      : 'nuova_segnalazione';

    const messaggioNotifica = datiValidati.urgenza === 'critica' || datiValidati.urgenza === 'alta'
      ? `⚠️ Segnalazione urgente: ${datiValidati.titolo} - Urgenza: ${datiValidati.urgenza}`
      : `Nuova segnalazione: ${datiValidati.titolo}`;

    await db.notifica.create({
      data: {
        messaggio: messaggioNotifica,
        tipo: tipoNotifica,
        segnalazioneId: segnalazione.id,
      },
    });

    return NextResponse.json(segnalazione, { status: 201 });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.errors },
        { status: 400 }
      );
    }
    console.error('Errore nella creazione della segnalazione:', errore);
    return NextResponse.json(
      { errore: 'Errore nella creazione della segnalazione' },
      { status: 500 }
    );
  }
}
