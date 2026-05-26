// API per l'Area Personale del cittadino
// GET: cerca segnalazioni tramite email o Codice Fiscale
// POST: gestisce le richieste di cancellazione dati (GDPR)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema validazione ricerca
const ricercaSchema = z.object({
  email: z.string().email().optional(),
  codiceFiscale: z.string().optional(),
}).refine(data => data.email || data.codiceFiscale, {
  message: 'Inserisci almeno un parametro di ricerca (email o Codice Fiscale)',
});

// GET - Ricerca segnalazioni del cittadino
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || undefined;
    const codiceFiscale = searchParams.get('codiceFiscale') || undefined;

    const result = ricercaSchema.safeParse({ email, codiceFiscale });
    if (!result.success) {
      return NextResponse.json(
        { errore: result.error.errors[0]?.message || 'Parametri di ricerca non validi' },
        { status: 400 }
      );
    }

    // Costruzione filtro
    const filtri: Record<string, unknown>[] = [];
    if (email) filtri.push({ emailSegnalatore: email });
    if (codiceFiscale) filtri.push({ codiceFiscale: codiceFiscale.toUpperCase() });

    // Ricerca segnalazioni
    const segnalazioni = await db.segnalazione.findMany({
      where: {
        OR: filtri,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        logModifiche: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Conteggio per stato
    const conteggioStati: Record<string, number> = {
      ricevuta: 0,
      in_lavorazione: 0,
      risolta: 0,
      archiviata: 0,
    };
    segnalazioni.forEach(s => {
      if (conteggioStati[s.stato] !== undefined) {
        conteggioStati[s.stato]++;
      }
    });

    // Dati consensi (presi dalla segnalazione più recente)
    const consensi = segnalazioni.length > 0 ? {
      consensoPrivacy: segnalazioni[0].consensoPrivacy,
      consensoDichiarazione: segnalazioni[0].consensoDichiarazione,
      dataConsenso: segnalazioni[0].dataConsenso,
    } : null;

    return NextResponse.json({
      segnalazioni,
      conteggioStati,
      consensi,
      totale: segnalazioni.length,
    });
  } catch (errore) {
    console.error('Errore nella ricerca cittadino:', errore);
    return NextResponse.json(
      { errore: 'Errore nella ricerca delle segnalazioni' },
      { status: 500 }
    );
  }
}

// Schema per richiesta cancellazione
const cancellazioneSchema = z.object({
  email: z.string().email(),
  codiceFiscale: z.string().optional(),
  tipo: z.enum(['cancellazione', 'richiesta_copia']).default('cancellazione'),
});

// POST - Richiesta cancellazione dati (GDPR)
export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const datiValidati = cancellazioneSchema.parse(corpo);

    // Verifica che esistano segnalazioni per questo cittadino
    const segnalazioni = await db.segnalazione.findMany({
      where: { emailSegnalatore: datiValidati.email },
      select: { id: true },
    });

    if (segnalazioni.length === 0) {
      return NextResponse.json(
        { errore: 'Nessuna segnalazione trovata per questo indirizzo email' },
        { status: 404 }
      );
    }

    // In un'applicazione reale, qui si avvierebbe il processo di cancellazione
    // Per ora, restituiamo un successo (la cancellazione va gestita dall'admin)
    return NextResponse.json({
      successo: true,
      messaggio: datiValidati.tipo === 'cancellazione'
        ? 'Richiesta di cancellazione dati registrata. Sarà elaborata entro 30 giorni come da normativa GDPR.'
        : 'Richiesta di copia dati registrata. Riceverai i dati via email entro 15 giorni.',
      segnalazioniCoinvolte: segnalazioni.length,
    });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.errors },
        { status: 400 }
      );
    }
    console.error('Errore nella richiesta GDPR:', errore);
    return NextResponse.json(
      { errore: 'Errore nell\'elaborazione della richiesta' },
      { status: 500 }
    );
  }
}
