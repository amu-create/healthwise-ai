# 🏥 HealthWise - AI 기반 헬스케어 플랫폼

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0+-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

AI 기술을 활용한 개인 맞춤형 헬스케어 플랫폼입니다. 실시간 자세 분석, 영양 관리, 소셜 피트니스 기능을 제공합니다.

## 🚀 Quick Start for Developers

### Prerequisites
- Python 3.10+
- Node.js 16+
- Docker & Docker Compose
- Redis
- PostgreSQL (옵션)

### 🐳 Docker로 시작하기 (권장)
```bash
# 개발 환경 실행
docker-compose -f docker-compose.dev.yml up

# 또는 Makefile 사용
make dev
```

서비스 접속:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- Redis: localhost:6379
- PostgreSQL: localhost:5432

### 💻 로컬 개발 환경

#### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
cp .env.example .env
# .env 파일 편집 (API 키 설정)

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# .env 파일 편집

npm start
```

## 📚 프로젝트 구조

```
healthwise/
├── backend/                # Django 백엔드
│   ├── apps/              # 애플리케이션 모듈
│   │   ├── api/          # REST API
│   │   ├── core/         # 핵심 모델
│   │   ├── social/       # 소셜 기능
│   │   └── workout/      # 운동 관리
│   └── healthwise/       # 프로젝트 설정
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── services/    # API 서비스
│   └── public/
├── docker/               # Docker 설정
├── docs/                # 프로젝트 문서
└── scripts/             # 유틸리티 스크립트
```

## 🛠 주요 기능

- **AI 자세 분석**: MediaPipe를 활용한 실시간 운동 자세 교정
- **영양 관리**: AI 기반 식단 분석 및 추천
- **소셜 피트니스**: 커뮤니티 기능 및 챌린지
- **실시간 채팅**: WebSocket 기반 실시간 소통
- **푸시 알림**: Firebase를 통한 알림 시스템

## 📖 Documentation

- [프로젝트 아키텍처](docs/architecture.md)
- [API 문서](docs/api.md)
- [개발 가이드](docs/development.md)
- [배포 가이드](docs/deployment.md)
- [트러블슈팅](docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 🔧 Scripts

```bash
# 개발 서버 실행
make dev

# 테스트 실행
make test

# 프로덕션 빌드
make build

# 정리
make clean
```

## 📞 Support

- Issue Tracker: [GitHub Issues](https://github.com/YOUR_USERNAME/healthwise/issues)
- Wiki: [프로젝트 Wiki](https://github.com/YOUR_USERNAME/healthwise/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
