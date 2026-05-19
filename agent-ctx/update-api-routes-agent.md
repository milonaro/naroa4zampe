# Task: Update API Routes for Stray Dog Reporting App

## Summary of Changes

### 1. Prisma Schema (`prisma/schema.prisma`)
- Added fields to `Segnalazione` model:
  - `consensoPrivacy` (Boolean, default false)
  - `consensoDichiarazione` (Boolean, default false)
  - `dataConsenso` (DateTime?, optional)
  - `raggioOperativo` (Float, default 0)
  - `fuoriZona` (Boolean, default false)
  - `logModifiche` (relation to LogModifica[])
- Added new `LogModifica` model with fields: `campoModificato`, `valorePrecedente`, `valoreNuovo`, `modificatoDa`, `segnalazioneId`, relation to Segnalazione
- Ran `bun run db:push` successfully

### 2. `/api/segnalazioni/route.ts`
- **POST**: Added `consensoPrivacy` (required true), `consensoDichiarazione` (required true), `dataConsenso` (optional datetime) to Zod schema
- **POST**: Added Haversine formula function to calculate distance from Naro center (37.2964, 13.7764)
- **POST**: After creating segnalazione, calculates `raggioOperativo` and `fuoriZona` fields based on 10km radius
- **GET**: Added `search` query parameter filtering by `titolo` or `descrizione` with `contains` and `mode: 'insensitive'`
- **GET**: Added `fuoriZona` query parameter filter

### 3. `/api/segnalazioni/[id]/route.ts`
- **PATCH**: Renamed schema from `aggiornaStatoSchema` to `aggiornaSegnalazioneSchema`, made `stato` optional, added `modificatoDa` optional string
- **PATCH**: When `stato` is changed, creates a `LogModifica` record tracking the change with `modificatoDa` from request body
- **GET**: Added `logModifiche` to include with `orderBy: { createdAt: 'desc' }`
- **DELETE**: Added deletion of `logModifica` records before deleting notifiche and segnalazione

### 4. `/api/segnalazioni/area-operativa/route.ts` (NEW)
- Simple GET endpoint returning `{ centro: { latitudine, longitudine }, raggioKm }` for Naro operational area config

### Lint & Dev Server
- `bun run lint` passes (0 errors, 1 pre-existing warning)
- Dev server running without errors
