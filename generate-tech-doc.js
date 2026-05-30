const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, TabStopType, TabStopPosition, ExternalHyperlink,
  InternalHyperlink, Bookmark, LevelFormat, TableOfContents,
} = require("docx");
const fs = require("fs");

// ── Palette: DM-1 Deep Cyan (tech/AI) ──
const P = {
  primary: "162235",
  body: "000000",
  secondary: "5A6080",
  accent: "37DCF2",
  surface: "F8F9FF",
  cover: {
    titleColor: "FFFFFF",
    subtitleColor: "B0B8C0",
    metaColor: "90989F",
    footerColor: "687078",
  },
  table: {
    headerBg: "1B6B7A",
    headerText: "FFFFFF",
    accentLine: "1B6B7A",
    innerLine: "C8DDE2",
    surface: "EDF3F5",
  },
};

const c = (hex) => hex.replace("#", "");

// ── Helpers ──
function safeText(value, placeholder) {
  if (value === undefined || value === null || value === "" || String(value) === "NaN" || String(value) === "undefined") {
    return placeholder || "N/D";
  }
  return String(value);
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "SimHei" },
        size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 24,
      }),
    ],
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({
        text,
        size: 24,
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}

function bodyParaNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({
        text,
        size: 24,
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}

function boldBodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "SimHei" },
      }),
    ],
  });
}

function spacer(h = 120) {
  return new Paragraph({ spacing: { before: h } });
}

// ── Table builder ──
function makeTable(headers, rows, colWidths) {
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) },
    insideVertical: { style: BorderStyle.NONE },
  };

  const totalWidth = colWidths ? colWidths.reduce((a, b) => a + b, 0) : 100;

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: colWidths
          ? { size: Math.round((colWidths[i] / totalWidth) * 100), type: WidthType.PERCENTAGE }
          : { size: Math.round(100 / headers.length), type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: h, bold: true, size: 21, color: c(P.table.headerText), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
            ],
          }),
        ],
      })
    ),
  });

  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      cantSplit: true,
      children: row.map((cell, i) =>
        new TableCell({
          width: colWidths
            ? { size: Math.round((colWidths[i] / totalWidth) * 100), type: WidthType.PERCENTAGE }
            : { size: Math.round(100 / headers.length), type: WidthType.PERCENTAGE },
          shading:
            rowIdx % 2 === 0
              ? { type: ShadingType.CLEAR, fill: c(P.table.surface) }
              : { type: ShadingType.CLEAR, fill: "FFFFFF" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: safeText(cell), size: 20, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
              ],
            }),
          ],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [headerRow, ...dataRows],
  });
}

