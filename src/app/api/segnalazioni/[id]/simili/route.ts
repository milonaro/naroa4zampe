// API per la ricerca di segnalazioni simili (duplicati potenziali)
// GET: elenco segnalazioni entro 500m dalla segnalazione specificata

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Formula di Haversine per il calcolo della distanza tra due punti geografici
function distanzaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const segnalazione = await db.segnalazione.findUnique({ where: { id } });
    if (!segnalazione) {
      return NextResponse.json({ errore: 'Segnalazione non trovata' }, { status: 404 });
    }

    const RAGGIO_KM = 0.5; // 500 metri
    const recenti = await db.segnalazione.findMany({
      where: { id: { not: id }, stato: { not: 'archiviata' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const simili = recenti
      .filter(s => distanzaKm(segnalazione.latitudine, segnalazione.longitudine, s.latitudine, s.longitudine) <= RAGGIO_KM)
      .map(s => ({
        id: s.id,
        titolo: s.titolo,
        urgenza: s.urgenza,
        stato: s.stato,
        distanza: distanzaKm(segnalazione.latitudine, segnalazione.longitudine, s.latitudine, s.longitudine),
        createdAt: s.createdAt,
      }))
      .slice(0, 5);

    return NextResponse.json({ simili });
  } catch (errore) {
    console.error('Errore nel recupero delle segnalazioni simili:', errore);
    return NextResponse.json({ errore: 'Errore nel recupero delle segnalazioni simili' }, { status: 500 });
  }
}
