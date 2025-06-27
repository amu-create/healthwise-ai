# fix_migrations.ps1 - 마이그레이션 의존성 문제 해결 스크립트

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "HealthWise AI 마이그레이션 문제 해결" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# 1. 현재 상태 확인
Write-Host "[1] 현재 컨테이너 상태 확인..." -ForegroundColor Cyan
docker ps -a --format "table {{.Names}}\t{{.Status}}"

# 2. 데이터베이스 초기화
Write-Host ""
Write-Host "[2] 데이터베이스 초기화 중..." -ForegroundColor Cyan
Write-Host "경고: 모든 데이터가 삭제됩니다!" -ForegroundColor Red
$confirm = Read-Host "계속하시겠습니까? (y/n)"

if ($confirm -eq 'y') {
    # 컨테이너와 볼륨 삭제
    docker-compose -f docker-compose.dev.yml down -v
    
    # 이미지 재빌드
    Write-Host ""
    Write-Host "[3] Docker 이미지 재빌드 중..." -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    # 컨테이너 시작
    Write-Host ""
    Write-Host "[4] 컨테이너 시작 중..." -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml up -d
    
    # 잠시 대기
    Write-Host "서비스 초기화 대기 중 (30초)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # 상태 확인
    Write-Host ""
    Write-Host "[5] 서비스 상태 확인..." -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # 로그 확인
    Write-Host ""
    Write-Host "[6] 백엔드 로그 (최근 20줄):" -ForegroundColor Cyan
    docker logs healthwise_backend --tail 20
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "완료! 브라우저에서 확인하세요:" -ForegroundColor Green
    Write-Host "http://localhost:3000" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
else {
    Write-Host "취소되었습니다." -ForegroundColor Yellow
}