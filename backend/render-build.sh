#!/usr/bin/env bash
# Render build script for Laravel backend
set -o errexit

echo "=== Installing PHP dependencies ==="
composer install --no-dev --optimize-autoloader

echo "=== Preparing persistent storage (SQLite) ==="
mkdir -p /var/data
touch /var/data/database.sqlite
chmod -R 775 /var/data

echo "=== Linking storage for public file access ==="
php artisan storage:link --force 2>/dev/null || true

echo "=== Caching Laravel config, routes & views ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=== Running database migrations ==="
php artisan migrate --force

echo "=== Seeding database only on first deploy ==="
USER_COUNT=$(php artisan tinker --execute='echo \App\Models\User::count();' 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
    php artisan db:seed --force || echo "Seeding skipped or already applied"
fi

echo "=== Setting storage permissions ==="
chmod -R 775 storage bootstrap/cache

echo "=== Build complete! ==="