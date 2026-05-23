// API per le statistiche delle segnalazioni
// GET: restituisce conteggi per stato, urgenza, motivazione, tipoAnimale e tendenze recenti

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Conteggi per stato
    const perStato = await db.segnalazione.groupBy({
      by: ['stato'],
      _count: { stato: true },
    });

    // Conteggi per urgenza
    const perUrgenza = await db.segnalazione.groupBy({
      by: ['urgenza'],
      _count: { urgenza: true },
    });

    // Conteggi per motivazione
    const perMotivazione = await db.segnalazione.groupBy({
      by: ['motivazione'],
      _count: { motivazione: true },
    });

    // Conteggi per tipo animale
    const perTipoAnimale = await db.segnalazione.groupBy({
      by: ['tipoAnimale'],
      _count: { tipoAnimale: true },
    });

    // Totale segnalazioni
    const totale = await db.segnalazione.count();

    // Segnalazioni recenti (ultimi 7 giorni)
    const setteGiorniFa = new Date();
    setteGiorniFa.setDate(setteGiorniFa.getDate() - 7);
    const recenti = await db.segnalazione.count({
      where: {
        createdAt: { gte: setteGiorniFa },
      },
    });

    // Segnalazioni per mese (ultimi 6 mesi)
    const seiMesiFa = new Date();
    seiMesiFa.setMonth(seiMesiFa.getMonth() - 6);
    const segnalazioniRecenti = await db.segnalazione.findMany({
      where: {
        createdAt: { gte: seiMesiFa },
      },
      select: {
        createdAt: true,
        stato: true,
        urgenza: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Notifiche non lette
    const notificheNonLette = await db.notifica.count({
      where: { letta: false },
    });

    // Formattazione dati per mese
    const perMese: Record<string, number> = {};
    segnalazioniRecenti.forEach((s) => {
      const mese = s.createdAt.toISOString().slice(0, 7); // Formato YYYY-MM
      perMese[mese] = (perMese[mese] || 0) + 1;
    });

    // Formattazione risultati per stato
    const conteggioStato: Record<string, number> = {};
    perStato.forEach((item) => {
      conteggioStato[item.stato] = item._count.stato;
    });

    // Formattazione risultati per urgenza
    const conteggioUrgenza: Record<string, number> = {};
    perUrgenza.forEach((item) => {
      conteggioUrgenza[item.urgenza] = item._count.urgenza;
    });

    // Formattazione risultati per motivazione
    const conteggioMotivazione: Record<string, number> = {};
    perMotivazione.forEach((item) => {
      conteggioMotivazione[item.motivazione] = item._count.motivazione;
    });

    // Formattazione risultati per tipo animale
    const conteggioTipoAnimale: Record<string, number> = {};
    perTipoAnimale.forEach((item) => {
      conteggioTipoAnimale[item.tipoAnimale] = item._count.tipoAnimale;
    });

    return NextResponse.json({
      totale,
      recenti,
      perStato: conteggioStato,
      perUrgenza: conteggioUrgenza,
      perMotivazione: conteggioMotivazione,
      perTipoAnimale: conteggioTipoAnimale,
      perMese,
      notificheNonLette,
    });
  } catch (errore) {
    console.error('Errore nel recupero delle statistiche:', errore);
    return NextResponse.json(
      { errore: 'Errore nel recupero delle statistiche' },
      { status: 500 }
    );
  }
}
