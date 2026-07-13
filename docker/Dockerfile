# syntax=docker/dockerfile:1

#############################################
# 1. Builder — composer + node in one stage.
#    Wayfinder's Vite plugin shells out to `php artisan wayfinder:generate`
#    during `npm run build`, so PHP (with the app's extensions loaded, e.g.
#    ext-mongodb) must be present before frontend assets are built.
#############################################
FROM php:8.4-cli AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates gnupg \
        libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libcurl4-openssl-dev libssl-dev pkg-config unzip git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql bcmath curl exif gd zip \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
COPY database/ database/
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# VITE_* values are inlined into the JS bundle at build time, not read from the
# runtime .env — so the real production Reverb WebSocket host/key must be passed
# in here as build args, matching the REVERB_APP_KEY/REVERB_* set in the server's
# runtime .env. Leave unset for local/dev builds (falls back to .env.example's
# localhost defaults, which is what the automated Dockerfile smoke tests use).
ARG VITE_APP_NAME
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

COPY . .
# storage/framework/{views,cache,sessions} are empty dirs git never tracks;
# Laravel's view/cache compilers need them to exist before artisan can boot.
RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache/data storage/app/public
RUN cp .env.example .env \
    && php artisan package:discover --ansi \
    && php artisan key:generate
RUN if [ -n "$VITE_REVERB_HOST" ]; then \
      sed -i \
        -e "s|^VITE_APP_NAME=.*|VITE_APP_NAME=\"${VITE_APP_NAME}\"|" \
        -e "s|^VITE_REVERB_APP_KEY=.*|VITE_REVERB_APP_KEY=\"${VITE_REVERB_APP_KEY}\"|" \
        -e "s|^VITE_REVERB_HOST=.*|VITE_REVERB_HOST=\"${VITE_REVERB_HOST}\"|" \
        -e "s|^VITE_REVERB_PORT=.*|VITE_REVERB_PORT=\"${VITE_REVERB_PORT}\"|" \
        -e "s|^VITE_REVERB_SCHEME=.*|VITE_REVERB_SCHEME=\"${VITE_REVERB_SCHEME}\"|" \
        .env; \
    fi
RUN npm ci
RUN npm run build
RUN rm .env

#############################################
# 2. Shared PHP runtime base (php-fpm)
#############################################
FROM php:8.4-fpm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates libcurl4-openssl-dev \
        libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libssl-dev pkg-config unzip git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql bcmath curl exif gd pcntl zip opcache \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN php -r "exit(extension_loaded('curl') ? 0 : 1);"

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/zz-uploads.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
COPY --from=builder --chown=www-data:www-data /app/vendor ./vendor
COPY --from=builder --chown=www-data:www-data /app/public/build ./public/build
RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache/data storage/app/public \
    && php artisan package:discover --ansi \
    && chown -R www-data:www-data storage bootstrap/cache

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

#############################################
# 3. app target — PHP-FPM (used by app, queue, reverb, scheduler services)
#############################################
FROM base AS app
EXPOSE 9000
CMD ["php-fpm"]

#############################################
# 4. web target — Nginx serving static files + proxying PHP to app:9000
#############################################
FROM nginx:1.27-alpine AS web
COPY --from=base /var/www/html/public /var/www/html/public
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
