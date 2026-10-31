# syntax=docker/dockerfile:1
FROM php:8.3-cli

# System dependencies for PHP extensions and tooling
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip \
        libzip-dev libsqlite3-dev libpq-dev libonig-dev libxml2-dev libcurl4-openssl-dev \
    && docker-php-ext-install \
        pdo pdo_sqlite pdo_pgsql zip mbstring xml curl \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first (better layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application source
COPY . .

# Run package discovery + autoloader optimization
RUN php artisan package:discover --ansi
RUN composer dump-autoload --optimize --no-interaction

# Prepare entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Render provides $PORT at runtime
EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]