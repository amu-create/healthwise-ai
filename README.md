# 🏥 HealthWise AI

AI 기반 개인 맞춤형 건강 관리 플랫폼

## 🚀 빠른 시작 (Docker 배포)

### 1. 사전 요구사항
- Docker Desktop 설치
- Git 설치
- 4GB 이상의 여유 RAM

### 2. 프로젝트 클론
```bash
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai
```

### 3. 환경변수 설정
`.env` 파일을 생성하고 필요한 환경변수를 설정합니다:

```env
# 필수 설정
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=your-secure-password

# Firebase 설정 (선택사항)
FIREBASE_CREDENTIALS=your-base64-encoded-firebase-json

# OpenAI API (선택사항)
OPENAI_API_KEY=your-openai-api-key
```

### 4. 원클릭 배포

#### Windows:
```cmd
deploy.bat
```

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. 접속
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:8000/api
- 👤 Admin Panel: http://localhost:8000/admin

## 🛠️ 개발 환경 설정

### 개발 모드 실행
```bash
# 개발용 Docker Compose 실행 (코드 변경 시 자동 리로드)
docker-compose -f docker-compose.dev.yml up
```

### 유용한 명령어
```bash
# 로그 확인
docker-compose logs -f

# 관리자 계정 생성
docker-compose exec backend python manage.py createsuperuser

# 데이터베이스 마이그레이션
docker-compose exec backend python manage.py migrate

# 서비스 재시작
docker-compose restart

# 서비스 중지
docker-compose down

# 전체 초기화 (볼륨 포함)
docker-compose down -v
```

## 📋 기능

### 핵심 기능
- 🏃‍♂️ **AI 자세 분석**: MediaPipe를 활용한 실시간 운동 자세 교정
- 💬 **AI 건강 상담**: OpenAI GPT 기반 개인 맞춤형 건강 조언
- 📊 **운동 기록 관리**: 운동 루틴 생성 및 진행도 추적
- 🍎 **영양 관리**: 식단 기록 및 칼로리 계산
- 👥 **소셜 기능**: 운동 파트너 매칭 및 커뮤니티
- 🏆 **업적 시스템**: 게이미피케이션을 통한 동기부여

### 기술 스택
- **Backend**: Django 5.0+, Django REST Framework, Channels
- **Frontend**: React 18, TypeScript, Material-UI
- **Database**: PostgreSQL, Redis
- **AI/ML**: OpenAI API, MediaPipe
- **DevOps**: Docker, Docker Compose

## 🔧 문제 해결

### 포트 충돌
`.env` 파일에서 포트를 변경하세요:
```env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

### Docker 메모리 부족
Docker Desktop 설정에서 메모리를 4GB 이상으로 할당하세요.

### 빌드 실패
```bash
# Docker 캐시 정리
docker system prune -a

# 재빌드
docker-compose build --no-cache
```

## 📝 환경변수 설명

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| SECRET_KEY | Django 보안 키 | ✅ | - |
| POSTGRES_PASSWORD | DB 패스워드 | ✅ | healthwise123 |
| FIREBASE_CREDENTIALS | Firebase 인증 정보 | ❌ | - |
| OPENAI_API_KEY | OpenAI API 키 | ❌ | - |
| DEBUG | 디버그 모드 | ❌ | False |
| ALLOWED_HOSTS | 허용 호스트 | ❌ | * |

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

문제가 있거나 제안사항이 있으시면 [Issues](https://github.com/amu-create/healthwise-ai/issues)에 등록해주세요!

---

Made with ❤️ by HealthWise AI Team
