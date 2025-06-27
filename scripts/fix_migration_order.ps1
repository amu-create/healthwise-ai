# fix_migration_order.ps1 - 마이그레이션 의존성 문제 해결 (Windows)

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "마이그레이션 의존성 문제 해결 시작" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

$containerName = "healthwise_backend"

# 백엔드 컨테이너 확인
$container = docker ps --format "{{.Names}}" | Select-String $containerName
if (-not $container) {
    Write-Host "❌ 백엔드 컨테이너가 실행되지 않았습니다." -ForegroundColor Red
    Write-Host "먼저 docker-compose up -d 를 실행해주세요." -ForegroundColor Red
    exit 1
}

Write-Host "1. 기존 마이그레이션 파일 백업..." -ForegroundColor Cyan
docker exec $containerName bash -c "mkdir -p /tmp/migration_backup && find apps -path '*/migrations/0*.py' -exec cp {} /tmp/migration_backup/ \;"

Write-Host "2. 마이그레이션 파일 삭제..." -ForegroundColor Cyan
docker exec $containerName bash -c "find apps -path '*/migrations/0*.py' -delete"

Write-Host "3. 데이터베이스 마이그레이션 기록 삭제..." -ForegroundColor Cyan
$deleteCmd = @"
from django.db import connection
with connection.cursor() as cursor:
    try:
        cursor.execute('DELETE FROM django_migrations WHERE app IN (\'core\', \'workout\', \'social\', \'achievements\', \'api\', \'pose_analysis\');')
        print(f'삭제된 기록: {cursor.rowcount}개')
    except Exception as e:
        print(f'테이블이 없거나 오류 발생: {e}')
"@
docker exec $containerName python manage.py shell -c $deleteCmd

Write-Host "4. 올바른 순서로 마이그레이션 생성..." -ForegroundColor Cyan
$apps = @("core", "workout", "api", "social", "achievements", "pose_analysis")

foreach ($app in $apps) {
    Write-Host "   - $app 마이그레이션 생성 중..." -ForegroundColor White
    docker exec $containerName python manage.py makemigrations $app --name initial
}

Write-Host "5. 마이그레이션 적용..." -ForegroundColor Cyan
docker exec $containerName python manage.py migrate

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ 마이그레이션 의존성 문제 해결 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "브라우저에서 http://localhost:3000 접속하여 확인하세요." -ForegroundColor Cyan
