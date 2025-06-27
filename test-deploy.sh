#!/bin/bash
# HealthWise AI - 배포 테스트 스크립트

echo "🧪 HealthWise AI 배포 테스트를 시작합니다..."

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 테스트 결과 카운터
PASS=0
FAIL=0

# 테스트 함수
test_service() {
    local service_name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $service_name... "
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response_code)"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_code, Got: $response_code)"
        ((FAIL++))
    fi
}

# 서비스 상태 확인
echo "📊 서비스 상태 확인..."
docker-compose ps

echo ""
echo "🌐 HTTP 엔드포인트 테스트..."

# Frontend 테스트
test_service "Frontend" "http://localhost:${FRONTEND_PORT:-3000}" "200"

# Backend API 테스트
test_service "Backend API" "http://localhost:${BACKEND_PORT:-8000}/api/" "200"
test_service "Admin Panel" "http://localhost:${BACKEND_PORT:-8000}/admin/" "200"

# Health Check 엔드포인트
test_service "Health Check" "http://localhost:${BACKEND_PORT:-8000}/health/" "200"

echo ""
echo "🗄️ 데이터베이스 연결 테스트..."
docker-compose exec -T backend python -c "
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('SELECT 1')
    print('✅ PostgreSQL 연결 성공')
" 2>/dev/null || echo -e "${RED}❌ PostgreSQL 연결 실패${NC}"

echo ""
echo "💾 Redis 연결 테스트..."
docker-compose exec -T backend python -c "
import redis
r = redis.Redis(host='redis', port=6379, db=0)
r.set('test', 'value')
if r.get('test') == b'value':
    print('✅ Redis 연결 성공')
else:
    print('❌ Redis 연결 실패')
" 2>/dev/null || echo -e "${RED}❌ Redis 연결 실패${NC}"

echo ""
echo "📊 테스트 결과:"
echo -e "   성공: ${GREEN}$PASS${NC}"
echo -e "   실패: ${RED}$FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 테스트를 통과했습니다!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  일부 테스트가 실패했습니다.${NC}"
    echo "docker-compose logs를 확인하세요."
    exit 1
fi
