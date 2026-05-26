# Task ID: 11 - Agent: Code Agent
## Task: Rewrite SegnalaView.tsx with multi-step form

### Work Log:
- Read worklog.md and existing SegnalaView.tsx, store.ts, API route, Prisma schema, and UI components
- Updated Prisma schema: added `codiceFiscale`, `cittaSegnalatore`, `provinciaSegnalatore`, `capSegnalatore`, `dataNascitaSegnalatore` fields to Segnalazione model
- Ran `bun run db:push` to sync database
- Updated API route `/api/segnalazioni/route.ts`: added new fields to `creaSegnalazioneSchema` Zod validation including codiceFiscale with regex pattern
- Completely rewrote `/src/components/SegnalaView.tsx` with:
  - **Multi-step form** (4 steps) with `framer-motion AnimatePresence` slide transitions
  - **Step indicator** with larger circles (w-10 h-10), step numbers, icons, pulse animation on active step, clickable to go back, colored connectors (amber=completed, gray=upcoming), tooltips
  - **Step 1 (Posizione)**: MappaSegnalaLeaflet dynamic import, Nominatim reverse geocoding with 500ms debounce auto-fill, coordinate display, address field with loading indicator
  - **Step 2 (Dettagli)**: Titolo, Descrizione, Animal Type Selector (3 large colored grid buttons: 🐕 Cane amber, 🐈 Gatto indigo, 🐾 Altro teal), Motivazione Selector (6 colored grid buttons 2x3), Urgency Grid (4 colored buttons with ring on selected), Razza/Colore/Taglia, foto upload
  - **Step 3 (I Tuoi Dati)**: Nome, Cognome, Email, Telefono, Codice Fiscale (with 16-char Italian validation), Indirizzo residenza, Città, Provincia, CAP, Data di nascita
  - **Step 4 (Consenso)**: Same GDPR sections with red/blue left borders
  - **Navigation**: Indietro/Avanti/Invia Segnalazione buttons with step validation
  - **Zod schema**: Added tipoAnimale, motivazione, codiceFiscale, indirizzoSegnalatore, cittaSegnalatore, provinciaSegnalatore, capSegnalatore, dataNascitaSegnalatore
  - Used `TooltipProvider`/`Tooltip`/`TooltipContent`/`TooltipTrigger` from shadcn
  - 'use client' directive
  - Amber/orange color scheme throughout
- Lint passes with zero errors
- Dev server running without issues

### Stage Summary:
- Complete multi-step form with AnimatePresence transitions
- All new fields in schema, API, and form
- Nominatim reverse geocoding with debounce
- All selector grids with colored buttons and tooltips
- Step indicator with pulse, connectors, and clickable navigation
