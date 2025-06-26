#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 0.5
done
echo "PostgreSQL started"

echo "Waiting for Redis..."
while ! nc -z $REDIS_HOST 6379; do
  sleep 0.5
done
echo "Redis started"

# logs 디렉토리 생성 확인
mkdir -p /app/logs
chmod 777 /app/logs

# static 디렉토리 생성
mkdir -p /app/static
mkdir -p /app/staticfiles

echo "Cleaning up old migrations..."
find /app -path "*/migrations/*.pyc" -delete || true
find /app -path "*/migrations/*.pyo" -delete || true

echo "Making migrations..."
python manage.py makemigrations --noinput || true

echo "Running migrations..."
python manage.py migrate --run-syncdb --noinput || true

echo "Creating cache table..."
python manage.py createcachetable || true

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting server..."
exec "$@"
