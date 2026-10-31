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

echo "=== Seeding database (idempotent) ==="
php artisan db:seed --force 2>/dev/null || true

echo "=== Setting storage permissions ==="
chmod -R 775 storage bootstrap/cache

echo "=== Build complete! ==="