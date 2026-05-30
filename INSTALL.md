# Installazione a4Zampe

Guida completa per l'installazione e la configurazione della piattaforma a4Zampe
su un server Linux.

## Requisiti

- Hosting: Vercel (Frontend & API Serverless)
- Database: MySQL su Aruba (con accesso esterno abilitato)
- Node.js / Bun installato localmente per le migrazioni
- Account Resend.com per l'invio email

## Procedura di Installazione

### 1. Configurazione Database (Aruba)

1. Accedi al pannello MySQL di Aruba.
2. Assicurati che l'**Accesso Esterno** sia abilitato.
3. Prendi nota di: Host, Username, Password e Nome Database.

### 2. Clona e configura

```bash
# Clona il repository
git clone <url-repository> /opt/a4zampe
cd /opt/a4zampe

# Copia il file di configurazione
cp .env.example .env

# Compila le variabili d'ambiente
nano .env
```

Compila `.env` con i valori reali:

```env
DATABASE_URL=mysql://UTENTE_ARUBA:PASSWORD_ARUBA@HOST_ARUBA:3306/NOME_DB_ARUBA
RESEND_API_KEY=re_xxxxxxxxxxxx        # Ottieni da https://resend.com
EMAIL_FROM=noreply@comune-naro.it     # Dominio verificato su Resend
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx # Ottieni da https://console.anthropic.com
```

### 3. Avvia l'applicazione

```bash
# Build e avvio
docker compose up -d --build

# Esegui le migrazioni del database
docker compose exec app bunx prisma migrate deploy

# Verifica che l'app sia funzionante
curl http://localhost:3000/api/health
```

### 4. Configura il dominio (produzione)

Modifica il `Caddyfile` e decommenta la sezione con il dominio reale:

```caddyfile
comune-naro.it {
    reverse_proxy app:3000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }
}
```

Riavvia Caddy:

```bash
docker compose restart caddy
```

Caddy otterrà automaticamente il certificato HTTPS da Let's Encrypt.

### 5. Primo accesso

1. Apri il browser all'indirizzo del server
2. Completa il setup wizard (4 step: Identità, Geografia, Contatti, Credenziali)
3. L'applicazione è pronta per l'uso

## Backup del Database

Il backup automatico è configurato nel `docker-compose.yml` e viene eseguito
ogni notte alle 02:00. I backup sono conservati per 30 giorni.

### Backup manuale

```bash
docker compose exec app cp /app/db/a4zampe.db /app/db/backup-$(date +%Y%m%d).db
```

### Ripristino da backup

```bash
# 1. Ferma l'applicazione
docker compose down

# 2. Sostituisci il database con il backup
docker compose run --rm app cp /app/db/backup-YYYYMMDD.db /app/db/a4zampe.db

# 3. Riavvia
docker compose up -d
```

## Aggiornamento

```bash
cd /opt/a4zampe
git pull
docker compose up -d --build
docker compose exec app bunx prisma migrate deploy
```

## Monitoraggio

L'endpoint `/api/health` fornisce lo stato del sistema:

```bash
curl http://localhost:3000/api/health
```

Risposta attesa:

```json
{
  "status": "ok",
  "timestamp": "2026-05-26T10:00:00.000Z",
  "database": "connected",
  "setup": true,
  "comune": "Comune di Naro"
}
```

## Risoluzione Problemi

### L'app non si avvia

```bash
# Controlla i log
docker compose logs app

# Verifica che il database sia accessibile
docker compose exec app ls -la /app/db/
```

### Le email non arrivano

1. Verifica che `RESEND_API_KEY` sia configurato in `.env`
2. Verifica che il dominio del mittente sia verificato su Resend
3. Controlla i log: `docker compose logs app | grep email`

### La chat AI non risponde

1. Verifica che `ANTHROPIC_API_KEY` sia configurato in `.env`
2. Verifica che la chiave API abbia credito sufficiente
3. Controlla i log: `docker compose logs app | grep AI`
