.PHONY: help setup dev dev-opt stop clean logs shell test lint format migrate

# 기본 타겟
help:
	@echo "HealthWise Docker 관리 명령어"
	@echo "================================"
	@echo "make setup     - 초기 환경 설정"
	@echo "make dev       - 개발 서버 실행"
	@echo "make dev-opt   - 최적화된 개발 서버 실행"
	@echo "make stop      - 모든 서비스 중지"
	@echo "make clean     - 컨테이너 및 볼륨 제거"
	@echo "make logs      - 로그 확인"
	@echo "make shell     - 백엔드 쉘 접속"
	@echo "make test      - 테스트 실행"
	@echo "make migrate   - DB 마이그레이션"
	@echo "make status    - Docker 상태 확인"
	@echo "make prune     - Docker 시스템 정리"

# 초기 설정
setup:
	@echo "환경 설정 중..."
	@if not exist backend\.env copy backend\.env.example backend\.env
	@if not exist frontend\.env copy frontend\.env.example frontend\.env
	@echo "설정 완료!"

# 개발 서버 실행
dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "개발 서버가 시작되었습니다."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"

# 최적화된 개발 서버 실행
dev-opt:
	docker-compose -f docker-compose.dev-optimized.yml up -d
	@echo "최적화된 개발 서버가 시작되었습니다."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"

# 서비스 중지
stop:
	docker-compose -f docker-compose.dev.yml stop
	docker-compose -f docker-compose.dev-optimized.yml stop

# 정리 (컨테이너, 볼륨 제거)
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.dev-optimized.yml down -v

# 로그 확인
logs:
	docker-compose -f docker-compose.dev.yml logs -f

# 백엔드 쉘 접속
shell:
	docker-compose -f docker-compose.dev.yml exec backend bash

# 테스트 실행
test:
	docker-compose -f docker-compose.dev.yml exec backend python manage.py test
	docker-compose -f docker-compose.dev.yml exec frontend npm test

# DB 마이그레이션
migrate:
	docker-compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
	docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Docker 상태 확인
status:
	@echo "=== Docker 디스크 사용량 ==="
	@docker system df
	@echo ""
	@echo "=== 실행 중인 컨테이너 ==="
	@docker ps
	@echo ""
	@echo "=== HealthWise 컨테이너 상태 ==="
	@docker-compose -f docker-compose.dev.yml ps

# Docker 시스템 정리
prune:
	@echo "Docker 시스템 정리를 시작합니다..."
	docker system prune -f
	docker volume prune -f
	@echo "정리 완료!"

# 완전 정리 (주의!)
prune-all:
	@echo "*** 경고: 모든 Docker 데이터가 삭제됩니다! ***"
	@echo "10초 후 시작됩니다. Ctrl+C로 취소하세요."
	@timeout /t 10
	docker system prune -a --volumes -f
	@echo "완전 정리 완료!"
