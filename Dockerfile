# Stage 0: Build frontend assets
FROM --platform=$TARGETOS/$TARGETARCH node:22-alpine AS frontend
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn run build:production

# Stage 1: Install PHP dependencies
FROM --platform=$TARGETOS/$TARGETARCH php:8.3-fpm-alpine AS backend
WORKDIR /app
RUN apk add --no-cache --update ca-certificates curl git unzip libpng-dev libxml2-dev libzip-dev icu-dev \
    && docker-php-ext-configure zip \
    && docker-php-ext-configure intl \
    && docker-php-ext-install bcmath gd pdo_mysql zip intl \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction
COPY . ./
RUN composer dump-autoload --optimize

# Stage 2: Final image
FROM --platform=$TARGETOS/$TARGETARCH php:8.3-fpm-alpine
WORKDIR /app
RUN apk add --no-cache --update ca-certificates dcron curl supervisor tar unzip nginx libpng-dev libxml2-dev libzip-dev icu-dev certbot certbot-nginx mysql-client \
    && docker-php-ext-configure zip \
    && docker-php-ext-configure intl \
    && docker-php-ext-install bcmath gd pdo_mysql zip intl

COPY . ./
COPY --from=frontend /app/public/assets ./public/assets
COPY --from=backend /app/vendor ./vendor

RUN cp .env.example .env \
    && mkdir -p bootstrap/cache/ storage/logs storage/framework/sessions storage/framework/views storage/framework/cache \
    && chmod 777 -R bootstrap storage \
    && rm -rf .env bootstrap/cache/*.php \
    && mkdir -p /app/storage/logs/ \
    && chown -R nginx:nginx .

RUN rm /usr/local/etc/php-fpm.conf \
    && echo "* * * * * /usr/local/bin/php /app/artisan schedule:run >> /dev/null 2>&1" >> /var/spool/cron/crontabs/root \
    && echo "0 23 * * * certbot renew --nginx --quiet" >> /var/spool/cron/crontabs/root \
    && sed -i s/ssl_session_cache/#ssl_session_cache/g /etc/nginx/nginx.conf \
    && mkdir -p /var/run/php /var/run/nginx

COPY .github/docker/default.conf /etc/nginx/http.d/default.conf
COPY .github/docker/www.conf /usr/local/etc/php-fpm.conf
COPY .github/docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80 443
ENTRYPOINT [ "/bin/ash", ".github/docker/entrypoint.sh" ]
CMD [ "supervisord", "-n", "-c", "/etc/supervisord.conf" ]
