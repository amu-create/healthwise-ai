# HealthWise Makefile
.PHONY: help setup dev test build clean deploy

# 기본 명령어 (help)
help:
	@echo "HealthWise Development Commands:"
	@echo ""
	@echo "  make setup      - 초기 프로젝트 설정"
	@echo "  make dev        - 개발 서버 실행 (Docker)"
	@echo "  make test       - 전체 테스트 실행"
	@echo "  make build      - 프로덕션 빌드"
	@echo "  make clean      - 임시 파일 정리"
	@echo "  make deploy     - 프로덕션 배포"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up    - Docker 컨테이너 시작"
	@echo "  make docker-down  - Docker 컨테이너 중지"
	@echo "  make docker-logs  - Docker 로그 확인"
	@echo "  make docker-shell - Backend 컨테이너 쉘 접속"

# 초기 설정
setup:
	@echo "🚀 Setting up HealthWise development environment..."
	@echo ""
	@echo "📦 Backend setup..."
	cd backend && python -m venv venv
	cd backend && venv\Scripts\pip install -r requirements.txt
	cd backend && copy .env.example .env 2>nul || echo ".env.example not found"
	@echo "✅ Backend setup complete!"
	@echo ""
	@echo "📦 Frontend setup..."
	cd frontend && npm install
	cd frontend && copy .env.example .env 2>nul || echo ".env.example not found"
	@echo "✅ Frontend setup complete!"
	@echo ""
	@echo "⚠️  Please edit backend/.env and frontend/.env files with your API keys!"
	@echo ""

# 개발 서버 실행
dev: docker-up
	@echo "🏥 HealthWise is running!"
	@echo "  - Backend:  http://localhost:8000"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Admin:    http://localhost:8000/admin (admin/admin123)"

# Docker 명령어
docker-up:
	docker-compose -f docker-compose.dev.yml up -d

docker-down:
	docker-compose -f docker-compose.dev.yml down

docker-logs:
	docker-compose -f docker-compose.dev.yml logs -f

docker-shell:
	docker-compose -f docker-compose.dev.yml exec backend bash

# 테스트 실행
test:
	@echo "🧪 Running tests..."
	@echo ""
	@echo "Backend tests:"
	cd backend && python manage.py test
	@echo ""
	@echo "Frontend tests:"
	cd frontend && npm test -- --watchAll=false

# 빌드
build:
	@echo "🏗️  Building for production..."
	@echo ""
	@echo "Building backend..."
	cd backend && python manage.py collectstatic --noinput
	@echo ""
	@echo "Building frontend..."
	cd frontend && npm run build

# 정리
clean:
	@echo "🧹 Cleaning up..."
	# Python
	for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
	del /s /q *.pyc 2>nul
	# Node
	if exist frontend\build rd /s /q frontend\build
	# Django
	if exist backend\staticfiles rd /s /q backend\staticfiles
	if exist backend\media rd /s /q backend\media
	# Logs
	del /s /q *.log 2>nul
	@echo "✅ Cleanup complete!"

# 배포 (CI/CD 파이프라인 트리거)
deploy:
	@echo "🚀 Deploying to production..."
	git push origin main
	@echo "✅ Deployment triggered! Check GitHub Actions for status."
