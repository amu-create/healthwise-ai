#!/bin/bash

# 데이터베이스가 준비될 때까지 대기
echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "Database is ready!"

# 마이그레이션 실행
echo "Running migrations..."
python manage.py migrate

# 정적 파일 수집
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 슈퍼유저가 없으면 생성
echo "Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@healthwise.com', 'admin123')
    print('Superuser created!')
else:
    print('Superuser already exists.')
"

# 개발 서버 실행
echo "Starting development server..."
exec "$@"
