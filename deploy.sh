#!/bin/bash
# HealthWise AI - 원클릭 도커 배포 스크립트
# Git Clone 후 단 하나의 명령으로 완전 배포

set -e  # 에러 발생시 중지

echo "🏥 HealthWise AI 도커 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 환경 확인
echo -e "${BLUE}🔍 환경을 확인합니다...${NC}"

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다!${NC}"
    exit 1
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose가 설치되어 있지 않습니다!${NC}"
    exit 1
fi

# 2. 필요한 디렉토리 생성
echo -e "${YELLOW}📁 필요한 디렉토리를 생성합니다...${NC}"
mkdir -p backend/logs
mkdir -p backend/media
mkdir -p backend/staticfiles
mkdir -p frontend/build

# 3. Production Dockerfile 생성 (없는 경우)
echo -e "${YELLOW}🐳 Production Dockerfile을 확인/생성합니다...${NC}"

# Backend Dockerfile.prod
if [ ! -f backend/Dockerfile.prod ]; then
    cat > backend/Dockerfile.prod << 'EOF'
FROM python:3.11-slim

# 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    netcat-openbsd \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requirements 복사 및 설치
COPY requirements*.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn

# 앱 코드 복사
COPY . .

# entrypoint 스크립트 실행 가능하게 설정
RUN if [ -f docker-entrypoint.sh ]; then \
        dos2unix docker-entrypoint.sh && \
        chmod +x docker-entrypoint.sh; \
    fi

# 정적 파일 디렉토리 생성
RUN mkdir -p /app/staticfiles /app/media

# 포트 노출
EXPOSE 8000

# 환경변수 설정
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 실행
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn healthwise.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
EOF
    echo -e "${GREEN}✅ Backend Dockerfile.prod 생성됨${NC}"
fi

# Frontend Dockerfile.prod
if [ ! -f frontend/Dockerfile.prod ]; then
    cat > frontend/Dockerfile.prod << 'EOF'
FROM node:20-alpine as builder

WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# 소스 코드 복사 및 빌드
COPY . .

# 빌드 시 환경변수 주입
ARG REACT_APP_API_URL=http://localhost:8000/api
ARG REACT_APP_WS_URL=ws://localhost:8000/ws
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

RUN npm run build

# Nginx 스테이지
FROM nginx:alpine

# Nginx 설정
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx 설정 파일
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    location /ws { \
        proxy_pass http://backend:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    echo -e "${GREEN}✅ Frontend Dockerfile.prod 생성됨${NC}"
fi

# 4. docker-compose.yml 생성 (배포용)
echo -e "${YELLOW}📝 docker-compose.yml을 생성합니다...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL 데이터베이스
  db:
    image: postgres:14-alpine
    container_name: healthwise_db
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-healthwise}
      POSTGRES_USER: ${POSTGRES_USER:-healthwise}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-healthwise123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-healthwise}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - healthwise-network

  # Redis 캐시
  redis:
    image: redis:6-alpine
    container_name: healthwise_redis
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - healthwise-network

  # Django 백엔드
  backend:
    build:
      context: ./backend
      dockerfile: ${DOCKERFILE_BACKEND:-Dockerfile.prod}
    container_name: healthwise_backend
    volumes:
      - media_volume:/app/media
      - static_volume:/app/staticfiles
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      # Django 기본 설정
      - DEBUG=${DEBUG:-False}
      - SECRET_KEY=${SECRET_KEY:-django-insecure-change-this-in-production}
      - DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-healthwise.settings_docker}
      
      # 데이터베이스
      - DATABASE_URL=postgresql://${POSTGRES_USER:-healthwise}:${POSTGRES_PASSWORD:-healthwise123}@db:5432/${POSTGRES_DB:-healthwise}
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      
      # Redis
      - REDIS_URL=redis://redis:6379/1
      - REDIS_HOST=redis
      
      # 보안 설정
      - ALLOWED_HOSTS=${ALLOWED_HOSTS:-*}
      - CORS_ALLOW_ALL_ORIGINS=${CORS_ALLOW_ALL_ORIGINS:-True}
      - CSRF_TRUSTED_ORIGINS=${CSRF_TRUSTED_ORIGINS:-http://localhost}
      
      # Firebase (환경변수로 제공)
      - FIREBASE_CREDENTIALS=${FIREBASE_CREDENTIALS:-}
      
      # OpenAI (선택사항)
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
    restart: unless-stopped
    networks:
      - healthwise-network

  # React 프론트엔드
  frontend:
    build:
      context: ./frontend
      dockerfile: ${DOCKERFILE_FRONTEND:-Dockerfile.prod}
      args:
        - REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:8000/api}
        - REACT_APP_WS_URL=${REACT_APP_WS_URL:-ws://localhost:8000/ws}
    container_name: healthwise_frontend
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - healthwise-network

volumes:
  postgres_data:
  redis_data:
  media_volume:
  static_volume:

networks:
  healthwise-network:
    driver: bridge
EOF

# 5. 기존 컨테이너 정리
echo -e "${YELLOW}🧹 기존 컨테이너를 정리합니다...${NC}"
docker-compose down 2>/dev/null || true

# 6. 도커 이미지 빌드 및 실행
echo -e "${BLUE}🔨 도커 이미지를 빌드합니다...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}🚀 서비스를 시작합니다...${NC}"
docker-compose up -d

# 7. 헬스체크
echo -e "${YELLOW}⏳ 서비스가 시작되기를 기다립니다...${NC}"
sleep 10

# 서비스 상태 확인
echo -e "${BLUE}📊 서비스 상태:${NC}"
docker-compose ps

# 8. 접속 정보 출력
echo -e "${GREEN}✅ HealthWise AI가 성공적으로 배포되었습니다!${NC}"
echo -e "${BLUE}📱 접속 정보:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:${FRONTEND_PORT:-3000}${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:${BACKEND_PORT:-8000}/api${NC}"
echo -e "   Admin: ${GREEN}http://localhost:${BACKEND_PORT:-8000}/admin${NC}"
echo ""
echo -e "${YELLOW}💡 팁:${NC}"
echo -e "   - 로그 확인: docker-compose logs -f"
echo -e "   - 서비스 중지: docker-compose down"
echo -e "   - 서비스 재시작: docker-compose restart"
echo -e "   - 관리자 계정 생성: docker-compose exec backend python manage.py createsuperuser"
EOF