// API per la configurazione dell'area operativa del Comune di Naro
// GET: restituisce le coordinate del centro e il raggio operativo

import { NextResponse } from 'next/server';

// Configurazione area operativa del Comune di Naro
const NARO_LAT = 37.2964;
const NARO_LNG = 13.7764;
const RAGGIO_KM = 10; // 10 km dal centro

export async function GET() {
  return NextResponse.json({
    centro: { latitudine: NARO_LAT, longitudine: NARO_LNG },
    raggioKm: RAGGIO_KM,
  });
}
