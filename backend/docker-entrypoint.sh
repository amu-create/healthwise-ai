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
# 마이그레이션 파일 생성
python manage.py makemigrations --noinput || true
python manage.py makemigrations core --noinput || true
python manage.py makemigrations social --noinput || true
python manage.py makemigrations workout --noinput || true
python manage.py makemigrations pose_analysis --noinput || true
python manage.py makemigrations achievements --noinput || true

# 전체 마이그레이션 실행
python manage.py migrate --noinput || true

echo "Creating cache table..."
python manage.py createcachetable || true

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting server..."
exec "$@"
