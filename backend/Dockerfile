FROM php:8.4-fpm-alpine

# Install PHP extensions using mlocati/php-extension-installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql pgsql zip bcmath gd opcache pcntl

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock* ./
RUN composer install --no-interaction --no-plugins --no-scripts --prefer-dist --no-autoloader || true
COPY . .

# Install nginx and supervisor and configure them
RUN apk add --no-cache nginx supervisor
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf
COPY www.conf /usr/local/etc/php-fpm.d/www.conf

# Complete composer setup
RUN composer dump-autoload --optimize

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["web"]
