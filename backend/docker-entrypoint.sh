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

echo "Running migrations..."
echo "Migrating core Django apps..."
python manage.py migrate

# Custom apps migrations
echo "Migrating custom apps..."
python manage.py migrate core || true
python manage.py migrate social || true
python manage.py migrate workout || true
python manage.py migrate pose_analysis || true
python manage.py migrate achievements || true

echo "Creating cache table..."
python manage.py createcachetable

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
