#!/bin/sh
set -e

cd /var/www/html

# Ensure SQLite storage directory exists on the persistent disk
if [ "${DB_CONNECTION}" = "sqlite" ]; then
    DB_DIR="$(dirname "${DB_DATABASE:-/var/data/database.sqlite}")"
    mkdir -p "${DB_DIR}"
    touch "${DB_DATABASE:-/var/data/database.sqlite}"
fi

# Cache configuration (env vars are available at runtime on Render)
php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true

# Run migrations
php artisan migrate --force

# Idempotent seed (safe to re-run on every deploy)
php artisan db:seed --force || echo "Seeding skipped or already applied"

# Public storage symlink for uploaded files
php artisan storage:link --force 2>/dev/null || true

# Permissions
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Start the HTTP server
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"