# 🏥 HealthWise 개발 시작 가이드

## 📋 사전 준비사항
- Git
- Docker & Docker Compose
- 텍스트 에디터 (VS Code 권장)

## 🚀 빠른 시작 (5분 안에 실행!)

### 1. 프로젝트 클론
```bash
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai
```

### 2. 환경 설정
```bash
# Windows
setup.bat

# Mac/Linux
chmod +x setup.sh
./setup.sh
```

### 3. API 키 설정
1. `backend/.env` 파일 열기
2. 다음 키들을 설정:
   ```
   OPENAI_API_KEY=your-key-here
   GEMINI_API_KEY=your-key-here
   YOUTUBE_API_KEY=your-key-here
   KAKAO_API_KEY=your-key-here
   ```

3. `frontend/.env` 파일 열기
4. Firebase 설정 추가

### 4. Docker로 실행
```bash
# 전체 스택 실행
docker-compose -f docker-compose.dev.yml up

# 또는 Makefile 사용
make dev
```

### 5. 접속하기
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:8000
- 👤 Django Admin: http://localhost:8000/admin (admin/admin123)

## 💻 개발 방법

### 브랜치 전략
```bash
# 새 기능 개발
git checkout -b feature/your-feature-name

# 버그 수정
git checkout -b bugfix/fix-description
```

### 코드 수정 후
1. **Backend 수정 시**
   - 변경사항은 자동으로 반영됩니다 (Hot Reload)
   - 새 패키지 설치: `docker-compose exec backend pip install package-name`

2. **Frontend 수정 시**
   - 변경사항은 자동으로 반영됩니다 (Hot Reload)
   - 새 패키지 설치: `docker-compose exec frontend npm install package-name`

### 테스트 실행
```bash
# Backend 테스트
docker-compose exec backend python manage.py test

# Frontend 테스트
docker-compose exec frontend npm test
```

### 데이터베이스 작업
```bash
# 마이그레이션 생성
docker-compose exec backend python manage.py makemigrations

# 마이그레이션 적용
docker-compose exec backend python manage.py migrate

# 슈퍼유저 생성
docker-compose exec backend python manage.py createsuperuser
```

## 🛠 유용한 명령어

### Docker 명령어
```bash
# 로그 보기
docker-compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.dev.yml logs -f backend

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart backend

# 전체 중지 및 삭제
docker-compose -f docker-compose.dev.yml down
```

### Makefile 명령어
```bash
make dev        # 개발 서버 실행
make test       # 테스트 실행
make clean      # 임시 파일 정리
make docker-shell  # Backend 쉘 접속
```

## 🔧 문제 해결

### 포트 충돌
```bash
# 포트 확인
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /PID <PID> /F
```

### Docker 빌드 실패
```bash
# 캐시 없이 다시 빌드
docker-compose -f docker-compose.dev.yml build --no-cache

# 모든 이미지 정리
docker system prune -a
```

### 데이터베이스 초기화
```bash
# 데이터베이스 볼륨 삭제
docker-compose -f docker-compose.dev.yml down -v

# 다시 실행
docker-compose -f docker-compose.dev.yml up
```

## 📝 PR 제출 방법

1. 코드 커밋
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
```

2. 푸시
```bash
git push origin feature/your-feature-name
```

3. GitHub에서 Pull Request 생성
   - main 브랜치로 PR 생성
   - 설명 작성
   - 리뷰어 지정

## 🤝 팀 협업

### Slack 채널
- #healthwise-dev: 개발 토론
- #healthwise-help: 도움 요청

### 코드 리뷰
- 모든 PR은 최소 1명의 리뷰 필요
- 테스트 통과 필수
- 커밋 메시지 규칙 준수

## 📚 추가 문서
- [API 문서](http://localhost:8000/api/docs)
- [프로젝트 구조](docs/architecture.md)
- [코딩 스타일 가이드](CONTRIBUTING.md)

---

💡 **도움이 필요하면**: 
- GitHub Issues 생성
- Slack에서 질문
- 팀 리드에게 연락
