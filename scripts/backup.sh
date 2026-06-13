#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/precya_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "🗄️ Fazendo backup do banco..."
docker-compose exec -T precya-postgres pg_dump \
  -U "${DB_USER:-precya_user}" \
  "${DB_NAME:-precya_prod}" > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
echo "✅ Backup salvo: ${BACKUP_FILE}.gz"

# Manter apenas os últimos 7 backups
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
