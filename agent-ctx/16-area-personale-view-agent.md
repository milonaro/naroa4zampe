# Task ID: 16 - Agent: Code Agent
## Task: Create AreaPersonaleView.tsx component

### Work Log:
- Created `/home/z/my-project/src/components/AreaPersonaleView.tsx` with full Area Personale page
- Updated `/home/z/my-project/src/app/api/segnalazioni/route.ts` to support `emailSegnalatore` filter and include `logModifiche` in response
- Updated `/home/z/my-project/src/app/page.tsx` to route `area-personale` vista to `AreaPersonaleView`

### Component Features:
1. **Search Section**: Toggle between Email and Codice Fiscale search modes, input field with validation, Enter key support
2. **Status Summary Cards**: 4 stat cards (Totale Segnalazioni, Ricevute, In Lavorazione, Risolte) with amber/orange color scheme
3. **Report List**: Card list with urgenza/stato/motivazione/tipoAnimale badges, click opens detail popup via selezionaSegnalazione
4. **Modification Timeline**: Expandable timeline per report showing logModifiche with animated expand/collapse
5. **GDPR Consent Management**: Shows privacy/dichiarazione consent status, "Richiedi cancellazione dati" and "Richiedi copia dati" buttons with toast confirmations

### Badge Colors:
- motivazione: randagismo (blue), abbandono (red), maltrattamento (purple), smarrimento (yellow), rinvenimento (green), altro (gray)
- tipoAnimale: cane (amber), gatto (indigo), altro (teal)

### Technical Details:
- Uses `useQuery` from TanStack React Query with `emailSegnalatore` query parameter
- Uses `framer-motion` for animations (stagger, fade, slide)
- Uses `sonner` toast for notifications
- Uses shadcn/ui components: Card, Button, Badge, Input, Label, Separator
- Codice Fiscale search shows "coming soon" notice (not yet in DB schema)
- Lint passes with 0 errors (1 pre-existing warning in SegnalaView.tsx)
