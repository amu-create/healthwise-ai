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

# Django 마이그레이션
echo "Running migrations..."
python manage.py migrate --noinput

# 관리자 계정 생성 (이미 있으면 스킵)
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@healthwise.com', 'admin123')
    print('Superuser created!')
else:
    print('Superuser already exists!')
EOF

# 서버 시작
echo "Starting Django server..."
exec "$@"
