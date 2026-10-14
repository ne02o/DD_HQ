# Deploying Digital Dive HQ

Server: Spaceship VPS 209.74.81.212, Ubuntu 24.04, SSH `ssh -p 22022 root@209.74.81.212`.
Runs next to the website (dd-web on port 3001). HQ uses port 3010.

| What | Where |
|---|---|
| Code | `/var/www/dd-hq` (git clone of `ne02o/DD_HQ`) |
| Database | `/var/lib/dd-hq/hq.db` (outside the repo, never in git) |
| Backups | `/var/backups/dd-hq/hq-YYYY-MM-DD.db.gz`, nightly at 03:15, kept 30 days |
| Process | PM2 `dd-hq` |
| Web | Nginx `/etc/nginx/sites-available/dd-hq` → 127.0.0.1:3010, Cloudflare proxied A record `hq` |

## First install

```bash
apt install -y sqlite3
mkdir -p /var/lib/dd-hq /var/backups/dd-hq
git clone https://<TOKEN>@github.com/ne02o/DD_HQ.git /var/www/dd-hq
cd /var/www/dd-hq
echo 'DATABASE_PATH=/var/lib/dd-hq/hq.db' > .env
npm ci --include=dev
npm run build
pm2 start npm --name dd-hq -- start
pm2 save
npm run user -- add <email> "<name>"     # once per partner; asks for a password
(crontab -l 2>/dev/null; echo '15 3 * * * DATABASE_PATH=/var/lib/dd-hq/hq.db /var/www/dd-hq/scripts/backup.sh') | crontab -
```

Never run `npm run seed` on the server (it refuses in production, and the real database must start
empty so invoices continue at #010).

## Updating

```bash
cd /var/www/dd-hq && git pull && npm ci --include=dev && npm run build && pm2 reload dd-hq
```

Database changes (migrations) apply automatically when the app starts.

## Restoring a backup

```bash
pm2 stop dd-hq
gunzip -c /var/backups/dd-hq/hq-2026-10-14.db.gz > /var/lib/dd-hq/hq.db
rm -f /var/lib/dd-hq/hq.db-wal /var/lib/dd-hq/hq.db-shm
pm2 start dd-hq
```
