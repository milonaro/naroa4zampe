// API per la gestione della configurazione del Comune
// GET: restituisce la configurazione corrente (dati pubblici)
// POST: setup iniziale (crea il record Comune)
// PUT: aggiorna la configurazione (solo admin autenticato)
// Le password delle credenziali sono hashate con bcryptjs (FIX-01)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getComuneConfig, parseCredenziali, CREDENZIALI_DEFAULT } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';

// Schema validazione per setup/aggiornamento
const comuneSchema = z.object({
  nomeComune: z.string().min(3),
  nomeApp: z.string().min(3),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Solo lettere minuscole, numeri e trattini'),
  latCentro: z.number().min(-90).max(90),
  lngCentro: z.number().min(-180).max(180),
  raggioKm: z.number().min(1).max(100).default(10),
  regione: z.string().default('Sicilia'),
  provincia: z.string().min(2).max(2).default('AG'),
  telefonoEmergenza: z.string().optional(),
  telefonoVeterinaria: z.string().optional(),
  emailComune: z.string().email().optional().or(z.literal('')),
  colorePrimario: z.string().default('yellow'),
  credenziali: z.array(z.object({
    username: z.string().min(2),
    password: z.string().min(4),
    nome: z.string().min(2),
    ruolo: z.string().min(2),
  })).optional(),
});

// GET - Configurazione pubblica del comune
export async function GET() {
  try {
    const config = await getComuneConfig(db);

    // Restituisci dati pubblici (no credenziali)
    return NextResponse.json({
      nomeComune: config.nomeComune,
      nomeApp: config.nomeApp,
      slug: config.slug,
      latCentro: config.latCentro,
      lngCentro: config.lngCentro,
      raggioKm: config.raggioKm,
      regione: config.regione,
      provincia: config.provincia,
      telefonoEmergenza: config.telefonoEmergenza || null,
      telefonoVeterinaria: config.telefonoVeterinaria || null,
      emailComune: config.emailComune || null,
      colorePrimario: config.colorePrimario,
      setupCompletato: config.setupCompletato,
    });
  } catch (errore) {
    console.error('Errore nel recupero della configurazione comune:', errore);
    return NextResponse.json(
      { errore: 'Errore nel recupero della configurazione' },
      { status: 500 }
    );
  }
}

// POST - Setup iniziale (solo se non esiste ancora un record)
export async function POST(request: NextRequest) {
  try {
    // Verifica se esiste già un comune
    const esistente = await db.comune.findFirst({ where: { attivo: true } });
    if (esistente) {
      return NextResponse.json(
        { errore: 'Configurazione già esistente. Usa PUT per aggiornare.' },
        { status: 409 }
      );
    }

    const corpo = await request.json();
    const dati = comuneSchema.parse(corpo);

    // Hasha le password delle credenziali prima di salvarle (FIX-01)
    const credenzialiDaSalvare = dati.credenziali || CREDENZIALI_DEFAULT;
    const credenzialiHashate = await Promise.all(
      credenzialiDaSalvare.map(async (cred) => ({
        ...cred,
        password: await hashPassword(cred.password),
      }))
    );

    // Crea il record Comune
    const comune = await db.comune.create({
      data: {
        nomeComune: dati.nomeComune,
        nomeApp: dati.nomeApp,
        slug: dati.slug,
        latCentro: dati.latCentro,
        lngCentro: dati.lngCentro,
        raggioKm: dati.raggioKm,
        regione: dati.regione,
        provincia: dati.provincia,
        telefonoEmergenza: dati.telefonoEmergenza || null,
        telefonoVeterinaria: dati.telefonoVeterinaria || null,
        emailComune: dati.emailComune || null,
        colorePrimario: dati.colorePrimario,
        credenziali: JSON.stringify(credenzialiHashate),
        setupCompletato: true,
      },
    });

    return NextResponse.json({ successo: true, id: comune.id }, { status: 201 });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.issues },
        { status: 400 }
      );
    }
    console.error('Errore nella creazione del comune:', errore);
    return NextResponse.json(
      { errore: 'Errore nella creazione della configurazione' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna configurazione (admin)
export async function PUT(request: NextRequest) {
  try {
    const esistente = await db.comune.findFirst({ where: { attivo: true } });
    if (!esistente) {
      return NextResponse.json(
        { errore: 'Nessuna configurazione trovata. Usa POST per creare.' },
        { status: 404 }
      );
    }

    const corpo = await request.json();
    const dati = comuneSchema.parse(corpo);

    // Se sono state fornite nuove credenziali, hasha le password (FIX-01)
    let credenzialiAggiornate = undefined;
    if (dati.credenziali) {
      const credenzialiHashate = await Promise.all(
        dati.credenziali.map(async (cred) => ({
          ...cred,
          password: await hashPassword(cred.password),
        }))
      );
      credenzialiAggiornate = JSON.stringify(credenzialiHashate);
    }

    const aggiornato = await db.comune.update({
      where: { id: esistente.id },
      data: {
        nomeComune: dati.nomeComune,
        nomeApp: dati.nomeApp,
        slug: dati.slug,
        latCentro: dati.latCentro,
        lngCentro: dati.lngCentro,
        raggioKm: dati.raggioKm,
        regione: dati.regione,
        provincia: dati.provincia,
        telefonoEmergenza: dati.telefonoEmergenza || null,
        telefonoVeterinaria: dati.telefonoVeterinaria || null,
        emailComune: dati.emailComune || null,
        colorePrimario: dati.colorePrimario,
        ...(credenzialiAggiornate ? { credenziali: credenzialiAggiornate } : {}),
      },
    });

    return NextResponse.json({ successo: true, id: aggiornato.id });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', dettagli: errore.issues },
        { status: 400 }
      );
    }
    console.error("Errore nell'aggiornamento del comune:", errore);
    return NextResponse.json(
      { errore: "Errore nell'aggiornamento della configurazione" },
      { status: 500 }
    );
  }
}
