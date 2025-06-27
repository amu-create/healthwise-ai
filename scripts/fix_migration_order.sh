#!/bin/bash
# fix_migration_order.sh - 마이그레이션 순서 문제 해결

echo "=========================================="
echo "마이그레이션 의존성 문제 해결 시작"
echo "=========================================="

# 컨테이너 이름
CONTAINER_NAME="healthwise_backend"

# 백엔드 컨테이너가 실행 중인지 확인
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ 백엔드 컨테이너가 실행되지 않았습니다."
    echo "먼저 docker-compose up -d 를 실행해주세요."
    exit 1
fi

echo "1. 기존 마이그레이션 파일 백업..."
docker exec $CONTAINER_NAME bash -c "
    mkdir -p /tmp/migration_backup
    find apps -path '*/migrations/0*.py' -exec cp {} /tmp/migration_backup/ \;
"

echo "2. 마이그레이션 파일 삭제..."
docker exec $CONTAINER_NAME bash -c "
    find apps -path '*/migrations/0*.py' -delete
"

echo "3. 데이터베이스 마이그레이션 기록 삭제..."
docker exec $CONTAINER_NAME python manage.py shell -c "
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute(\"DELETE FROM django_migrations WHERE app IN ('core', 'workout', 'social', 'achievements', 'api', 'pose_analysis');\")
    print(f'삭제된 기록: {cursor.rowcount}개')
"

echo "4. 올바른 순서로 마이그레이션 생성..."
# 순서가 중요!
APPS=("core" "workout" "api" "social" "achievements" "pose_analysis")

for app in "${APPS[@]}"; do
    echo "   - $app 마이그레이션 생성 중..."
    docker exec $CONTAINER_NAME python manage.py makemigrations $app --name initial
done

echo "5. 마이그레이션 적용..."
docker exec $CONTAINER_NAME python manage.py migrate

echo ""
echo "=========================================="
echo "✅ 마이그레이션 의존성 문제 해결 완료!"
echo "=========================================="
echo ""
echo "브라우저에서 http://localhost:3000 접속하여 확인하세요."
