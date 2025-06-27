@echo off
REM HealthWise AI - Windows 배포 테스트 스크립트

echo ========================================
echo   HealthWise AI Deploy Test
echo ========================================
echo.

setlocal enabledelayedexpansion

REM 테스트 카운터
set PASS=0
set FAIL=0

echo [1/4] 서비스 상태 확인...
docker-compose ps

echo.
echo [2/4] HTTP 엔드포인트 테스트...

REM Frontend 테스트
echo Testing Frontend...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3000 2>nul || echo FAIL: Connection refused

REM Backend API 테스트
echo Testing Backend API...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8000/api/ 2>nul || echo FAIL: Connection refused

REM Admin Panel 테스트
echo Testing Admin Panel...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8000/admin/ 2>nul || echo FAIL: Connection refused

echo.
echo [3/4] 데이터베이스 연결 테스트...
docker-compose exec -T backend python -c "from django.db import connection; cursor = connection.cursor(); cursor.execute('SELECT 1'); print('PostgreSQL: OK')" 2>nul || echo PostgreSQL: FAIL

echo.
echo [4/4] Redis 연결 테스트...
docker-compose exec -T backend python -c "import redis; r = redis.Redis(host='redis', port=6379, db=0); r.set('test', 'value'); print('Redis: OK' if r.get('test') == b'value' else 'Redis: FAIL')" 2>nul || echo Redis: FAIL

echo.
echo ========================================
echo 테스트 완료!
echo.
echo 문제가 있다면 다음 명령어로 로그를 확인하세요:
echo docker-compose logs -f
echo ========================================
pause
