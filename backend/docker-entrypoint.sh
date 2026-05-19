#!/bin/sh
set -e

# Copy env if not exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Run composer install if vendor doesn't exist (in case volume is empty)
if [ ! -d vendor ]; then
    echo "Installing composer dependencies..."
    composer install --no-interaction --prefer-dist
fi

# Generate key if not set
if ! grep -q "APP_KEY=base64" .env && [ -z "$APP_KEY" ]; then
    echo "Generating app key..."
    php artisan key:generate
fi

# Execute the main CMD
exec "$@"
