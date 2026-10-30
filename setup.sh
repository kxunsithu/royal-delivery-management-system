#!/bin/bash
set -e

# ============================================================
#  Royal's Myawaddy Delivery Management System — Setup Script
#  Local dev uses SQLite (zero config).
#  Switch to PostgreSQL for production by editing .env.
# ============================================================
#
#  Run from the project root:
#    bash setup.sh
#
#  Prerequisites:
#    - PHP 8.2+  (with pdo_sqlite extension)
#    - Composer
#    - Node 18+  (with npm)
# ============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Royal's Myawaddy Delivery — Setup (SQLite)         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── BACKEND ────────────────────────────────────────────────

echo "▶ [1/6] Installing PHP dependencies..."
cd "$BACKEND"
composer install --no-interaction --prefer-dist

echo ""
echo "▶ [2/6] Creating SQLite database file..."
touch "$BACKEND/database/database.sqlite"
echo "  Created: database/database.sqlite"

echo ""
echo "▶ [3/6] Generating Laravel app key..."
if grep -q "^APP_KEY=base64:" "$BACKEND/.env" 2>/dev/null; then
    echo "  App key already set, skipping."
else
    php artisan key:generate --ansi
fi

echo ""
echo "▶ [4/7] Publishing spatie/laravel-permission migrations..."
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider" --force --ansi 2>/dev/null || true

# Patch spatie's published migration to include display_name on the roles table
SPATIE_MIGRATION=$(ls "$BACKEND"/database/migrations/*create_permission_tables* 2>/dev/null | tail -1)
if [ -n "$SPATIE_MIGRATION" ]; then
    php -r "
        \$f = file_get_contents('$SPATIE_MIGRATION');
        if (strpos(\$f, 'display_name') === false) {
            \$f = str_replace(
                \"\\\$table->string('guard_name'); // For MyISAM\",
                \"\\\$table->string('guard_name'); // For MyISAM\\n            \\\$table->string('display_name', 100)->nullable();\",
                \$f
            );
            file_put_contents('$SPATIE_MIGRATION', \$f);
            echo \"  Patched: display_name added to roles table.\\n\";
        } else {
            echo \"  display_name already present, skipping patch.\\n\";
        }
    "
fi

echo ""
echo "▶ [5/7] Running database migrations..."
php artisan migrate --force --ansi

echo ""
echo "▶ [6/7] Seeding database with initial data..."
php artisan db:seed --force --ansi

echo ""
echo "▶ [7/8] Linking storage for public file access..."
php artisan storage:link --force --ansi 2>/dev/null || true

echo ""
echo "▶ [7/7] Installing Node.js dependencies..."
cd "$FRONTEND"
npm install

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅  Setup complete!                                 ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║   Start dev servers:                                 ║"
echo "║     bash dev.sh                                      ║"
echo "║                                                      ║"
echo "║   Or separately:                                     ║"
echo "║     cd backend  && php artisan serve                 ║"
echo "║     cd frontend && npm run dev                       ║"
echo "║                                                      ║"
echo "║   Open: http://localhost:5173                        ║"
echo "║                                                      ║"
echo "║   Login credentials:                                 ║"
echo "║   admin@royal-myawaddy.local  /  Admin@123456        ║"
echo "║   manager@royal-myawaddy.local / Manager@123456      ║"
echo "║   staff1@royal-myawaddy.local  / Staff@123456        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
