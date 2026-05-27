#!/bin/sh
set -e

# Install dependencies if not present
if [ ! -d "vendor" ]; then
    echo "Installing dependencies..."
    composer install --no-interaction --optimize-autoloader --no-dev
fi

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Set permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Start queue worker in background
echo "Starting queue worker..."
php artisan queue:work --sleep=3 --tries=3 --max-jobs=100 &

# Start reverb server in background
echo "Starting Reverb server..."
php artisan reverb:start --host=0.0.0.0 --port=8080 &

# Start main application
echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
