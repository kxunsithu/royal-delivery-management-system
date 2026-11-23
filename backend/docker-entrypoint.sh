#!/bin/sh
set -e

cd /var/www/html

# SQLite fallback for local Docker only (production uses PostgreSQL)
if [ "${DB_CONNECTION}" = "sqlite" ]; then
    DB_DIR="$(dirname "${DB_DATABASE:-/var/data/database.sqlite}")"
    mkdir -p "${DB_DIR}"
    touch "${DB_DATABASE:-/var/data/database.sqlite}"
fi

# Cache configuration (env vars are available at runtime on Railway)
php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true

# Run migrations (only pending ones; safe to re-run on every deploy)
php artisan migrate --force

# Seed only on first deploy, when the database has no users yet
USER_COUNT=$(php artisan tinker --execute='echo \App\Models\User::count();' 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
    php artisan db:seed --force || echo "Seeding skipped or already applied"
fi

# Always make sure the default admin account exists (idempotent)
php artisan db:seed --class=AdminSeeder --force || echo "Admin seeding skipped or already applied"

# Public storage symlink for uploaded files
php artisan storage:link --force 2>/dev/null || true

# Permissions
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Start the HTTP server
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"