// ── Cover (R4 Top Color Block style) ──
function buildCover() {
  const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const allNoBorders = {
    top: NB, bottom: NB, left: NB, right: NB,
    insideHorizontal: NB, insideVertical: NB,
  };

  const title = "a 4 Zampe";
  const subtitle = "Documentazione Tecnologica della Piattaforma";
  const metaLines = [
    "Piattaforma di segnalazione animalistica per comuni italiani",
    "Architettura multi-tenant | Next.js 16 | React 19 | Prisma | SQLite",
    "Maggio 2026",
  ];

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: allNoBorders,
      rows: [
        new TableRow({
          height: { value: 16838, rule: "exact" },
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              verticalAlign: "top",
              borders: allNoBorders,
              shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
              children: [
                // Top color block
                new Paragraph({ spacing: { before: 2400 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                  children: [
                    new TextRun({
                      text: "🐾",
                      size: 72,
                      font: { ascii: "Segoe UI Emoji", eastAsia: "Segoe UI Emoji" },
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { line: 920, lineRule: "atLeast", after: 100 },
                  children: [
                    new TextRun({
                      text: title,
                      bold: true,
                      size: 72,
                      color: c(P.cover.titleColor),
                      font: { ascii: "Calibri", eastAsia: "SimHei" },
                    }),
                  ],
                }),
                // Accent line
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200, after: 200 },
                  border: {
                    bottom: { style: BorderStyle.SINGLE, size: 12, color: c(P.accent), space: 10 },
                  },
                  indent: { left: 3600, right: 3600 },
                  children: [],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200, line: 480, lineRule: "atLeast", after: 100 },
                  children: [
                    new TextRun({
                      text: subtitle,
                      size: 32,
                      color: c(P.accent),
                      font: { ascii: "Calibri", eastAsia: "SimHei" },
                    }),
                  ],
                }),
                // Meta lines
                ...metaLines.map(
                  (line) =>
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 80 },
                      children: [
                        new TextRun({
                          text: line,
                          size: 22,
                          color: c(P.cover.metaColor),
                          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
                        }),
                      ],
                    })
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

// ── Document Content ──
function buildBodyContent() {
  const content = [];

  // ─── 1. SINTESI ESECUTIVA ───
  content.push(heading("1. Sintesi Esecutiva"));
  content.push(
    bodyPara(
      '"a 4 Zampe" è una piattaforma web multi-tenant progettata per consentire ai cittadini italiani di segnalare problematiche legate agli animali, come randagismo, abbandono, maltrattamento e smarrimento. L\'applicazione è stata sviluppata per essere facilmente adattabile a qualsiasi comune italiano che ne faccia richiesta, con un\'architettura che separa completamente la configurazione del comune dal codice applicativo.'
    )
  );
  content.push(
    bodyPara(
      "La piattaforma si basa su uno stack tecnologico moderno e robusto: Next.js 16 come meta-framework React, TypeScript per la sicurezza dei tipi, Prisma come ORM con database SQLite, e una suite completa di librerie UI e di animazione. Il sistema implementa un modello di autenticazione personalizzato con ruoli differenziati (amministratore, polizia, ufficio, canile), un sistema di geofencing basato sulla formula di Haversine per determinare la zona operativa del comune, e un assistente AI integrato per la consulenza sulla normativa italiana in materia di tutela animale."
    )
  );
  content.push(
    bodyPara(
      "L\'architettura multi-tenant è realizzata tramite un record singleton `Comune` nel database, che memorizza nome, coordinate geografiche, contatti, credenziali e preferenze di branding. Al primo accesso, una procedura guidata (setup wizard) configura il comune, rendendo l\'applicazione immediatamente operativa senza modifiche al codice. Le segnalazioni vengono associate automaticamente al comune configurato, e il sistema di notifiche, l\'area operativa e la mappa interattiva si adattano dinamicamente ai parametri del comune."
    )
  );

  // ─── 2. STACK TECNOLOGICO PRINCIPALE ───
  content.push(heading("2. Stack Tecnologico Principale"));
  content.push(
    bodyPara(
      "La scelta dello stack tecnologico risponde a tre requisiti fondamentali: rapidità di sviluppo, manutenibilità a lungo termine e facilità di deployment anche in ambienti con risorse limitate, come quelli tipici delle amministrazioni comunali italiane. Di seguito si illustrano le tecnologie portanti della piattaforma e le motivazioni che ne hanno determinato la scelta."
    )
  );

  content.push(
    makeTable(
      ["Tecnologia", "Versione", "Ruolo"],
      [
        ["Next.js", "^16.1.1", "Meta-framework React con App Router, rendering SSR/SSG e output standalone"],
        ["React", "^19.0.0", "Libreria UI con supporto Server Components e concorrent rendering"],
        ["TypeScript", "^5", "Superset di JavaScript con tipizzazione statica per affidabilità del codice"],
        ["Bun", "^1.3.4", "Runtime JavaScript ad alte prestazioni e package manager"],
        ["Tailwind CSS", "^4", "Framework CSS utility-first con sistema di design token oklch"],
        ["Prisma", "^6.11.1", "ORM type-safe con migrazioni automatiche e query builder"],
        ["MySQL", "8.0+", "Database relazionale per persistenza scalabile e robusta"],
        ["shadcn/ui", "New York", "Libreria componenti Radix-based, accessibile e personalizzabile"],
        ["Zustand", "^5.0.6", "State management client-side leggero e performante"],
        ["TanStack React Query", "^5.82.0", "Gestione stato server con caching e polling automatico"],
      ],
      [30, 15, 55]
    )
  );
  content.push(spacer(200));

  content.push(heading("2.1 Next.js 16 e App Router", 2));
  content.push(
    bodyPara(
      "Next.js 16 rappresenta la spina dorsale dell\'applicazione, fornendo il sistema di routing basato su file system (App Router), il supporto per React Server Components, e la capacità di generare un build standalone che include tutte le dipendenze necessarie per l\'esecuzione in produzione. La configurazione utilizza `output: \"standalone\"` per creare un bundle autonomo, semplificando notevolmente il deployment in ambienti con risorse limitate. L\'App Router consente di definire API endpoints come route handler nella directory `src/app/api/`, garantendo una separazione netta tra logica di business e presentazione."
    )
  );
  content.push(
    bodyPara(
      "La gestione degli errori TypeScript in fase di build è configurata con `ignoreBuildErrors: true`, una scelta pragmatica che accelera il ciclo di sviluppo pur richiedendo attenzione alla correttezza dei tipi durante la scrittura del codice. Il React Strict Mode è disabilitato (`reactStrictMode: false`) per evitare doppi render durante lo sviluppo che potrebbero interferire con le logiche di polling e le animazioni Framer Motion."
    )
  );

  content.push(heading("2.2 React 19 e Rendering", 2));
  content.push(
    bodyPara(
      "React 19 introduce il supporto nativo per le Server Components e il concurrent rendering, permettendo di suddividere l\'interfaccia tra componenti renderizzati lato server e componenti interattivi lato client. Nell\'applicazione, la maggior parte dei componenti utilizza la direttiva `\"use client\"` per gestire stato e interattività, mentre le API routes operano esclusivamente lato server. Il pattern SPA-like è implementato tramite Zustand per la navigazione tra viste (`vistaAttuale`), evitando il file-based routing di Next.js per le viste principali e garantendo transizioni fluide e animate tramite Framer Motion."
    )
  );

  content.push(heading("2.3 TypeScript e Type Safety", 2));
  content.push(
    bodyPara(
      "TypeScript è utilizzato in tutto il progetto per garantire la sicurezza dei tipi e migliorare la manutenibilità. La configurazione prevede path alias (`@/*` mappato a `./src/*`), strict mode abilitato e target ES2017 per la compatibilità con i browser moderni. Gli enum e le interfacce TypeScript definiscono i tipi di segnalazione (`motivazione`, `tipoAnimale`, `taglia`, `urgenza`, `stato`), i ruoli utente e la configurazione del comune, fornendo un contratto rigoroso tra frontend e backend."
    )
  );

  content.push(heading("2.4 Bun come Runtime", 2));
  content.push(
    bodyPara(
      "Bun è stato scelto come runtime JavaScript e package manager per le sue prestazioni superiori rispetto a Node.js e npm. I tempi di installazione delle dipendenze sono ridotti drasticamente grazie al lockfile nativo di Bun, e l\'esecuzione degli script è più rapida. Il progetto include `bun-types` tra le dipendenze di sviluppo per il supporto completo dei tipi TypeScript nativi di Bun. Il comando di avvio in produzione utilizza `bun .next/standalone/server.js` per sfruttare le ottimizzazioni del runtime Bun."
    )
  );

  // ─── 3. DATABASE E ORM ───
  content.push(heading("3. Database e ORM"));
  content.push(
    bodyPara(
      "Il livello di persistenza dell\'applicazione è gestito da Prisma ORM con MySQL come database relazionale. Questa scelta garantisce scalabilità, integrità referenziale robusta e supporto alla concorrenza elevata, requisiti fondamentali per la gestione di dati istituzionali."
    )
  );

  content.push(heading("3.1 Prisma ORM", 2));
  content.push(
    bodyPara(
      "Prisma funge da layer di astrazione tra il codice TypeScript e il database SQLite, fornendo un query builder type-safe che previene errori a runtime e semplifica le operazioni CRUD. Il singleton Prisma Client è istanziato nel modulo `src/lib/db.ts` per evitare la creazione di connessioni multiple in ambiente di sviluppo (dove Next.js esegue l\'hot-reload). Le migrazioni dello schema sono gestite tramite i comandi Prisma CLI, e il file `prisma/schema.prisma` definisce l\'intero modello dati dell\'applicazione."
    )
  );

  content.push(heading("3.2 Schema del Database", 2));
  content.push(
    bodyPara(
      "Il database contiene sei modelli principali che coprono tutte le entità dell\'applicazione. Il modello `Comune` (singleton) memorizza la configurazione del comune inclusiva di nome, coordinate geografiche, raggio operativo, contatti di emergenza e credenziali di accesso. Il modello `Segnalazione` è l\'entità centrale e contiene tutti i dati della segnalazione: posizione GPS, tipo di animale, motivazione, urgenza, stato, dati del segnalatore, consensi GDPR e flag di fuori zona. I modelli `Notifica` e `LogModifica` implementano rispettivamente il sistema di notifiche e l\'audit trail. Il modello `TokenAccesso` gestisce i codici OTP per l\'accesso all\'area personale dei cittadini. Il modello `Utente` registra i cittadini che effettuano segnalazioni."
    )
  );

  content.push(
    makeTable(
      ["Modello", "Campi Principali", "Scopo"],
      [
        ["Comune", "nomeComune, slug, latCentro, lngCentro, raggioKm, credenziali, colorePrimario", "Configurazione multi-tenant del comune"],
        ["Segnalazione", "titolo, descrizione, lat/lng, tipoAnimale, motivazione, urgenza, stato, fotoUrl, consensoPrivacy", "Segnalazione animale con geolocalizzazione"],
        ["Utente", "email, nome, cognome, telefono, ruolo", "Profilo del cittadino segnalatore"],
        ["Notifica", "messaggio, tipo, letta, segnalazioneId", "Notifiche per gli operatori"],
        ["TokenAccesso", "email, token, usato, scadenza", "Codice OTP per accesso area personale"],
        ["LogModifica", "campoModificato, valorePrecedente, valoreNuovo, modificatoDa", "Audit trail delle modifiche"],
      ],
      [18, 45, 37]
    )
  );
  content.push(spacer(200));

  content.push(heading("3.3 MySQL e Deployment", 2));
  content.push(
    bodyPara(
      "La scelta di MySQL come database risponde alla necessità di avere un sistema di gestione dati centralizzato e altamente performante. In configurazione Docker, viene utilizzato un servizio dedicato `db` basato sull'immagine ufficiale MySQL 8.0. La persistenza dei dati è garantita da volumi Docker esterni, assicurando che i dati dell'anagrafe canina e delle segnalazioni siano protetti anche durante gli aggiornamenti del container applicativo. La connessione è gestita tramite pool di connessioni ottimizzati da Prisma."
    )
  );

  // ─── 4. ARCHITETTURA MULTI-TENANT ───
  content.push(heading("4. Architettura Multi-Tenant"));
  content.push(
    bodyPara(
      "L\'architettura multi-tenant è il principio cardine della piattaforma, che permette di servire qualsiasi comune italiano con una singola installazione. Il design si basa sul pattern \"singleton per deployment\": ogni istanza dell\'applicazione serve un unico comune, ma la configurazione è interamente dinamica e gestita tramite database, senza riferimenti hardcoded nel codice."
    )
  );

  content.push(heading("4.1 Modello di Configurazione Comune", 2));
  content.push(
    bodyPara(
      "Il record `Comune` nel database memorizza tutti i parametri necessari al funzionamento dell\'applicazione per un dato comune. Il campo `nomeComune` definisce il nome visualizzato nell\'interfaccia (es. \"Comune di Naro\"), mentre `nomeApp` personalizza il titolo dell\'applicazione (es. \"Naro a 4 Zampe\"). I campi `latCentro` e `lngCentro` definiscono le coordinate del centro del comune utilizzate per il geofencing e il posizionamento della mappa. Il campo `raggioKm` (default 10 km) stabilisce il raggio dell\'area operativa: le segnalazioni fuori zona vengono flaggate automaticamente. Il campo `credenziali` è un array JSON che memorizza le credenziali di accesso degli operatori con ruoli differenziati (amministratore, polizia, ufficio, canile). Il campo `colorePrimario` permette la personalizzazione cromatica dell\'interfaccia."
    )
  );

  content.push(heading("4.2 Setup Wizard", 2));
  content.push(
    bodyPara(
      "Al primo accesso, l\'applicazione rileva l\'assenza di un record `Comune` e avvia automaticamente una procedura guidata di setup in quattro step: Identità (nome del comune e dell\'app), Geografia (coordinate e raggio operativo), Contatti (telefono emergenza, veterinaria, email) e Credenziali (account amministratore). Al termine, il record `Comune` viene creato e il flag `setupCompletato` viene impostato a true, sbloccando l\'accesso all\'applicazione completa. Questo approccio elimina la necessità di file di configurazione esterni o di modifiche al codice per ogni nuovo comune."
    )
  );

  content.push(heading("4.3 Geofencing e Formula di Haversine", 2));
  content.push(
    bodyPara(
      "Il sistema di geofencing determina automaticamente se una segnalazione ricade entro l\'area operativa del comune. La distanza tra il punto della segnalazione e il centro del comune è calcolata utilizzando la formula di Haversine, che tiene conto della curvatura terrestre per calcolare la distanza sulla superficie di una sfera. L\'implementazione è disponibile nel modulo `src/lib/geo.ts` ed è replicata nelle API routes per la validazione lato server. Le segnalazioni con distanza superiore al raggio operativo ricevono il flag `fuoriZona = true` e le transizioni di stato sono bloccate nella dashboard per prevenire l\'elaborazione di segnalazioni fuori competenza."
    )
  );
  content.push(
    bodyPara(
      "La formula di Haversine è implementata come segue: dato due punti con latitudine e longitudine (lat1, lon1) e (lat2, lon2), si calcola la differenza di latitudine e longitudine in radianti, si applicano le funzioni seno e coseno secondo la formula, e si ottiene la distanza angolare che viene moltiplicata per il raggio medio della Terra (6.371 km) per ottenere la distanza in chilometri. Questo calcolo è preciso a meno dell\'0,5% per distanze fino a 100 km, più che sufficiente per l\'uso previsto."
    )
  );

  // ─── 5. GESTIONE DELLO STATO ───
  content.push(heading("5. Gestione dello Stato"));
  content.push(
    bodyPara(
      "L\'applicazione adotta una strategia di gestione dello stato a due livelli: lo stato client-side è gestito da Zustand, mentre lo stato server-side è gestito da TanStack React Query con caching e polling automatico. Questa separazione permette di mantenere l\'interfaccia reattiva e sincronizzata con i dati del server senza complicare la logica dei componenti."
    )
  );

  content.push(heading("5.1 Zustand: Stato Client-Side", 2));
  content.push(
    bodyPara(
      "Zustand è utilizzato come store globale per lo stato dell\'interfaccia che non ha bisogno di essere sincronizzato con il server. Lo store (`src/lib/store.ts`) gestisce la vista attuale (`vistaAttuale`), la segnalazione selezionata, i filtri applicati alla mappa e alla lista, lo stato del menu mobile, e le informazioni di autenticazione dell\'amministratore. La navigazione tra le viste principali (home, segnala, mappa, dashboard, area-personale, chat-ai, setup) avviene tramite la funzione `impostaVista()` dello store, che aggiorna lo stato e triggera le animazioni di transizione tramite Framer Motion. Questo pattern SPA-like elimina la necessità di routing basato su URL per le viste principali."
    )
  );

  content.push(heading("5.2 TanStack React Query: Stato Server-Side", 2));
  content.push(
    bodyPara(
      "TanStack React Query gestisce tutte le richieste di dati al server, con caching automatico, invalidazione intelligente e supporto al polling. Il QueryClient è configurato con uno stale time di 60 secondi e un solo tentativo di retry in caso di errore. Le query attive includono le statistiche della dashboard, la lista delle segnalazioni con ricerca debounced, le notifiche, l\'area operativa e la lista utenti. Due query utilizzano il polling periodico: i report urgenti vengono ricaricati ogni 15 secondi per garantire l\'allarme tempestivo, mentre il conteggio delle notifiche non lette viene aggiornato ogni 30 secondi. Le mutazioni coprono l\'aggiornamento dello stato delle segnalazioni, la marcatura delle notifiche come lette e la creazione di nuove segnalazioni."
    )
  );

  // ─── 6. AUTENTICAZIONE E SICUREZZA ───
  content.push(heading("6. Autenticazione e Sicurezza"));
  content.push(
    bodyPara(
      "Il sistema di autenticazione dell\'applicazione è implementato in modo personalizzato, senza utilizzare librerie di terze parti come NextAuth (sebbene presente tra le dipendenze, non è attivamente utilizzato). Questa scelta architetturale è stata dettata dalla necessità di un sistema flessibile che potesse adattarsi alle specifiche dei diversi comuni senza dipendere da provider esterni."
    )
  );

  content.push(heading("6.1 Autenticazione Amministratore", 2));
  content.push(
    bodyPara(
      "Le credenziali degli amministratori sono memorizzate come array JSON nel campo `credenziali` del record `Comune`. Il login avviene tramite `POST /api/auth`, che valida le credenziali confrontandole con quelle memorizzate. Lo stato di autenticazione è mantenuto lato client nello store Zustand e comprende il nome utente, il ruolo e lo stato di autenticazione. I ruoli supportati includono: `amministratore` (accesso completo alla dashboard), `polizia` (gestione segnalazioni e notifiche), `ufficio` (consultazione e aggiornamento stato), e `canile` (gestione specifica dei cani). Un sistema RBAC parallelo, gestito tramite l\'API `/api/admin-accounts`, aggiunge ruoli granulari come `super_admin`, `admin`, `operatore` e `consultatore` con privilegi configurabili."
    )
  );

  content.push(heading("6.2 Token di Accesso Area Personale", 2));
  content.push(
    bodyPara(
      "L\'accesso all\'area personale dei cittadini è protetto da un sistema di token OTP (One-Time Password) a 6 cifre. Il flusso prevede che il cittadino inserisca la propria email, il sistema generi un token numerico casuale tramite `crypto.randomInt()` di Node.js con scadenza di 15 minuti, e il token venga verificato in un secondo step. Il sistema è rate-limited a 3 richieste per email ogni 5 minuti per prevenire abusi. In ambiente di sviluppo il token è restituito direttamente nella risposta API, mentre in produzione è previsto l\'invio via email SMTP (attualmente con placeholder in attesa di integrazione con un servizio di posta elettronica)."
    )
  );

  content.push(heading("6.3 Conformità GDPR", 2));
  content.push(
    bodyPara(
      "La piattaforma implementa specifiche misure di conformità al GDPR. La creazione di una segnalazione richiede l\'accettazione obbligatoria di due consensi: l\'informativa sulla privacy e la dichiarazione di responsabilità. Entrambi i consensi sono registrati con timestamp nel campo `dataConsenso` del record Segnalazione. L\'API `/api/cittadino` supporta la richiesta di cancellazione o copia dei dati personali (diritto all\'oblio e diritto alla portabilità), e l\'audit trail tramite il modello `LogModifica` traccia ogni modifica ai dati delle segnalazioni con il responsabile della modifica."
    )
  );

  // ─── 7. MAPPA INTERATTIVA E GEOGRAFIA ───
  content.push(heading("7. Mappa Interattiva e Geografia"));
  content.push(
    bodyPara(
      "La componente cartografica dell\'applicazione è realizzata con Leaflet e react-leaflet, fornendo una mappa interattiva completa con marker personalizzati, popup informativi e funzionalità di fly-to. La scelta di Leaflet rispetto ad alternative come Mapbox o Google Maps è motivata dalla natura open-source, dalla leggerezza e dall\'assenza di costi di licenza, fattori cruciali per un\'applicazione destinata alla pubblica amministrazione."
    )
  );

  content.push(heading("7.1 Implementazione Leaflet", 2));
  content.push(
    bodyPara(
      "Leaflet v1.9.4 è utilizzato insieme a react-leaflet v5.0.0 per l\'integrazione con React. Per evitare problemi di SSR (Server-Side Rendering), entrambi i componenti mappa (`MappaLeaflet` e `MappaSegnalaLeaflet`) sono caricati dinamicamente tramite `next/dynamic` con `ssr: false`. Il CSS di Leaflet è caricato dinamicamente dall\'CDN unpkg. I tile cartografici utilizzati sono CARTO Voyager, uno stile chiaro e leggibile disponibile gratuitamente che offre un eccellente equilibrio tra dettaglio e pulizia visiva."
    )
  );

  content.push(heading("7.2 Marker Personalizzati e Funzionalità", 2));
  content.push(
    bodyPara(
      "I marker sulla mappa sono implementati come DivIcon HTML personalizzati con colori basati sul livello di urgenza: verde (bassa), giallo (media), arancione (alta) e rosso (critica). Ogni marker mostra un popup con le informazioni essenziali della segnalazione. La mappa include funzionalità di fly-to per l\'animazione di spostamento tra punti, un sistema di tracciamento del centro dell\'area operativa, un toggle audio per le notifiche di urgenza critica (utilizzando la Web Audio API per generare un suono di allarme), e la visualizzazione dell\'indice di criticità basato sulla densità delle segnalazioni."
    )
  );

  content.push(heading("7.3 Rilevamento Duplicati", 2));
  content.push(
    bodyPara(
      "Il sistema implementa un meccanismo automatico di rilevamento duplicati basato sulla prossimità geografica. Durante la creazione di una nuova segnalazione, le API verificano l\'esistenza di segnalazioni entro un raggio di 200 metri, flaggando potenziali duplicati. L\'endpoint `/api/segnalazioni/[id]/simili` restituisce segnalazioni simili entro un raggio di 500 metri, permettendo agli operatori di identificare e consolidare segnalazioni relative allo stesso animale o alla stessa situazione."
    )
  );

  // ─── 8. INTERFACCIA UTENTE ───
  content.push(heading("8. Interfaccia Utente e Componenti"));
  content.push(
    bodyPara(
      "L\'interfaccia utente è costruita su shadcn/ui, una libreria di componenti accessibili e personalizzabili basati sulle primitive Radix UI. Lo stile selezionato è \"New York\" con colore base neutrale e supporto per variabili CSS. La libreria fornisce 48 componenti pronti all\'uso che coprono ogni esigenza dell\'applicazione, dai controlli di form ai componenti di layout."
    )
  );

  content.push(heading("8.1 Libreria Componenti shadcn/ui", 2));
  content.push(
    bodyPara(
      "I componenti shadcn/ui installati coprono un\'ampia gamma di funzionalità: controlli di form (button, input, select, checkbox, radio-group, slider, switch, textarea), componenti di layout (card, tabs, accordion, separator, scroll-area, resizable), feedback (alert, dialog, drawer, toast/sonner, progress, skeleton), navigazione (navigation-menu, menubar, dropdown-menu, command, breadcrumb, pagination), e componenti specializzati (calendar, input-otp, chart, carousel). Ogni componente è personalizzabile tramite le variabili CSS del tema e supporta le varianti di stile tramite class-variance-authority (CVA)."
    )
  );

  content.push(heading("8.2 Animazioni e Transizioni", 2));
  content.push(
    bodyPara(
      "Framer Motion v12 è utilizzato per tutte le animazioni dell\'interfaccia, incluse le transizioni tra viste, le animazioni di ingresso dei componenti e i micro-interazioni. Il pattern AnimatePresence assicura che le transizioni tra viste avvengano con animazioni di uscita e ingresso sincronizzate. Tailwind CSS Animate e tw-animate-css forniscono classi di utilità per animazioni CSS comuni. Il tema include animazioni keyframe personalizzate definite in globals.css: pulse (pulsazione per elementi attivi), glow (bagliore per elementi in evidenza), float (fluttuazione per elementi decorativi), scan (scansione per indicatori di caricamento) e ripple (onda per feedback tattile)."
    )
  );

  content.push(heading("8.3 Tema e Personalizzazione", 2));
  content.push(
    bodyPara(
      "Il sistema di theming si basa su variabili CSS custom properties con colori definiti nello spazio oklch per una gamma cromatica più ampia e coerente. Il tema predefinito utilizza tonalità giallo arenario (arenario) con hue 85, che conferisce all\'applicazione un aspetto caldo e professionale distinguendola dal classico blu delle applicazioni istituzionali. Il dark mode è supportato tramite la classe CSS `dark` con un set completo di variabili per sfondi, testi e accenti. Classi CSS personalizzate come `.glassmorphism` e `.glassmorphism-scuro` implementano l\'effetto vetro smerigliato per elementi sovrapposti alla mappa."
    )
  );

  // ─── 9. API ENDPOINTS ───
  content.push(heading("9. API Endpoints"));
  content.push(
    bodyPara(
      "L\'applicazione espone un insieme completo di API REST tramite i route handler di Next.js App Router. Ogni endpoint implementa validazione degli input tramite schema Zod, gestione degli errori strutturata e risposte JSON standardizzate. La validazione Zod è applicata a tutti gli endpoint POST e PATCH, garantendo che i dati in ingresso rispettino i vincoli di tipo, formato e valore attesi."
    )
  );

  content.push(
    makeTable(
      ["Metodo", "Endpoint", "Descrizione"],
      [
        ["POST", "/api/auth", "Login amministratore — validazione credenziali"],
        ["GET/POST", "/api/segnalazioni", "Lista con filtri / Creazione nuova segnalazione"],
        ["GET/PATCH/DELETE", "/api/segnalazioni/[id]", "Dettaglio / Aggiornamento stato / Eliminazione"],
        ["GET", "/api/segnalazioni/[id]/simili", "Segnalazioni simili entro 500m"],
        ["GET", "/api/segnalazioni/stats", "Statistiche dashboard (conteggi, trend mensili)"],
        ["GET", "/api/segnalazioni/area-operativa", "Centro e raggio area operativa"],
        ["GET/POST/PUT", "/api/comune", "Configurazione comune (lettura, setup, aggiornamento)"],
        ["GET/PATCH", "/api/notifiche", "Lista notifiche / Marcatura come lette"],
        ["POST", "/api/token-accesso", "Generazione e verifica token OTP"],
        ["GET/POST", "/api/cittadino", "Ricerca segnalazioni / Richiesta GDPR"],
        ["GET", "/api/utenti", "Lista segnalatori con statistiche"],
        ["POST", "/api/chat-ai", "Chat con assistente AI"],
        ["POST", "/api/seed", "Popolamento dati demo"],
      ],
      [10, 35, 55]
    )
  );
  content.push(spacer(200));

  // ─── 10. INTEGRAZIONE AI ───
  content.push(heading("10. Integrazione AI"));
  content.push(
    bodyPara(
      "La piattaforma integra un assistente AI conversazionale specializzato nella normativa italiana di tutela animale, utilizzando lo SDK z-ai-web-dev-sdk. L\'assistente fornisce consulenza in tempo reale ai cittadini e agli operatori sulle normative vigenti, le procedure di segnalazione e i diritti degli animali."
    )
  );
  content.push(
    bodyPara(
      "Il system prompt dell\'AI è generato dinamicamente includendo il nome del comune configurato e un set di conoscenze specializzate che coprono la Legge 281/1991 (disposizioni in materia di animali d\'affezione e prevenzione del randagismo), il Codice Penale art. 544-ter (maltrattamento di animali), la Legge 189/2004 (disposizioni concernenti il divieto di maltrattamento degli animali) e le normative regionali sulla gestione del randagismo. La configurazione prevede un limite di 500 token per risposta e una temperatura di 0.7 per bilanciare accuratezza e naturalità del linguaggio. La chat supporta conversazioni multi-turno con storico e pulsanti di domande rapide per le richieste più comuni."
    )
  );

  // ─── 11. VALIDAZIONE E FORM ───
  content.push(heading("11. Validazione e Gestione Form"));
  content.push(
    bodyPara(
      "Il sistema di validazione dell\'applicazione si articola su due livelli: la validazione lato client nei form React e la validazione lato server nelle API routes, entrambe basate sulla libreria Zod. Questa doppia validazione garantisce l\'integrità dei dati indipendentemente dal punto di ingresso."
    )
  );
  content.push(
    bodyPara(
      "React Hook Form v7 è utilizzato per la gestione dello stato dei form, integrato con Zod tramite `@hookform/resolvers` per la validazione dichiarativa degli schemi. Il form di segnalazione è strutturato come un wizard multi-step in quattro fasi: Posizione (selezione sulla mappa con reverse geocoding Nominatim), Dettagli (tipo animale, motivazione, urgenza, descrizione, foto), Dati Personali (nome, cognome, email, telefono), e Consensi (privacy e dichiarazione di responsabilità). Ogni step è validato indipendentemente prima di procedere al successivo, e una barra di progresso animata indica l\'avanzamento."
    )
  );

  // ─── 12. DIPENDENZE COMPLETE ───
  content.push(heading("12. Dipendenze Complete"));
  content.push(
    bodyPara(
      "Di seguito si riporta l\'elenco completo delle dipendenze di produzione e sviluppo dell\'applicazione, organizzate per categoria funzionale. Ciascuna libreria è stata selezionata per il suo contributo specifico all\'architettura e all\'esperienza utente della piattaforma."
    )
  );

  content.push(heading("12.1 Dipendenze di Produzione", 2));

  content.push(
    makeTable(
      ["Categoria", "Libreria", "Versione", "Scopo"],
      [
        ["Core", "next", "^16.1.1", "Meta-framework React con App Router"],
        ["Core", "react / react-dom", "^19.0.0", "Libreria UI e rendering DOM"],
        ["Core", "typescript", "^5", "Tipizzazione statica"],
        ["ORM", "prisma / @prisma/client", "^6.11.1", "ORM e query builder type-safe"],
        ["State", "zustand", "^5.0.6", "Store client-side globale"],
        ["State", "@tanstack/react-query", "^5.82.0", "Gestione stato server con caching"],
        ["Form", "react-hook-form", "^7.60.0", "Gestione stato form"],
        ["Form", "@hookform/resolvers", "^5.1.1", "Bridge validazione Zod"],
        ["Form", "zod", "^4.0.2", "Schema validation"],
        ["UI", "lucide-react", "^0.525.0", "Libreria icone (480+ icone)"],
        ["UI", "framer-motion", "^12.23.2", "Animazioni e transizioni"],
        ["UI", "sonner", "^2.0.6", "Toast notifications"],
        ["UI", "embla-carousel-react", "^8.6.0", "Carousel / slider"],
        ["UI", "cmdk", "^1.1.1", "Command palette"],
        ["UI", "vaul", "^1.1.2", "Drawer component"],
        ["UI", "input-otp", "^1.4.2", "Input codice OTP"],
        ["Mappe", "leaflet", "^1.9.4", "Mappa interattiva"],
        ["Mappe", "react-leaflet", "^5.0.0", "Wrapper React per Leaflet"],
        ["Grafici", "recharts", "^2.15.4", "Grafici (BarChart, PieChart)"],
        ["Data", "date-fns", "^4.1.0", "Utility per date"],
        ["Utilità", "uuid", "^11.1.0", "Generazione identificativi univoci"],
        ["Utilità", "sharp", "^0.34.3", "Elaborazione immagini lato server"],
        ["Utilità", "clsx / tailwind-merge", "latest", "Composizione classi CSS"],
        ["AI", "z-ai-web-dev-sdk", "^0.0.17", "SDK per AI chat"],
        ["DnD", "@dnd-kit/core + sortable", "^6.3.1", "Drag and drop"],
        ["Markdown", "react-markdown + syntax-highlighter", "latest", "Rendering Markdown"],
        ["Editor", "@mdxeditor/editor", "^3.39.1", "Editor rich text MDX"],
        ["Layout", "react-resizable-panels", "^3.0.3", "Pannelli ridimensionabili"],
      ],
      [12, 30, 12, 46]
    )
  );
  content.push(spacer(200));

  content.push(heading("12.2 Dipendenze di Sviluppo", 2));
  content.push(
    makeTable(
      ["Libreria", "Versione", "Scopo"],
      [
        ["@tailwindcss/postcss", "^4", "Plugin PostCSS per Tailwind CSS v4"],
        ["@types/react / @types/react-dom", "^19", "Type definitions per React"],
        ["@types/leaflet", "^1.9.21", "Type definitions per Leaflet"],
        ["bun-types", "^1.3.4", "Type definitions per runtime Bun"],
        ["eslint / eslint-config-next", "^9 / ^16.1.1", "Linting e regole Next.js"],
        ["tailwindcss / tw-animate-css", "^4 / ^1.3.5", "Framework CSS e animazioni"],
      ],
      [40, 15, 45]
    )
  );
  content.push(spacer(200));

  // ─── 13. DEPLOYMENT ───
  content.push(heading("13. Deployment e Infrastruttura"));
  content.push(
    bodyPara(
      "Il deployment dell\'applicazione è progettato per essere semplice e leggero, coerentemente con il contesto d\'uso in amministrazioni comunali con risorse IT limitate. Il processo di build genera un bundle standalone che include tutte le dipendenze necessarie per l\'esecuzione."
    )
  );

  content.push(heading("13.1 Build e Avvio", 2));
  content.push(
    bodyPara(
      "Il processo di build utilizza il comando `next build` con output standalone, che crea un bundle autonomo nella directory `.next/standalone/`. I file statici vengono copiati manualmente nel bundle con i comandi `cp -r .next/static .next/standalone/.next/` e `cp -r public .next/standalone/`. In produzione, il server viene avviato con `NODE_ENV=production bun .next/standalone/server.js`, sfruttando il runtime Bun per prestazioni ottimali. La configurazione Caddy funge da reverse proxy, inoltrando le richieste dalla porta 81 alla porta 3000 dell\'applicazione Next.js, con supporto per header di forwarding e un meccanismo speciale `XTransformPort` per il port forwarding dinamico."
    )
  );

  content.push(heading("13.2 Variabili d\'Ambiente", 2));
  content.push(
    bodyPara(
      "L\'unica variabile d\'ambiente richiesta è `DATABASE_URL`, che specifica il percorso del file SQLite nel formato `file:/path/to/database`. L\'assenza di altre variabili d\'ambiente semplifica il deployment e riduce la superficie di errore. Tutti i parametri di configurazione del comune sono memorizzati nel database e gestiti tramite l\'interfaccia di setup, eliminando la necessità di variabili d\'ambiente aggiuntive per ogni deployment."
    )
  );

  // ─── 14. QUALITÀ DEL CODICE ───
  content.push(heading("14. Qualità del Codice e Strumenti"));
  content.push(
    bodyPara(
      "Il progetto utilizza ESLint v9 con `eslint-config-next` per il linting del codice. La configurazione è permissiva, con diverse regole disabilitate per accelerare lo sviluppo: `no-explicit-any: off`, `no-unused-vars: off`, `no-console: off`. Non è presente un file middleware.ts di Next.js, e non esistono configurazioni Docker. La validazione degli input è garantita da Zod in ogni endpoint API, e l\'Error Boundary React wrapping il contenuto principale fornisce un fallback visivo in caso di errori di rendering."
    )
  );
  content.push(
    bodyPara(
      "Il pattern di audit trail implementato tramite il modello `LogModifica` registra ogni modifica allo stato di una segnalazione, includendo il campo modificato, il valore precedente e quello nuovo, l\'identità dell\'amministratore responsabile e il timestamp. Questo meccanismo è essenziale per la tracciabilità e la responsabilità in un contesto di pubblica amministrazione, dove ogni azione deve essere ricostruibile."
    )
  );

  // ─── 15. STRUTTURA DEI FILE ───
  content.push(heading("15. Struttura dei File del Progetto"));
  content.push(
    bodyPara(
      "L\'organizzazione dei file segue le convenzioni di Next.js App Router, con una chiara separazione tra componenti UI, logica di business e configurazione. Di seguito si riporta la struttura principale del progetto con le directory e i file più significativi."
    )
  );

  content.push(
    makeTable(
      ["Percorso", "Contenuto"],
      [
        ["prisma/schema.prisma", "Schema del database (6 modelli)"],
        ["src/app/layout.tsx", "Layout root (font Geist, lang it)"],
        ["src/app/page.tsx", "Entry point SPA (QueryClient, AnimatePresence)"],
        ["src/app/globals.css", "Tema completo (variabili oklch, animazioni, Leaflet)"],
        ["src/app/api/auth/", "Endpoint autenticazione"],
        ["src/app/api/segnalazioni/", "CRUD + stats + area-operativa + simili"],
        ["src/app/api/comune/", "Configurazione comune"],
        ["src/app/api/token-accesso/", "Generazione e verifica OTP"],
        ["src/app/api/chat-ai/", "Endpoint AI chat"],
        ["src/app/api/cittadino/", "Ricerca e GDPR cittadino"],
        ["src/components/ui/", "48 componenti shadcn/ui"],
        ["src/components/*.tsx", "20 componenti custom dell\'applicazione"],
        ["src/lib/store.ts", "Store Zustand globale"],
        ["src/lib/db.ts", "Singleton Prisma Client"],
        ["src/lib/geo.ts", "Calcolo distanza Haversine"],
        ["src/lib/constants.ts", "Mappe colori, etichette, configurazioni grafici"],
        ["src/lib/tenant.ts", "Configurazione multi-tenant e helper"],
        ["Caddyfile", "Reverse proxy (porta 81 → 3000)"],
        ["next.config.ts", "Output standalone, config TypeScript"],
      ],
      [40, 60]
    )
  );
  content.push(spacer(200));

  content.push(
    bodyPara(
      "Questa architettura garantisce che l\'applicazione possa essere estesa e personalizzata per qualsiasi comune italiano con il minimo sforzo, mantenendo al contempo elevati standard di qualità del codice, sicurezza dei dati e usabilità dell\'interfaccia."
    )
  );

  return content;
}

// ── Assemble Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 24,
          color: c(P.body),
        },
        paragraph: {
          spacing: { line: 312 },
        },
      },
      heading1: {
        run: {
          font: { ascii: "Calibri", eastAsia: "SimHei" },
          size: 32,
          bold: true,
          color: c(P.primary),
        },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: {
          font: { ascii: "Calibri", eastAsia: "SimHei" },
          size: 28,
          bold: true,
          color: c(P.primary),
        },
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
      heading3: {
        run: {
          font: { ascii: "Calibri", eastAsia: "SimHei" },
          size: 24,
          bold: true,
          color: c(P.primary),
        },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCover(),
    },
    // Section 2: Body
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "a 4 Zampe — Documentazione Tecnologica",
                  size: 18,
                  color: "808080",
                  font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" }),
              ],
            }),
          ],
        }),
      },
      children: buildBodyContent(),
    },
  ],
});

// ── Export ──
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/home/z/my-project/download/a4Zampe_Documentazione_Tecnologica.docx", buffer);
  console.log("Document generated successfully!");
});
