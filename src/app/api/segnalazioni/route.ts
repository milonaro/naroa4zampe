// API per la gestione delle segnalazioni di animali randagi
// GET: elenco segnalazioni con filtri opzionali
// POST: creazione di una nuova segnalazione
// Coordinate del centro lette dinamicamente dal record Comune

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getComuneConfig } from '@/lib/tenant';

// Formula di Haversine per il calcolo della distanza tra due punti geografici
function distanzaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  tipoAnimale: z.enum(['cane', 'gatto', 'altro']).default('cane'),
  motivazione: z.enum(['randagismo', 'abbandono', 'maltrattamento', 'smarrimento', 'rinvenimento', 'altro']).default('randagismo'),
  urgenza: z.enum(['bassa', 'media', 'alta', 'critica']).default('media'),
  fotoUrl: z.string().optional(),
  nomeSegnalatore: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  cognomeSegnalatore: z.string().min(2, 'Il cognome deve avere almeno 2 caratteri'),
  emailSegnalatore: z.string().email('Email non valida'),
  telefonoSegnalatore: z.string().optional(),
  utenteId: z.string().optional(),
  // Consensi obbligatori
  consensoPrivacy: z.boolean().refine(val => val === true, 'Il consenso alla privacy è obbligatorio'),
  consensoDichiarazione: z.boolean().refine(val => val === true, 'Il consenso alla dichiarazione è obbligatorio'),
  dataConsenso: z.string().datetime().optional(),
});

// GET - Elenco segnalazioni con filtri e paginazione
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get('stato');
    const urgenza = searchParams.get('urgenza');
    const motivazione = searchParams.get('motivazione');
    const tipoAnimale = searchParams.get('tipoAnimale');
    const search = searchParams.get('search');
    const fuoriZona = searchParams.get('fuoriZona');
    const emailSegnalatore = searchParams.get('emailSegnalatore');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const perPagina = parseInt(searchParams.get('perPagina') || '20');

    // Costruzione filtri
    const filtri: Record<string, unknown> = {};
    if (stato) filtri.stato = stato;
    if (urgenza) filtri.urgenza = urgenza;
    if (motivazione) filtri.motivazione = motivazione;
    if (tipoAnimale) filtri.tipoAnimale = tipoAnimale;

    // Filtro ricerca per titolo o descrizione (case-insensitive con SQLite)
    if (search) {
      filtri.OR = [
        { titolo: { contains: search } },
        { descrizione: { contains: search } },
      ];
    }

    // Filtro per email segnalatore (area personale)
    if (emailSegnalatore) {
      filtri.emailSegnalatore = { contains: emailSegnalatore };
    }

    // Filtro per fuori zona
    if (fuoriZona !== null) {
      filtri.fuoriZona = fuoriZona === 'true';
    }

    const [segnalazioni, totale] = await Promise.all([
      db.segnalazione.findMany({
        where: filtri,
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * perPagina,
        take: perPagina,
        include: {
          notifiche: { take: 1, orderBy: { createdAt: 'desc' } },
          logModifiche: { orderBy: { createdAt: 'desc' } },
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

    // Carica coordinate dinamiche dal Comune
    const config = await getComuneConfig(db);

    // Calcolo della distanza dal centro tramite formula di Haversine
    const distanza = distanzaKm(config.latCentro, config.lngCentro, datiValidati.latitudine, datiValidati.longitudine);
    const fuoriZona = distanza > config.raggioKm;

    // Preparazione dati per la creazione (rimuovo i campi non appartenenti al modello)
    const { consensoPrivacy, consensoDichiarazione, dataConsenso, ...altriDati } = datiValidati;

    // Creazione della segnalazione
    const segnalazione = await db.segnalazione.create({
      data: {
        ...altriDati,
        consensoPrivacy,
        consensoDichiarazione,
        dataConsenso: dataConsenso ? new Date(dataConsenso) : new Date(),
        raggioOperativo: distanza,
        fuoriZona,
      },
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

    // Ricerca segnalazioni simili (duplicati potenziali)
    const RAGGIO_DUPLICATO_KM = 0.2; // 200 metri
    const segnalazioniVicine = await db.segnalazione.findMany({
      where: {
        id: { not: segnalazione.id },
        stato: { not: 'archiviata' },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const segnalazioniSimili = segnalazioniVicine.filter(s => {
      const dist = distanzaKm(datiValidati.latitudine, datiValidati.longitudine, s.latitudine, s.longitudine);
      return dist <= RAGGIO_DUPLICATO_KM;
    }).map(s => ({
      id: s.id,
      titolo: s.titolo,
      urgenza: s.urgenza,
      stato: s.stato,
      distanza: distanzaKm(datiValidati.latitudine, datiValidati.longitudine, s.latitudine, s.longitudine),
      createdAt: s.createdAt,
    })).slice(0, 5);

    return NextResponse.json({ ...segnalazione, segnalazioniSimili }, { status: 201 });
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
