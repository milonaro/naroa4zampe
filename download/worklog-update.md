---
Task ID: revisione-naro-4-zampe
Agent: main
Task: Revisione completa dell'applicazione "Naro a 4 Zampe"

Work Log:
- Rinominato "Dettagli del Cane" → "Dettagli Segnalazione" in tutti i componenti
- Cambiato "cane/cani" → "animale/animali" in 11 file
- Cambiato stile mappa da dark a chiaro (CartoDB Voyager)
- Ristrutturato SegnalaView con step numerati (1-4)
- Aggiunto PDF download + Condivisione nel DettaglioSegnalazione
- Creata API /api/utenti con tab Utenti nel Dashboard
- Aggiunta detection duplicati (200m POST, 500m simili API)
- Warning toast per segnalazioni simili
- Sezione "Segnalazioni simili" nel dettaglio

Stage Summary:
- Build passa, tutte le API funzionanti
- App completamente generica per animali (non solo cani)
- Mappa tema chiaro CartoDB Voyager
- PDF + Share + Utenti + Duplicati implementati
