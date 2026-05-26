# Task: Fix 85 TypeScript Errors in a4Zampe Project

## Summary

All 85 TypeScript errors have been resolved. The build now compiles successfully with zero errors.

## Changes Made

### Step 1: Read Prisma Schema
- Confirmed models: `Comune`, `Utente`, `Segnalazione`, `Notifica`, `TokenAccesso`, `LogModifica`
- Confirmed `accountAdmin` and `adminUtente` do NOT exist in the schema

### Step 2: Fix Zod v4 Breaking Changes (.errors → .issues)
Fixed 9 files where `errore.errors` was used (Zod v3 pattern) → changed to `errore.issues` (Zod v4):

1. `src/app/api/notifiche/route.ts` - line 75
2. `src/app/api/token-accesso/route.ts` - line 142
3. `src/app/api/cittadino/route.ts` - line 27 (`result.error.errors` → `result.error.issues`) and line 123
4. `src/app/api/segnalazioni/route.ts` - line 196
5. `src/app/api/segnalazioni/[id]/route.ts` - line 119
6. `src/app/api/comune/route.ts` - lines 113, 174 (replaced all)
7. `src/app/api/admin/route.ts` - line 102
8. `src/app/api/admin/[id]/route.ts` - line 72
9. `src/app/api/chat-ai/route.ts` - line 97

### Step 3: Fix Prisma Model References
Rewrote 6 API route files that referenced non-existent `adminUtente` and `accountAdmin` models. All now use `Comune.credenziali` JSON field:

1. **`src/app/api/admin/route.ts`** - Complete rewrite: GET reads credenziali from Comune, POST adds new credential to the JSON array with bcrypt-hashed password
2. **`src/app/api/admin/[id]/route.ts`** - Complete rewrite: PATCH updates credential by index, DELETE removes credential from array
3. **`src/app/api/admin-accounts/route.ts`** - Complete rewrite: CRUD operations via Comune.credenziali
4. **`src/app/api/admin-accounts/profile/route.ts`** - Complete rewrite: PATCH updates nome via Comune.credenziali
5. **`src/app/api/admin-accounts/change-password/route.ts`** - Complete rewrite: POST verifies old password with bcrypt, updates with new hash
6. **`src/app/api/admin-accounts/settings/route.ts`** - Complete rewrite: Settings stored client-side (localStorage) since Comune model lacks these fields

### Step 4: Fix PrismaClient Type Mismatch in getComuneConfig
- `src/lib/tenant.ts`: Changed parameter type from custom narrow interface to `PrismaClient` from `@prisma/client`
- Added `import type { PrismaClient } from '@prisma/client'` at top of file
- Removed the now-unnecessary `ConfigComuneFromDB` interface usage (though kept it for documentation)

### Step 5: Fix StoreApplicazione Missing Properties
Added to `src/lib/store.ts`:

**New Types:**
- `Tema` = 'chiaro' | 'scuro' | 'alto-contrasto'
- `DimensioneTesto` = 'normale' | 'grande' | 'molto-grande' | 'extra-grande'
- `Privilegio` = union of RBAC privilege strings

**New Constants:**
- `PRIVILEGI_DISPONIBILI` - array of all privileges
- `ETICHETTE_PRIVILEGI` - Record mapping privilege → Italian label

**New Store Properties:**
- `adminEmail`, `adminTelefono`, `adminFoto` - admin profile fields
- `profiloAdminAperto` + `impostaProfiloAdmin` - profile dialog state
- `tema` + `impostaTema` - accessibility theme
- `dimensioneTesto` + `impostaDimensioneTesto` - text size
- `riduzioneAnimazioni` + `impostaRiduzioneAnimazioni` - reduce motion
- `toolbarAccessibilitaAperta` + `impostaToolbarAccessibilita` - toolbar visibility
- `isSuperAdmin()` - method checking if current admin is super admin

**Updated:**
- `loginAdmin` signature expanded to accept email, telefono, foto params
- `logoutAdmin` now clears adminEmail, adminTelefono, adminFoto

**Component Fixes:**
- `AccessibilityToolbar.tsx` - mapped `temaCorrente` → `tema`, `riduzioneMovimento` → `riduzioneAnimazioni`

### Additional Fixes (discovered during build)

**`src/components/DashboardView.tsx`:**
- Fixed `NARO_LAT`, `NARO_LNG`, `RAGGIO_OPERATIVO_KM` undefined references → replaced with `configComune.latCentro`, `configComune.lngCentro`, `configComune.raggioKm` via store
- Fixed `configComune` undefined in InserimentoManualeForm → added `useStore` hook
- Fixed `datiNotifiche?.nonLette > 0` → `(datiNotifiche?.nonLette ?? 0) > 0`
- Fixed `segnaNotificheLette.mutate()` → `segnaNotificheLette.mutate(undefined)`

**`src/components/Header.tsx`:**
- Fixed `statistiche?.notificheNonLette > 0` → `(statistiche?.notificheNonLette ?? 0) > 0`

**`src/components/HeroSlider.tsx`:**
- Fixed Framer Motion transition type: `type: 'spring'` → `type: 'spring' as const`

**`src/components/MappaView.tsx`:**
- Removed `NARO_LAT`, `NARO_LNG` imports from constants (they don't exist)

**`src/components/SegnalaView.tsx`:**
- Fixed Zod v4 schema: `required_error` → `message` for `z.number()`
- Fixed Zod v4 schema: `errorMap` → `message` for `z.literal(true, ...)`
- Added `as any` cast for zodResolver to handle type mismatch between Zod v4 and @hookform/resolvers

## Build Result
- `tsc --noEmit`: 0 errors ✅
- `bun run build`: Success ✅
