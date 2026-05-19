# Task: Add User Management + Duplicate Detection Features

## Task ID: utenti-duplicate-features

## Summary of Changes

### 1. New API: `/api/utenti/route.ts`
- Created GET endpoint that groups reports by reporter email
- Returns user data (name, surname, email, phone) with all their reports
- Supports `search` query parameter for filtering by name/surname/email
- Sorts users by report count (descending)

### 2. New API: `/api/segnalazioni/[id]/simili/route.ts`
- Created GET endpoint for finding similar reports within 500m
- Uses Haversine formula to calculate distances
- Excludes archived reports and the current report itself
- Returns up to 5 similar reports with distance, urgency, status

### 3. Modified: `POST /api/segnalazioni/route.ts`
- Added duplicate detection after creating a report
- Searches for existing reports within 200m of the new location
- Returns `segnalazioniSimili` array in the response alongside the created report
- Similar reports include id, title, urgency, status, distance, and creation date

### 4. Modified: `DashboardView.tsx`
- Added new "Utenti" tab with `Users` icon from lucide-react
- Added `UtenteDashboard` interface for typed user data
- Added `utentiSearch`, `debouncedUtentiSearch`, `utenteEspanso` state
- Added `useQuery` for fetching utenti data from `/api/utenti`
- New TabsContent for "utenti" with:
  - Search bar for users (name/surname/email)
  - Expandable user cards showing: initials avatar, name, email, phone, report count, last report date
  - Expanded view shows: stats by urgency/status, full report list with clickable items
  - Same dark tactical theme as rest of dashboard
- Added `Users`, `Mail`, `Phone`, `ChevronDown`, `ChevronUp` icon imports

### 5. Modified: `SegnalaView.tsx`
- Added `segnalazioniSimili` state for storing similar reports
- Modified mutation `onSuccess` to check for `segnalazioniSimili` in response
- If similar reports found: shows warning toast (8s duration) + stores them in state
- If no similar reports: shows regular success toast
- Added yellow warning card below submit button when similar reports detected
- Warning card shows each similar report with title, distance (in meters), and date
- Added `AlertTriangle` icon import

### 6. Modified: `DettaglioSegnalazione.tsx`
- Added `SegnalazioneSimile` interface
- Added `similiEspanso` state for collapsible section
- Added `useQuery` for fetching similar reports from `/api/segnalazioni/[id]/simili`
- Added collapsible "Segnalazioni simili nelle vicinanze" section
- Shows count badge, expandable list with report details
- Clicking a similar report opens its detail dialog
- Added `Radar`, `ChevronDown`, `ChevronUp` icon imports
- Added `useState` import

## All API endpoints tested and working:
- GET `/api/utenti` - returns grouped users with search support
- GET `/api/utenti?search=marco` - filtered search working
- GET `/api/segnalazioni/[id]/simili` - returns nearby reports with distances
