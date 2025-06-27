# 🚀 HealthWise AI - 간편 도커 배포 가이드

## 📋 요구사항
- Docker Desktop 설치
- Git 설치
- 최소 4GB RAM 여유 공간

## 🎯 원클릭 배포 방법

### 1. Git Clone
```bash
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai
```

### 2. 환경변수 설정 (.env 파일 생성)
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# 필수 설정
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=your-database-password

# Firebase 설정 (Base64 인코딩된 JSON)
FIREBASE_CREDENTIALS=your-base64-encoded-firebase-json

# OpenAI API (선택사항)
OPENAI_API_KEY=your-openai-api-key

# 포트 설정 (기본값 사용 권장)
FRONTEND_PORT=3000
BACKEND_PORT=8000
```

### 3. 배포 실행

#### Windows:
```cmd
deploy.bat
```

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🎉 완료!

배포가 완료되면 다음 주소로 접속:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

## 🛠️ 유용한 명령어

### 서비스 관리
```bash
# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart backend
```

### 데이터베이스 관리
```bash
# 관리자 계정 생성
docker-compose exec backend python manage.py createsuperuser

# 마이그레이션 실행
docker-compose exec backend python manage.py migrate

# 데이터베이스 쉘 접속
docker-compose exec db psql -U healthwise
```

### 개발 모드로 실행
```bash
# 개발 환경 실행 (코드 변경 시 자동 리로드)
docker-compose -f docker-compose.dev.yml up
```

## 🔧 문제 해결

### 포트 충돌
`.env` 파일에서 포트 변경:
```env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

### 메모리 부족
Docker Desktop 설정에서 메모리 할당 증가 (최소 4GB 권장)

### 빌드 실패
```bash
# 캐시 정리 후 재빌드
docker system prune -a
docker-compose build --no-cache
```

## 📝 환경변수 상세 설명

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| SECRET_KEY | Django 시크릿 키 | ✅ | - |
| POSTGRES_PASSWORD | DB 패스워드 | ✅ | healthwise123 |
| FIREBASE_CREDENTIALS | Firebase JSON (Base64) | ❌ | - |
| OPENAI_API_KEY | OpenAI API 키 | ❌ | - |
| DEBUG | 디버그 모드 | ❌ | False |
| ALLOWED_HOSTS | 허용 호스트 | ❌ | * |

## 🌐 프로덕션 배포

실제 서버에 배포 시:
1. `.env` 파일의 보안 설정 강화
2. `ALLOWED_HOSTS`를 실제 도메인으로 변경
3. HTTPS 설정 추가 (Nginx SSL)
4. 방화벽 설정

## 📞 지원

문제가 있으시면 Issues에 등록해주세요!
