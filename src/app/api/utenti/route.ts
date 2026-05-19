// API per la gestione degli utenti segnalatori
// GET: elenco utenti con statistiche raggruppati per email

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Elenco utenti segnalatori con statistiche
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Raggruppa segnalazioni per email segnalatore
    const segnalazioni = await db.segnalazione.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titolo: true,
        urgenza: true,
        stato: true,
        createdAt: true,
        nomeSegnalatore: true,
        cognomeSegnalatore: true,
        emailSegnalatore: true,
        telefonoSegnalatore: true,
      },
    });
    
    // Raggruppa per email
    const utentiMap = new Map<string, {
      nome: string;
      cognome: string;
      email: string;
      telefono: string;
      segnalazioni: typeof segnalazioni;
    }>();
    
    for (const seg of segnalazioni) {
      const key = seg.emailSegnalatore.toLowerCase();
      if (!utentiMap.has(key)) {
        utentiMap.set(key, {
          nome: seg.nomeSegnalatore,
          cognome: seg.cognomeSegnalatore,
          email: seg.emailSegnalatore,
          telefono: seg.telefonoSegnalatore || '',
          segnalazioni: [],
        });
      }
      utentiMap.get(key)!.segnalazioni.push(seg);
    }
    
    let utenti = Array.from(utentiMap.values());
    
    // Filtro ricerca
    if (search) {
      const q = search.toLowerCase();
      utenti = utenti.filter(u => 
        u.nome.toLowerCase().includes(q) || 
        u.cognome.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }
    
    // Ordina per numero di segnalazioni (decrescente)
    utenti.sort((a, b) => b.segnalazioni.length - a.segnalazioni.length);
    
    return NextResponse.json({ utenti });
  } catch (errore) {
    console.error('Errore nel recupero degli utenti:', errore);
    return NextResponse.json({ errore: 'Errore nel recupero degli utenti' }, { status: 500 });
  }
}
