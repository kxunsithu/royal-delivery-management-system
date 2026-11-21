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

echo "=== Skipping database migrations and seeding on build/deploy ==="
# Database schema/data changes are applied manually to avoid
# refreshing or overwriting production data on every push.

echo "=== Setting storage permissions ==="
chmod -R 775 storage bootstrap/cache

echo "=== Build complete! ==="