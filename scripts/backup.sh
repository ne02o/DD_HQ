#!/usr/bin/env bash
# Nightly copy of the HQ database. Safe while the app is running (uses SQLite's online backup).
# Keeps 30 days. Run from cron:  15 3 * * *  /var/www/dd-hq/scripts/backup.sh
set -euo pipefail
DB="${DATABASE_PATH:-/var/lib/dd-hq/hq.db}"
DEST="${BACKUP_DIR:-/var/backups/dd-hq}"
mkdir -p "$DEST"
STAMP="$(date +%F)"
sqlite3 "$DB" ".backup '$DEST/hq-$STAMP.db'"
sqlite3 "$DEST/hq-$STAMP.db" "PRAGMA integrity_check;" | grep -qx ok
gzip -f "$DEST/hq-$STAMP.db"
find "$DEST" -name 'hq-*.db.gz' -mtime +30 -delete
