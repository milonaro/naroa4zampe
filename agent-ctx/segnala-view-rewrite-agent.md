# SegnalaView Rewrite — Work Record

## Task
Rewrite `/home/z/my-project/src/components/SegnalaView.tsx` with 10 specified features for the "Naro a 4 Zampe" project.

## Changes Made

### 1. `/home/z/my-project/src/components/SegnalaView.tsx` — Complete Rewrite
- **Step-by-step form**: Only the current step is shown, with AnimatePresence + Framer Motion slide/fade transitions between steps
- **Improved Step Indicator**: Large circles (w-12 active, w-10 others), icons for non-completed steps (MapPin, ClipboardList, User, Shield), Check icon for completed, pulse animation on active, clickable to go back to completed steps, green connector lines for completed steps, Tooltip on each step
- **Urgency as Grid of Colored Buttons**: 4 buttons (Bassa=green, Media=yellow, Alta=orange, Critica=red) with tooltips and ring highlight on selection
- **Tipo Animale selector**: 3 emoji buttons (Cane 🐕, Gatto 🐈, Altro 🐾) with tooltips
- **Motivazione selector**: 6 colored options with emoji (🟡 Randagismo, 🔴 Abbandono, 🟣 Maltrattamento, 🔵 Smarrimento, 🟢 Rinvenimento, ⚫ Altro) with tooltips
- **Map height 450px**: Updated loading placeholder to h-[450px]
- **Nominatim Reverse Geocoding**: Auto-fill address on map click with 500ms debounce, "Modifica manualmente" link, restore button
- **Codice Fiscale and Citizen Profile fields in Step 3**: Section header "Dati identificativi — Valore legale della segnalazione", Codice Fiscale with auto-uppercase, Indirizzo/Città/Provincia (2 letters auto-uppercase)/CAP (5 digits)/Data di nascita
- **Partial validation per step**: trigger() only current step fields before allowing advancement
- **Back/Forward navigation**: "Avanti" and "Indietro" buttons with animated transitions

### 2. `/home/z/my-project/src/components/MappaSegnalaLeaflet.tsx` — Map height update
- Changed from `h-64` to `h-[450px]`

## Zod Schema
Updated to include all new fields: tipoAnimale, motivazione, codiceFiscale, indirizzoResidenza, cittaResidenza, provinciaResidenza, capResidenza, dataNascita, fotoUrl

## Verification
- ESLint: 0 errors, 2 warnings (unrelated to our changes, in HomeView.tsx)
- Dev server: Running correctly on port 3000
- Component chunk included in page output
