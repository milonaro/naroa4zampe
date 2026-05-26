#!/bin/sh
# ── Backup automatico database a4Zampe ──────────────────────────
#
# Configurare come cronjob: 0 2 * * * /app/scripts/backup.sh
# Oppure usare il servizio backup in docker-compose.yml
#
# Il backup utilizza il comando .backup di SQLite che garantisce
# la coerenza del file anche durante scritture concorrenti.

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="/app/db/a4zampe.db"
BACKUP_DIR="/app/db/backups"
BACKUP_FILE="$BACKUP_DIR/a4zampe_$TIMESTAMP.db"
RETENTION_DAYS=30

# Crea la directory dei backup se non esiste
mkdir -p "$BACKUP_DIR"

# Verifica che il database esista
if [ ! -f "$DB_PATH" ]; then
  echo "ERRORE: Database non trovato in $DB_PATH"
  exit 1
fi

# Copia sicura con SQLite (evita corruzione durante la copia)
# Il comando .backup crea uno snapshot atomico del database
if command -v sqlite3 > /dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
else
  # Fallback: copia semplice se sqlite3 non è disponibile
  # Meno sicuro in caso di scritture concorrenti, ma accettabile
  cp "$DB_PATH" "$BACKUP_FILE"
fi

# Verifica che il backup sia stato creato
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$TIMESTAMP] Backup completato: $BACKUP_FILE ($SIZE)"
else
  echo "[$TIMESTAMP] ERRORE: Backup non creato"
  exit 1
fi

# Elimina backup più vecchi di RETENTION_DAYS giorni
DELETED=$(find "$BACKUP_DIR" -name "*.db" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$TIMESTAMP] Pulizia completata: $DELETED backup vecchi eliminati"
fi
