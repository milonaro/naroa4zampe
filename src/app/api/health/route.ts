// API Health Check — Monitoraggio stato del sistema
// GET /api/health — Verifica che il sistema sia operativo
// Può essere integrato con tool di monitoring (UptimeRobot, Better Uptime, ecc.)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Verifica connessione al database
    await db.$queryRaw`SELECT 1`;

    // Recupera info sul comune configurato
    const comune = await db.comune.findFirst({
      select: { nomeComune: true, setupCompletato: true },
    });

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      setup: comune?.setupCompletato ?? false,
      comune: comune?.nomeComune ?? null,
    });
  } catch (errore) {
    console.error('Health check failed:', errore);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Impossibile connettersi al database',
      },
      { status: 503 }
    );
  }
}
