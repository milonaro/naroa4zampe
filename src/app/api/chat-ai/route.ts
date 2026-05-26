// API per l'assistente virtuale AI esperto di normative animali in Italia
// POST: invia un messaggio e riceve una risposta dall'assistente
// Il system prompt è generato dinamicamente con i dati del comune

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import ZAI, { type ChatMessage } from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getComuneConfig } from '@/lib/tenant';

// ─── Fallback Response ───────────────────────────────────────────────────────

const FALLBACK_RESPONSE_DEFAULT =
  'Mi dispiace, al momento non riesco a elaborare la tua richiesta. Ti invito a riprovare più tardi oppure a utilizzare la sezione segnalazioni dell\'app per inviare una segnalazione diretta al tuo Comune.';

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
- Legge 281/1991 (Legge quadro sugli animali d'affezione e prevenzione del randagismo)
- Codice Penale art. 544-ter e 544-quater (maltrattamento di animali)
- Legge 189/2004 (disposizioni contro il maltrattamento)
- Regolamenti comunali per la gestione del randagismo
- Procedure di segnalazione alle autorità competenti

Rispondi sempre in italiano, in modo chiaro e accessibile ai cittadini. Fornisci indicazioni pratiche su come procedere in caso di ritrovamento, abbandono o maltrattamento di animali. Non fornire consigli legali, solo informazioni di carattere generale. Se la domanda non è relativa agli animali, gentilmente riporta la conversazione sull'argomento.

Quando appropriato, suggerisci di utilizzare l'app "${nomeApp}" per inviare segnalazioni ufficiali al ${nomeComune}.`;
}

// ─── Helper: build messages array ────────────────────────────────────────────

function buildMessages(systemPrompt: string, data: ChatRequestBody): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const entry of data.history) {
    messages.push({
      role: entry.role,
      content: entry.content,
    });
  }

  messages.push({ role: 'user', content: data.message });

  return messages;
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

  // 2. Build system prompt and messages
  const systemPrompt = await buildSystemPrompt();
  const messages = buildMessages(systemPrompt, data);

  // 3. Call z-ai-web-dev-sdk
  try {
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract the assistant's reply from the completion response
    const assistantMessage =
      response?.choices?.[0]?.message?.content ?? FALLBACK_RESPONSE_DEFAULT;

    return NextResponse.json({ message: assistantMessage });
  } catch (errore) {
    console.error('Errore nella generazione della risposta AI:', errore);

    // Always return 200 with a helpful fallback response in Italian
    return NextResponse.json({ message: FALLBACK_RESPONSE_DEFAULT });
  }
}
