#!/usr/bin/env bash
# Render build script for Laravel backend
set -o errexit

echo "=== Installing PHP dependencies ==="
composer install --no-dev --optimize-autoloader

echo "=== Linking storage for public file access ==="
php artisan storage:link --force 2>/dev/null || true

echo "=== Caching Laravel config, routes & views ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=== Skipping build-time migrations (database may be ephemeral during build) ==="
# Migrations and seeding run at container startup (docker-entrypoint.sh)
# so they operate on the persistent database volume, not the build image.

echo "=== Setting storage permissions ==="
chmod -R 775 storage bootstrap/cache

echo "=== Build complete! ==="