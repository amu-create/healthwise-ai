# Docker 환경 관리 가이드

## 🐳 Docker 용량 문제 해결

### 1. 현재 상태 확인
```bash
# Docker 디스크 사용량 확인
docker system df

# 실행 중인 컨테이너 확인
docker ps -a

# 이미지 목록 확인
docker images
```

### 2. 용량 정리 방법

#### 일반 정리 (안전)
```bash
# 사용하지 않는 컨테이너 제거
docker container prune -f

# 사용하지 않는 이미지 제거
docker image prune -f

# 사용하지 않는 볼륨 제거
docker volume prune -f

# 사용하지 않는 네트워크 제거
docker network prune -f
```

#### 전체 정리 (주의!)
```bash
# 모든 중지된 컨테이너, 사용하지 않는 이미지, 볼륨 제거
docker system prune -a --volumes -f
```

#### HealthWise 프로젝트만 정리
```bash
# HealthWise 컨테이너와 볼륨 제거
docker-compose -f docker-compose.dev.yml down -v
```

### 3. Docker 빌드 캐시 정리
```bash
# 빌드 캐시 제거
docker builder prune -f

# 특정 기간 이전의 캐시만 제거
docker builder prune -f --filter "until=24h"
```

## 🔧 최적화된 Docker 설정

### 주요 개선사항:

1. **메모리 제한 설정**
   - PostgreSQL: 512MB
   - Redis: 256MB
   - Backend: 1GB
   - Frontend: 2GB

2. **캐시 볼륨 추가**
   - pip 캐시
   - npm 캐시

3. **멀티스테이지 빌드**
   - 이미지 크기 최소화
   - 빌드 시간 단축

4. **헬스체크 추가**
   - 서비스 간 의존성 관리
   - 자동 재시작

## 📊 Docker 모니터링

### 리소스 사용량 확인
```bash
# 실시간 리소스 사용량
docker stats

# 특정 컨테이너 상태
docker inspect healthwise_backend
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.dev.yml logs -f backend
```

## 🚀 사용 방법

### 1. 정리 도구 사용
```bash
# Windows
docker-cleanup.bat

# Make 명령어
make prune        # 일반 정리
make prune-all    # 전체 정리 (주의!)
```

### 2. 최적화된 환경 실행
```bash
# 최적화된 설정으로 실행
make dev-opt

# 또는
docker-compose -f docker-compose.dev-optimized.yml up -d
```

### 3. 상태 확인
```bash
make status
```

## ⚠️ 주의사항

1. **데이터 백업**
   - 볼륨 제거 전 필요한 데이터 백업
   - 데이터베이스 덤프 생성

2. **이미지 재빌드**
   - 캐시 정리 후 재빌드 필요
   - 초기 빌드 시간 소요

3. **네트워크 설정**
   - 컨테이너 간 통신 확인
   - 포트 충돌 확인

## 📈 성능 튜닝

### PostgreSQL 최적화
```yaml
environment:
  POSTGRES_SHARED_BUFFERS: 256MB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
  POSTGRES_MAINTENANCE_WORK_MEM: 64MB
```

### Redis 최적화
```yaml
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Node.js 최적화
```yaml
environment:
  NODE_OPTIONS: --max-old-space-size=2048
```

## 🔍 문제 해결

### 1. 컨테이너가 시작되지 않을 때
```bash
# 로그 확인
docker-compose logs backend

# 컨테이너 쉘 접속
docker-compose run backend bash
```

### 2. 메모리 부족
```bash
# Docker Desktop 메모리 증가
# Settings > Resources > Memory

# WSL2 메모리 설정 (.wslconfig)
[wsl2]
memory=8GB
swap=2GB
```

### 3. 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

## 📝 체크리스트

- [ ] Docker Desktop 메모리 할당 확인
- [ ] 불필요한 이미지/컨테이너 정리
- [ ] 캐시 볼륨 활용
- [ ] 헬스체크 설정
- [ ] 리소스 제한 설정
- [ ] 로그 로테이션 설정
