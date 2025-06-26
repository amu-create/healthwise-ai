#!/bin/bash
set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경변수 검증
validate_env() {
    echo_info "🔍 환경변수 검증 중..."
    
    if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "your-super-secret-django-key-here" ]; then
        echo_error "SECRET_KEY가 설정되지 않았습니다!"
        echo_warning "https://djecrety.ir/ 에서 새로운 SECRET_KEY를 생성하고 .env 파일에 설정하세요"
        exit 1
    fi
    
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-api-key-here" ]; then
        echo_warning "OPENAI_API_KEY가 설정되지 않았습니다. 챗봇 기능이 작동하지 않습니다."
        echo_info "https://platform.openai.com/api-keys 에서 API 키를 발급받으세요"
    fi
    
    echo_success "환경변수 검증 완료"
}

# 의존성 서비스 대기
wait_for_service() {
    local service_name=$1
    local host=$2
    local port=$3
    
    echo_info "⏳ $service_name 서비스 대기 중..."
    local timeout=60
    local count=0
    
    while ! nc -z $host $port; do
        if [ $count -ge $timeout ]; then
            echo_error "$service_name 서비스 연결 실패 (60초 초과)"
            exit 1
        fi
        sleep 1
        count=$((count + 1))
    done
    echo_success "$service_name 서비스 연결 완료"
}

# 디렉토리 설정
setup_directories() {
    echo_info "📁 디렉토리 설정 중..."
    
    # 필수 디렉토리 생성
    mkdir -p /app/logs && chmod 777 /app/logs
    mkdir -p /app/static
    mkdir -p /app/staticfiles
    mkdir -p /app/media
    
    echo_success "디렉토리 설정 완료"
}

# 데이터베이스 마이그레이션
run_migrations() {
    echo_info "🗄️ 데이터베이스 마이그레이션 실행 중..."
    
    # 기존 마이그레이션 캐시 정리
    find /app -path "*/migrations/*.pyc" -delete 2>/dev/null || true
    find /app -path "*/migrations/*.pyo" -delete 2>/dev/null || true
    
    # 마이그레이션 생성
    echo_info "새 마이그레이션 생성 중..."
    python manage.py makemigrations --verbosity=1 --noinput || {
        echo_warning "마이그레이션 생성 중 경고가 있었습니다"
    }
    
    # 마이그레이션 적용
    echo_info "마이그레이션 적용 중..."
    python manage.py migrate --verbosity=1 --noinput || {
        echo_error "마이그레이션 적용 실패"
        echo_info "데이터베이스를 초기화하려면 'docker-compose down -v' 실행 후 다시 시도하세요"
        exit 1
    }
    
    echo_success "데이터베이스 마이그레이션 완료"
}

# 캐시 테이블 생성
setup_cache() {
    echo_info "💾 캐시 테이블 설정 중..."
    python manage.py createcachetable 2>/dev/null || {
        echo_warning "캐시 테이블이 이미 존재하거나 생성에 실패했습니다"
    }
    echo_success "캐시 설정 완료"
}

# 정적 파일 수집
collect_static() {
    echo_info "📦 정적 파일 수집 중..."
    python manage.py collectstatic --noinput --verbosity=0 || {
        echo_warning "정적 파일 수집 중 일부 파일이 누락되었습니다"
    }
    echo_success "정적 파일 수집 완료"
}

# 슈퍼유저 생성 (개발용)
create_superuser() {
    if [ "$DEBUG" = "True" ] && [ "$ENVIRONMENT" = "development" ]; then
        echo_info "👤 개발용 슈퍼유저 확인 중..."
        python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('개발용 슈퍼유저 생성: admin/admin123')
else:
    print('슈퍼유저가 이미 존재합니다')
" 2>/dev/null || true
    fi
}

# 헬스체크
health_check() {
    echo_info "🏥 시스템 헬스체크 중..."
    
    # Django 체크
    python manage.py check --deploy 2>/dev/null || {
        echo_warning "Django 배포 체크에서 경고가 발견되었습니다"
    }
    
    echo_success "헬스체크 완료"
}

# 메인 실행 함수
main() {
    echo_info "🚀 HealthWise Backend 초기화 시작"
    echo_info "================================================"
    
    # 1. 환경변수 검증
    validate_env
    
    # 2. 의존성 서비스 대기
    wait_for_service "PostgreSQL" "${POSTGRES_HOST:-db}" "${POSTGRES_PORT:-5432}"
    wait_for_service "Redis" "${REDIS_HOST:-redis}" "6379"
    
    # 3. 디렉토리 설정
    setup_directories
    
    # 4. 데이터베이스 마이그레이션
    run_migrations
    
    # 5. 캐시 설정
    setup_cache
    
    # 6. 정적 파일 수집
    collect_static
    
    # 7. 개발용 슈퍼유저 생성
    create_superuser
    
    # 8. 헬스체크
    health_check
    
    echo_success "================================================"
    echo_success "🎉 HealthWise Backend 초기화 완료!"
    echo_info "🌐 API Server: http://localhost:8000"
    echo_info "🔧 Admin Panel: http://localhost:8000/admin"
    if [ "$DEBUG" = "True" ]; then
        echo_info "👤 개발용 계정: admin / admin123"
    fi
    echo_info "================================================"
    
    # 9. 서버 시작
    echo_info "🔥 서버 시작 중..."
    exec "$@"
}

# 에러 핸들링
trap 'echo_error "초기화 중 오류 발생. 로그를 확인하세요."; exit 1' ERR

# 메인 함수 실행
main
