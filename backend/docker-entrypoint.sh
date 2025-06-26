#!/bin/sh
set -e

# PostgreSQL이 준비될 때까지 대기
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Redis가 준비될 때까지 대기
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "Redis started"

# Django 마이그레이션 - 순서 보장
echo "Running migrations..."

# 1. 기본 Django 앱 마이그레이션
echo "Migrating core Django apps..."
python manage.py migrate contenttypes --noinput
python manage.py migrate auth --noinput
python manage.py migrate sessions --noinput
python manage.py migrate admin --noinput

# 2. Core 앱 마이그레이션 (User 모델)
echo "Migrating core app..."
python manage.py migrate core --noinput

# 3. Workout 앱 마이그레이션 (WorkoutResult 모델)
echo "Migrating workout app..."
python manage.py migrate workout --noinput

# 4. 나머지 앱 마이그레이션
echo "Migrating remaining apps..."
python manage.py migrate --noinput

# Static 파일 디렉토리 생성
echo "Creating static directories..."
mkdir -p /app/static
mkdir -p /app/frontend/build
mkdir -p /app/frontend/build/static
mkdir -p /app/media

# Static 파일 수집 (존재하는 파일만)
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || true

# 캐시 테이블 생성
echo "Creating cache table..."
python manage.py createcachetable || true

# 관리자 계정 생성 (이미 있으면 스킵)
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@healthwise.com', 'admin123')
    print('Superuser created! (username: admin, password: admin123)')
else:
    print('Superuser already exists!')
EOF

# 서버 시작
echo "Starting Django server..."
exec "$@"
