// API per la configurazione dell'area operativa del Comune
// GET: restituisce le coordinate del centro e il raggio operativo
// I valori sono letti dinamicamente dal record Comune nel database

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CONFIG_DEFAULT } from '@/lib/tenant';

export async function GET() {
  try {
    const comune = await db.comune.findFirst({ where: { attivo: true } });

    const latCentro = comune?.latCentro ?? CONFIG_DEFAULT.latCentro;
    const lngCentro = comune?.lngCentro ?? CONFIG_DEFAULT.lngCentro;
    const raggioKm = comune?.raggioKm ?? CONFIG_DEFAULT.raggioKm;

    return NextResponse.json({
      centro: { latitudine: latCentro, longitudine: lngCentro },
      raggioKm,
    });
  } catch (errore) {
    // Fallback alla configurazione di default
    return NextResponse.json({
      centro: { latitudine: CONFIG_DEFAULT.latCentro, longitudine: CONFIG_DEFAULT.lngCentro },
      raggioKm: CONFIG_DEFAULT.raggioKm,
    });
  }
}
