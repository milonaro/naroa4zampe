// API per l'assistente virtuale AI esperto di normative animali in Italia
// POST: invia un messaggio e riceve una risposta dall'assistente
// Utilizza l'API GROQ tramite fetch (no SDK required)
// Il system prompt è generato dinamicamente con i dati del comune

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getComuneConfig } from '@/lib/tenant';

// ─── Falslback Response ───────────────────────────────────────────────────────

const FALLBACK_RESPONSE =
  'Mi dispiace, al momento non riesco a elaborare la tua richiesta. Ti invito a riprovare più tardi oppure a utilizzare la sezione segnalazioni dell\'app per inviare una segnalazione diretta al tuo Comune.';

// ─── GROQ API Configuration ──────────────────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function isGroqConfigured(): boolean {
  if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY non configurata. La chat AI non funzionerà.');
    return false;
  }
  return true;
}

// ─── Request Validation Schema ───────────────────────────────────────────────

const chatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

type ChatRequestBody = z.infer<typeof chatSchema>;

// ─── Helper: build system prompt dynamically ────────────────────────────────

async function buildSystemPrompt(): Promise<string> {
  let nomeComune = 'Comune di Naro';
  let nomeApp = 'Naro a 4 Zampe';
  let regione = 'Sicilia';

  try {
    const config = await getComuneConfig(db);
    nomeComune = config.nomeComune;
    nomeApp = config.nomeApp;
    regione = config.regione;
  } catch {
    // use defaults
  }

  return `Sei un assistente virtuale esperto di normative per la tutela degli animali in Italia, con particolare riferimento al territorio di ${nomeComune.replace('Comune di ', '')}, ${regione}.

Le tue competenze includono:
- Legge 14 agosto 1991, n. 281 (Legge quadro sugli animali d'affezione e prevenzione del randagismo)
- Codice Penale art. 544-ter e 544-quater (maltrattamento di animali)
- Legge 189/2004 (disposizioni contro il maltrattamento)
- L.R. Sicilia n. 15/2000 e n. 3/2013 (normativa regionale sulla gestione del randagismo)
- D.Lgs. 193/2006 (identificazione e registrazione degli animali d'affezione)
- Regolamenti comunali per la gestione del randagismo
- Procedure di segnalazione alle autorità competenti

Rispondi sempre in italiano, in modo chiaro e accessibile ai cittadini. Fornisci indicazioni pratiche su come procedere in caso di ritrovamento, abbandono o maltrattamento di animali. Non fornire consigli legali specifici, solo informazioni di carattere generale. Se la domanda non è relativa agli animali, gentilmente riporta la conversazione sull'argomento.

Per emergenze, suggerisci sempre di contattare il 112 o la Polizia Municipale.

Quando appropriato, suggerisci di utilizzare l'app "${nomeApp}" per inviare segnalazioni ufficiali al ${nomeComune}.`;
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse & validate request body
  let data: ChatRequestBody;
  try {
    const body = await request.json();
    data = chatSchema.parse(body);
  } catch (errore) {
    if (errore instanceof z.ZodError) {
      return NextResponse.json(
        {
          errore: 'Dati non validi',
          dettagli: errore.issues.map((e) => ({
            campo: e.path.join('.'),
            messaggio: e.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { errore: 'Corpo della richiesta non valido' },
      { status: 400 }
    );
  }

  // 2. Check GROQ API availability
  if (!isGroqConfigured()) {
    return NextResponse.json({
      message: 'L\'assistente AI non è al momento configurato. Contatta l\'amministratore del Comune per abilitare il servizio.',
    });
  }

  // 3. Build system prompt and messages
  const systemPrompt = await buildSystemPrompt();

  // Costruisci l'array di messaggi nel formato OpenAI (usato da GROQ)
  const messages: Array<{ role: string; content: string }> = [
    ...data.history,
    { role: 'user', content: data.message },
  ];

  // 4. Call GROQ API via fetch
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      
      if (response.status === 401) {
        return NextResponse.json({
          message: 'L\'assistente AI non è configurato correttamente (credenziali GROQ non valide).',
        });
      }
      
      if (response.status === 429) {
        return NextResponse.json({
          message: 'L\'assistente è temporaneamente sovraccarico. Riprova tra qualche istante.',
        });
      }

      console.error('Errore GROQ API:', errorMsg);
      return NextResponse.json({ message: FALLBACK_RESPONSE });
    }

    const dati = await response.json();
    const assistantMessage = dati.choices?.[0]?.message?.content || FALLBACK_RESPONSE;

    return NextResponse.json({ message: assistantMessage });
  } catch (errore) {
    console.error('Errore nella generazione della risposta AI:', errore);
    return NextResponse.json({ message: FALLBACK_RESPONSE });
  }
}
