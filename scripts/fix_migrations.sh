#!/bin/bash
# fix_migrations.sh - 마이그레이션 의존성 문제 해결 스크립트

echo "마이그레이션 의존성 문제 해결 시작..."

# 1. 백엔드 컨테이너 접속하여 마이그레이션 재생성
docker exec -it healthwise_backend bash -c "
    # 기존 마이그레이션 백업
    mkdir -p /tmp/migrations_backup
    cp -r apps/*/migrations /tmp/migrations_backup/

    # 마이그레이션 파일 삭제 (0001_initial.py 등)
    find apps -path '*/migrations/0*.py' -delete

    # 마이그레이션 재생성 (의존성 순서대로)
    python manage.py makemigrations core --name initial
    python manage.py makemigrations workout --name initial
    python manage.py makemigrations social --name initial
    python manage.py makemigrations achievements --name initial
    python manage.py makemigrations api --name initial

    # 마이그레이션 적용
    python manage.py migrate --fake-initial
"

echo "마이그레이션 의존성 문제 해결 완료!"
