@echo off
REM HealthWise AI - Windows 원클릭 도커 배포 스크립트
REM Git Clone 후 단 하나의 명령으로 완전 배포

echo ========================================
echo   HealthWise AI Docker Deploy Script
echo ========================================
echo.

REM UTF-8 설정
chcp 65001 > nul

REM Docker 확인
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker가 설치되어 있지 않습니다!
    echo Docker Desktop을 먼저 설치해주세요.
    pause
    exit /b 1
)

REM Docker Compose 확인
docker-compose --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose가 설치되어 있지 않습니다!
    pause
    exit /b 1
)

echo [1/7] 필요한 디렉토리를 생성합니다...
if not exist backend\logs mkdir backend\logs
if not exist backend\media mkdir backend\media
if not exist backend\staticfiles mkdir backend\staticfiles
if not exist frontend\build mkdir frontend\build

echo [2/7] Production Dockerfile을 확인/생성합니다...

REM Backend Dockerfile.prod
if not exist backend\Dockerfile.prod (
    echo FROM python:3.11-slim > backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # 필수 패키지 설치 >> backend\Dockerfile.prod
    echo RUN apt-get update ^&^& apt-get install -y \ >> backend\Dockerfile.prod
    echo     libpq-dev \ >> backend\Dockerfile.prod
    echo     gcc \ >> backend\Dockerfile.prod
    echo     netcat-openbsd \ >> backend\Dockerfile.prod
    echo     dos2unix \ >> backend\Dockerfile.prod
    echo     ^&^& rm -rf /var/lib/apt/lists/* >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo WORKDIR /app >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # requirements 복사 및 설치 >> backend\Dockerfile.prod
    echo COPY requirements*.txt ./ >> backend\Dockerfile.prod
    echo RUN pip install --upgrade pip ^&^& \ >> backend\Dockerfile.prod
    echo     pip install --no-cache-dir -r requirements.txt ^&^& \ >> backend\Dockerfile.prod
    echo     pip install gunicorn >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # 앱 코드 복사 >> backend\Dockerfile.prod
    echo COPY . . >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # entrypoint 스크립트 실행 가능하게 설정 >> backend\Dockerfile.prod
    echo RUN if [ -f docker-entrypoint.sh ]; then \ >> backend\Dockerfile.prod
    echo         dos2unix docker-entrypoint.sh ^&^& \ >> backend\Dockerfile.prod
    echo         chmod +x docker-entrypoint.sh; \ >> backend\Dockerfile.prod
    echo     fi >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # 정적 파일 디렉토리 생성 >> backend\Dockerfile.prod
    echo RUN mkdir -p /app/staticfiles /app/media >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # 포트 노출 >> backend\Dockerfile.prod
    echo EXPOSE 8000 >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # 환경변수 설정 >> backend\Dockerfile.prod
    echo ENV PYTHONUNBUFFERED=1 \ >> backend\Dockerfile.prod
    echo     PYTHONDONTWRITEBYTECODE=1 >> backend\Dockerfile.prod
    echo. >> backend\Dockerfile.prod
    echo # 실행 >> backend\Dockerfile.prod
    echo CMD ["sh", "-c", "python manage.py collectstatic --noinput ^&^& python manage.py migrate --noinput ^&^& gunicorn healthwise.wsgi:application --bind 0.0.0.0:8000 --workers 3"] >> backend\Dockerfile.prod
    echo Backend Dockerfile.prod 생성됨
)

REM Frontend Dockerfile.prod 생성
if not exist frontend\Dockerfile.prod (
    (
        echo FROM node:20-alpine as builder
        echo.
        echo WORKDIR /app
        echo.
        echo # package.json 복사 및 의존성 설치
        echo COPY package*.json ./
        echo RUN npm ci --legacy-peer-deps
        echo.
        echo # 소스 코드 복사 및 빌드
        echo COPY . .
        echo.
        echo # 빌드 시 환경변수 주입
        echo ARG REACT_APP_API_URL=http://localhost:8000/api
        echo ARG REACT_APP_WS_URL=ws://localhost:8000/ws
        echo ENV REACT_APP_API_URL=$REACT_APP_API_URL
        echo ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
        echo.
        echo RUN npm run build
        echo.
        echo # Nginx 스테이지
        echo FROM nginx:alpine
        echo.
        echo # Nginx 설정
        echo COPY --from=builder /app/build /usr/share/nginx/html
        echo.
        echo # Nginx 설정 파일 작성
        echo RUN echo 'server { \
        echo     listen 80; \
        echo     location / { \
        echo         root /usr/share/nginx/html; \
        echo         index index.html; \
        echo         try_files $uri $uri/ /index.html; \
        echo     } \
        echo     location /api { \
        echo         proxy_pass http://backend:8000; \
        echo         proxy_set_header Host $host; \
        echo         proxy_set_header X-Real-IP $remote_addr; \
        echo     } \
        echo     location /ws { \
        echo         proxy_pass http://backend:8000; \
        echo         proxy_http_version 1.1; \
        echo         proxy_set_header Upgrade $http_upgrade; \
        echo         proxy_set_header Connection "upgrade"; \
        echo     } \
        echo }' ^> /etc/nginx/conf.d/default.conf
        echo.
        echo EXPOSE 80
        echo CMD ["nginx", "-g", "daemon off;"]
    ) > frontend\Dockerfile.prod
    echo Frontend Dockerfile.prod 생성됨
)

echo [3/7] docker-compose.yml을 생성합니다...
(
    echo version: '3.8'
    echo.
    echo services:
    echo   # PostgreSQL 데이터베이스
    echo   db:
    echo     image: postgres:14-alpine
    echo     container_name: healthwise_db
    echo     environment:
    echo       POSTGRES_DB: ${POSTGRES_DB:-healthwise}
    echo       POSTGRES_USER: ${POSTGRES_USER:-healthwise}
    echo       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-healthwise123}
    echo     volumes:
    echo       - postgres_data:/var/lib/postgresql/data
    echo     healthcheck:
    echo       test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-healthwise}"]
    echo       interval: 10s
    echo       timeout: 5s
    echo       retries: 5
    echo     restart: unless-stopped
    echo     networks:
    echo       - healthwise-network
    echo.
    echo   # Redis 캐시
    echo   redis:
    echo     image: redis:6-alpine
    echo     container_name: healthwise_redis
    echo     volumes:
    echo       - redis_data:/data
    echo     healthcheck:
    echo       test: ["CMD", "redis-cli", "ping"]
    echo       interval: 10s
    echo       timeout: 5s
    echo       retries: 5
    echo     restart: unless-stopped
    echo     networks:
    echo       - healthwise-network
    echo.
    echo   # Django 백엔드
    echo   backend:
    echo     build:
    echo       context: ./backend
    echo       dockerfile: ${DOCKERFILE_BACKEND:-Dockerfile.prod}
    echo     container_name: healthwise_backend
    echo     volumes:
    echo       - media_volume:/app/media
    echo       - static_volume:/app/staticfiles
    echo     ports:
    echo       - "${BACKEND_PORT:-8000}:8000"
    echo     depends_on:
    echo       db:
    echo         condition: service_healthy
    echo       redis:
    echo         condition: service_healthy
    echo     environment:
    echo       # Django 기본 설정
    echo       - DEBUG=${DEBUG:-False}
    echo       - SECRET_KEY=${SECRET_KEY:-django-insecure-change-this-in-production}
    echo       - DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-healthwise.settings_docker}
    echo       # 데이터베이스
    echo       - DATABASE_URL=postgresql://${POSTGRES_USER:-healthwise}:${POSTGRES_PASSWORD:-healthwise123}@db:5432/${POSTGRES_DB:-healthwise}
    echo       - POSTGRES_HOST=db
    echo       - POSTGRES_PORT=5432
    echo       # Redis
    echo       - REDIS_URL=redis://redis:6379/1
    echo       - REDIS_HOST=redis
    echo       # 보안 설정
    echo       - ALLOWED_HOSTS=${ALLOWED_HOSTS:-*}
    echo       - CORS_ALLOW_ALL_ORIGINS=${CORS_ALLOW_ALL_ORIGINS:-True}
    echo       - CSRF_TRUSTED_ORIGINS=${CSRF_TRUSTED_ORIGINS:-http://localhost}
    echo       # Firebase
    echo       - FIREBASE_CREDENTIALS=${FIREBASE_CREDENTIALS:-}
    echo       # OpenAI
    echo       - OPENAI_API_KEY=${OPENAI_API_KEY:-}
    echo     restart: unless-stopped
    echo     networks:
    echo       - healthwise-network
    echo.
    echo   # React 프론트엔드
    echo   frontend:
    echo     build:
    echo       context: ./frontend
    echo       dockerfile: ${DOCKERFILE_FRONTEND:-Dockerfile.prod}
    echo       args:
    echo         - REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:8000/api}
    echo         - REACT_APP_WS_URL=${REACT_APP_WS_URL:-ws://localhost:8000/ws}
    echo     container_name: healthwise_frontend
    echo     ports:
    echo       - "${FRONTEND_PORT:-3000}:80"
    echo     depends_on:
    echo       - backend
    echo     restart: unless-stopped
    echo     networks:
    echo       - healthwise-network
    echo.
    echo volumes:
    echo   postgres_data:
    echo   redis_data:
    echo   media_volume:
    echo   static_volume:
    echo.
    echo networks:
    echo   healthwise-network:
    echo     driver: bridge
) > docker-compose.yml

echo [4/7] 기존 컨테이너를 정리합니다...
docker-compose down 2>nul

echo [5/7] 도커 이미지를 빌드합니다...
docker-compose build --no-cache

echo [6/7] 서비스를 시작합니다...
docker-compose up -d

echo [7/7] 서비스 상태를 확인합니다...
timeout /t 10 /nobreak > nul
docker-compose ps

echo.
echo ========================================
echo   HealthWise AI 배포 완료!
echo ========================================
echo.
echo 📱 접속 정보:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000/api
echo    Admin: http://localhost:8000/admin
echo.
echo 💡 유용한 명령어:
echo    - 로그 확인: docker-compose logs -f
echo    - 서비스 중지: docker-compose down
echo    - 서비스 재시작: docker-compose restart
echo    - 관리자 계정: docker-compose exec backend python manage.py createsuperuser
echo.
pause
