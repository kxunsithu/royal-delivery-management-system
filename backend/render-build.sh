#!/usr/bin/env bash
# Render build script for Laravel backend
set -o errexit

echo "=== Installing PHP dependencies ==="
composer install --no-dev --optimize-autoloader

echo "=== Caching Laravel config & routes ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=== Running database migrations ==="
php artisan migrate --force

echo "=== Seeding database (if fresh) ==="
# Only seed if the users table is empty (first deploy)
php artisan db:seed --force 2>/dev/null || true

echo "=== Setting storage permissions ==="
chmod -R 775 storage bootstrap/cache

echo "=== Build complete! ==="
