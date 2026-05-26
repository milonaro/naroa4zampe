// API per l'assistente virtuale AI esperto di normative animali in Italia
// POST: invia un messaggio e riceve una risposta dall'assistente
// Utilizza l'SDK Anthropic ufficiale (FIX-03: sostituito z-ai-web-dev-sdk)
// Il system prompt è generato dinamicamente con i dati del comune

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { getComuneConfig } from '@/lib/tenant';

// ─── Fallback Response ───────────────────────────────────────────────────────

const FALLBACK_RESPONSE =
  'Mi dispiace, al momento non riesco a elaborare la tua richiesta. Ti invito a riprovare più tardi oppure a utilizzare la sezione segnalazioni dell\'app per inviare una segnalazione diretta al tuo Comune.';

// ─── Anthropic Client (singleton) ─────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY non configurata. La chat AI non funzionerà.');
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
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
          dettagli: errore.errors.map((e) => ({
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

  // 2. Check Anthropic client availability
  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json({
      message: 'L\'assistente AI non è al momento configurato. Contatta l\'amministratore del Comune per abilitare il servizio.',
    });
  }

  // 3. Build system prompt and messages
  const systemPrompt = await buildSystemPrompt();

  // Costruisci l'array di messaggi nel formato Anthropic
  const messages: Anthropic.MessageParam[] = data.history.map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));

  messages.push({ role: 'user', content: data.message });

  // 4. Call Anthropic API
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    // Extract the assistant's reply from the response
    const assistantMessage = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return NextResponse.json({ message: assistantMessage || FALLBACK_RESPONSE });
  } catch (errore) {
    console.error('Errore nella generazione della risposta AI:', errore);

    // Determina il tipo di errore per un messaggio appropriato
    const errorMsg = errore instanceof Error ? errore.message : String(errore);

    if (errorMsg.includes('api_key') || errorMsg.includes('authentication')) {
      return NextResponse.json({
        message: 'L\'assistente AI non è configurato correttamente. Contatta l\'amministratore.',
      });
    }

    if (errorMsg.includes('rate_limit') || errorMsg.includes('overloaded')) {
      return NextResponse.json({
        message: 'L\'assistente è temporaneamente sovraccarico. Riprova tra qualche istante.',
      });
    }

    // Errore generico: restituisci il fallback
    return NextResponse.json({ message: FALLBACK_RESPONSE });
  }
}
