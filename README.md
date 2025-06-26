# 🏥 HealthWise AI

AI 기반 개인 건강 관리 플랫폼 (실시간 운동 자세분석 지원)

[![GitHub](https://img.shields.io/github/license/amu-create/healthwise-ai)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](docker-compose.dev.yml)
[![React](https://img.shields.io/badge/react-18.x-61dafb)](frontend)
[![Django](https://img.shields.io/badge/django-5.x-green)](backend)
[![MediaPipe](https://img.shields.io/badge/mediapipe-0.10.21-orange)](backend)

## 🚀 팀원 빠른 시작 (3분 완료)

### 📋 사전 요구사항
- [Docker Desktop](https://www.docker.com/products/docker-desktop) 설치
- [Git](https://git-scm.com/) 설치

### ⚡ 자동 설정 (Windows 추천)

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

## 🎯 주요 기능

- 🤖 **AI 운동 자세분석**: MediaPipe 기반 실시간 자세 교정
  - 실시간 카메라 분석
  - 비디오 파일 업로드 분석
  - 스쿼트, 푸쉬업, 플랭크, 런지, 버피 지원
- 💬 **AI 챗봇**: OpenAI GPT 기반 건강 상담
- 💪 **운동 추적**: 운동 기록 및 진도 관리
- 🥗 **영양 관리**: 식단 분석 및 칼로리 추적
- 👥 **소셜 기능**: 친구와 운동 기록 공유
- 📊 **대시보드**: 개인 건강 데이터 시각화
- 🎵 **음악 추천**: 운동에 맞는 음악 제안

## 🏗️ 프로젝트 구조

```
healthwise-ai/
├── 📱 frontend/          # React TypeScript 앱
│   ├── src/components/pose-analysis/  # 자세분석 컴포넌트
│   ├── src/hooks/pose-analysis/       # MediaPipe 훅
│   └── src/services/pose-analysis/    # 자세분석 서비스
├── 🐍 backend/           # Django REST API
│   ├── apps/pose_analysis/            # 자세분석 앱
│   ├── apps/pose_analysis/utils/      # MediaPipe 프로세서
│   └── requirements.txt               # AI 라이브러리 포함
├── 🐳 docker/            # Docker 설정
├── 📚 docs/              # 문서
├── 🔧 scripts/           # 유틸리티 스크립트
├── .env.example          # 환경변수 템플릿
├── docker-compose.dev.yml # 개발환경 Docker 설정
└── setup.bat             # Windows 자동 설정
```

## 🔧 개발 환경

### 백엔드 (Django)
- **언어**: Python 3.11
- **프레임워크**: Django 5.2, DRF
- **데이터베이스**: PostgreSQL 14
- **캐시**: Redis 6
- **AI**: OpenAI GPT API, MediaPipe 0.10.21
- **컴퓨터 비전**: OpenCV 4.11

### 프론트엔드 (React)
- **언어**: TypeScript
- **프레임워크**: React 18
- **상태관리**: Context API
- **스타일링**: Tailwind CSS, MUI
- **빌드도구**: Vite
- **AI**: MediaPipe Web (CDN)

## 📝 개발 워크플로우

### 일반 개발
```bash
# 코드 수정 → 자동 핫 리로드
# 새 패키지 설치 후
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
```

### AI 모델 업데이트
```bash
# MediaPipe 라이브러리 업데이트
docker-compose -f docker-compose.dev.yml exec backend pip install --upgrade mediapipe
docker-compose -f docker-compose.dev.yml restart backend
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

# AI 기능 확인
docker-compose -f docker-compose.dev.yml exec backend python -c "from apps.pose_analysis.utils.mediapipe_processor import MediaPipeProcessor; print('MediaPipe OK')"

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart [service_name]

# 데이터베이스 초기화
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

## 🤖 AI 자세분석 사용법

### 실시간 분석
1. http://localhost:3000 접속
2. "자세분석" 페이지 이동
3. "실시간 분석" 탭 선택
4. 카메라 권한 허용
5. 운동 선택 후 "분석 시작" 클릭

### 비디오 업로드 분석
1. "비디오 업로드" 탭 선택
2. 운동 비디오 파일 업로드
3. 자동 분석 및 결과 확인

### 지원 운동
- **스쿼트**: 무릎 각도, 엉덩이 위치 분석
- **푸쉬업**: 팔꿈치 각도, 몸통 일직선 분석
- **플랭크**: 몸통 각도, 어깨 위치 분석
- **런지**: 앞뒤 무릎 각도 분석
- **버피**: 단계별 자세 분석

## 🌟 API 엔드포인트

### 자세분석 API
- `GET /api/pose-analysis/exercises/` - 운동 목록
- `POST /api/pose-analysis/sessions/` - 분석 세션 생성
- `POST /api/pose-analysis/sessions/{id}/analyze_frame/` - 실시간 프레임 분석
- `POST /api/pose-analysis/sessions/analyze_video/` - 비디오 분석

### 기존 API
- `POST /api/auth/register/` - 회원가입
- `POST /api/auth/login/` - 로그인
- `POST /api/guest/chatbot/` - AI 채팅 (게스트)
- `GET /api/guest/workout-logs/` - 운동 기록 조회

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

### MediaPipe 관련 문제
```bash
# MediaPipe 설치 확인
docker-compose -f docker-compose.dev.yml exec backend pip list | grep mediapipe

# MediaPipe 재설치
docker-compose -f docker-compose.dev.yml exec backend pip install --force-reinstall mediapipe opencv-python-headless
```

### 카메라 접근 문제
- **Chrome**: 설정 > 개인정보 보호 및 보안 > 사이트 설정 > 카메라
- **HTTPS 필요**: 로컬 개발에서는 localhost로 접속

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

## 📊 시스템 요구사항

### 최소 요구사항
- **RAM**: 4GB 이상
- **CPU**: 2코어 이상
- **저장공간**: 10GB 이상
- **네트워크**: 브로드밴드 인터넷 (MediaPipe 모델 다운로드용)

### 권장 요구사항
- **RAM**: 8GB 이상
- **CPU**: 4코어 이상
- **GPU**: 웹캠 또는 외부 카메라
- **브라우저**: Chrome 80+ (MediaPipe 최적화)

## 📞 지원

문제 발생시 다음 정보와 함께 팀 채널에 문의:
1. 오류 스크린샷
2. `docker-compose -f docker-compose.dev.yml logs` 출력
3. 운영체제 및 Docker 버전
4. 사용 중인 브라우저 및 버전

## 🆕 최근 업데이트

- ✅ **MediaPipe 자세분석** 완전 구현
- ✅ **실시간 카메라 분석** 지원
- ✅ **비디오 업로드 분석** 지원
- ✅ **운동별 맞춤 피드백** 시스템
- ✅ **자동 환경 설정** 스크립트

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**개발팀**: amu-create  
**프로젝트 시작**: 2025년 6월  
**최신 업데이트**: 2025년 6월 27일 - MediaPipe AI 자세분석 완전 구현
