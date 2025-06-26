# 🚀 HealthWise AI 팀 협업 가이드

## 📍 프로젝트 저장소
**GitHub**: https://github.com/amu-create/healthwise-ai

## 🎯 빠른 시작 (팀원용)

### 1. 프로젝트 클론
```bash
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai
```

### 2. 필수 도구 설치
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- **Git**: https://git-scm.com/
- **VS Code**: https://code.visualstudio.com/
- **Python 3.11+**: https://www.python.org/
- **Node.js 18+**: https://nodejs.org/

### 3. 초기 설정
```bash
# Windows 사용자
setup.bat

# Mac/Linux 사용자
make setup
```

### 4. 환경변수 설정
```bash
# backend/.env.example을 복사해서 backend/.env 생성
# frontend/.env.example을 복사해서 frontend/.env 생성
```

### 5. Docker 환경 실행
```bash
# 최적화된 버전 사용 권장
make dev-opt

# 또는
docker-compose -f docker-compose.dev-optimized.yml up -d
```

### 6. 접속 확인
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin

## 👥 협업 방식

### Git 브랜치 전략
```bash
main
├── develop
│   ├── feature/login-system
│   ├── feature/workout-tracker
│   └── feature/nutrition-plan
└── hotfix/critical-bug
```

### 작업 흐름
1. **Issue 생성** - GitHub Issues에서 작업 내용 작성
2. **브랜치 생성** - `feature/기능명` 형식
3. **개발 진행** - 로컬에서 작업
4. **PR 생성** - Pull Request로 코드 리뷰 요청
5. **리뷰 & 병합** - 팀원 승인 후 병합

## 🛠️ 개발 명령어

### Docker 관리
```bash
make dev          # 개발 서버 시작
make stop         # 서버 중지
make logs         # 로그 확인
make shell        # 백엔드 쉘 접속
make status       # Docker 상태 확인
make prune        # Docker 정리
```

### 데이터베이스
```bash
# 마이그레이션
make migrate

# 슈퍼유저 생성
docker-compose exec backend python manage.py createsuperuser
```

### 테스트
```bash
make test         # 전체 테스트 실행
```

## 📁 프로젝트 구조
```
healthwise-ai/
├── backend/          # Django 백엔드
├── frontend/         # React 프론트엔드
├── docs/            # 문서
├── .github/         # GitHub 설정
├── docker-compose.dev.yml         # 개발 환경
├── docker-compose.dev-optimized.yml # 최적화 버전
├── Makefile         # 자동화 명령어
└── setup.bat        # Windows 설정
```

## 🔧 문제 해결

### Docker 용량 문제
```bash
# Windows
docker-cleanup.bat

# 또는
make prune
```

### 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

### 권한 문제
- Docker Desktop를 관리자 권한으로 실행
- WSL2 사용 권장

## 💬 소통 채널

### GitHub
- **Issues**: 버그 리포트, 기능 제안
- **Pull Requests**: 코드 리뷰
- **Discussions**: 일반 논의

### 실시간 소통
- Discord/Slack 채널 생성 권장
- 매일 스탠드업 미팅

## 📝 코딩 컨벤션

### Git 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정
```

### 코드 스타일
- Backend: PEP 8 (Black 사용)
- Frontend: ESLint + Prettier
- 주석은 한국어 가능

## 🚀 다음 단계

1. **팀원 초대**
   - GitHub 저장소 Settings > Collaborators
   - 팀원 GitHub 계정 추가

2. **프로젝트 보드 설정**
   - GitHub Projects 활용
   - 칸반 보드로 작업 관리

3. **CI/CD 활성화**
   - GitHub Actions 설정
   - 자동 테스트 및 배포

---

**문의사항**: Issues에 등록하거나 팀 채널로 연락주세요!
