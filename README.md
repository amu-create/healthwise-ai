# 🏥 HealthWise AI

AI 기반 개인 건강 관리 플랫폼

[![GitHub](https://img.shields.io/github/license/amu-create/healthwise-ai)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](docker-compose.dev.yml)
[![React](https://img.shields.io/badge/react-18.x-61dafb)](frontend)
[![Django](https://img.shields.io/badge/django-5.x-green)](backend)

## 🚀 팀원 빠른 시작 (3분 완료)

### 📋 사전 요구사항
- [Docker Desktop](https://www.docker.com/products/docker-desktop) 설치
- [Git](https://git-scm.com/) 설치

### ⚡ 자동 설정 (Windows)

```bash
# 1. 저장소 클론
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai

# 2. 자동 설정 스크립트 실행
setup.bat
```

### 🔧 수동 설정 (모든 OS)

```bash
# 1. 저장소 클론
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai

# 2. 환경변수 설정
cp .env.example .env
# .env 파일을 열어서 필수 값들 수정:
# - SECRET_KEY: https://djecrety.ir/ 에서 생성
# - OPENAI_API_KEY: https://platform.openai.com/api-keys 에서 발급

# 3. Docker 실행
docker-compose -f docker-compose.dev.yml up --build -d
```

### 🌐 접속 확인

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000/api
- **관리자 페이지**: http://localhost:8000/admin
  - 개발용 계정: `admin` / `admin123`

## 🏗️ 프로젝트 구조

```
healthwise-ai/
├── 📱 frontend/          # React TypeScript 앱
├── 🐍 backend/           # Django REST API
├── 🐳 docker/            # Docker 설정
├── 📚 docs/              # 문서
├── 🔧 scripts/           # 유틸리티 스크립트
├── .env.example          # 환경변수 템플릿
├── docker-compose.dev.yml # 개발환경 Docker 설정
└── setup.bat             # Windows 자동 설정
```

## 🎯 주요 기능

- 🤖 **AI 챗봇**: OpenAI GPT 기반 건강 상담
- 💪 **운동 추적**: 실시간 자세 분석 및 추천
- 🥗 **영양 관리**: 식단 분석 및 칼로리 추적
- 👥 **소셜 기능**: 친구와 운동 기록 공유
- 📊 **대시보드**: 개인 건강 데이터 시각화
- 🎵 **음악 추천**: 운동에 맞는 음악 제안

## 🔧 개발 환경

### 백엔드 (Django)
- **언어**: Python 3.11
- **프레임워크**: Django 5.2, DRF
- **데이터베이스**: PostgreSQL 14
- **캐시**: Redis 6
- **AI**: OpenAI GPT API

### 프론트엔드 (React)
- **언어**: TypeScript
- **프레임워크**: React 18
- **상태관리**: Context API
- **스타일링**: Tailwind CSS
- **빌드도구**: Vite

## 📝 개발 워크플로우

### 일반 개발
```bash
# 코드 수정 → 자동 핫 리로드
# 새 패키지 설치 후
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
```

### 모델 변경시
```bash
# 백엔드 컨테이너에서 마이그레이션 자동 생성/적용
docker-compose -f docker-compose.dev.yml restart backend
```

### 문제 해결
```bash
# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f [service_name]

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart [service_name]

# 데이터베이스 초기화
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

## 🌟 API 엔드포인트

### 인증
- `POST /api/auth/register/` - 회원가입
- `POST /api/auth/login/` - 로그인
- `POST /api/auth/logout/` - 로그아웃

### 챗봇
- `POST /api/guest/chatbot/` - AI 채팅 (게스트)
- `POST /api/chatbot/` - AI 채팅 (인증)

### 운동
- `GET /api/guest/workout-logs/` - 운동 기록 조회
- `POST /api/workout/logs/` - 운동 기록 생성

### 영양
- `GET /api/guest/nutrition-statistics/` - 영양 통계
- `POST /api/nutrition/meals/` - 식사 기록

## 🔐 환경변수 설정

### 필수 설정
```env
# Django 보안키 (필수)
SECRET_KEY=your-secret-key-here

# OpenAI API 키 (챗봇 기능용)
OPENAI_API_KEY=your-openai-api-key-here
```

### 개발용 기본값 (수정 불필요)
```env
DEBUG=True
DATABASE_URL=postgresql://healthwise_user:healthwise_password@db:5432/healthwise_db
REDIS_URL=redis://redis:6379/0
REACT_APP_API_URL=http://localhost:8000/api
```

## 🚨 문제 해결

### 포트 충돌
```yaml
# docker-compose.dev.yml에서 포트 변경
services:
  frontend:
    ports:
      - "3001:3000"  # 3000 → 3001
  backend:
    ports:
      - "8001:8000"  # 8000 → 8001
```

### 마이그레이션 오류
```bash
# 데이터베이스 완전 초기화
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

### 프론트엔드 빌드 오류
```bash
# Node modules 재설치
docker-compose -f docker-compose.dev.yml exec frontend npm install
docker-compose -f docker-compose.dev.yml restart frontend
```

## 📞 지원

문제 발생시 다음 정보와 함께 팀 채널에 문의:
1. 오류 스크린샷
2. `docker-compose -f docker-compose.dev.yml logs` 출력
3. 운영체제 및 Docker 버전

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**개발팀**: amu-create  
**프로젝트 시작**: 2025년 6월  
**최신 업데이트**: 2025년 6월 27일
