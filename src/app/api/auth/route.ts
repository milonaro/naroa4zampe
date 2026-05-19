// API per l'autenticazione degli amministratori
// POST: verifica credenziali e restituisce risultato

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema di validazione per il login
const loginSchema = z.object({
  username: z.string().min(1, 'Username obbligatorio'),
  password: z.string().min(1, 'Password obbligatoria'),
});

// Credenziali admin (in produzione: hash bcrypt + DB)
const ADMIN_CREDENTIALS = [
  { username: 'admin', password: 'Naro2024!', nome: 'Amministratore' },
  { username: 'polizia', password: 'NaroRandagio24', nome: 'Polizia Municipale' },
  { username: 'ufficio', password: 'CaninaNaro!', nome: 'Ufficio Animali' },
];

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json();
    const datiValidati = loginSchema.parse(corpo);

    const utente = ADMIN_CREDENTIALS.find(
      (cred) =>
        cred.username === datiValidati.username &&
        cred.password === datiValidati.password
    );

    if (!utente) {
      return NextResponse.json(
        { errore: 'Credenziali non valide', successo: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      successo: true,
      nome: utente.nome,
      username: utente.username,
      messaggio: `Benvenuto, ${utente.nome}!`,
    });
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        { errore: 'Dati non validi', successo: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { errore: "Errore nell'autenticazione", successo: false },
      { status: 500 }
    );
  }
}
