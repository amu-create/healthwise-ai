# 동료 개발자가 HealthWise 프로젝트 시작하는 방법 (5분 가이드)

## 🎯 요약: 3단계로 끝!

### 1️⃣ 코드 받기 (1분)
```bash
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai
```

### 2️⃣ Docker로 실행 (3분)
```bash
docker-compose -f docker-compose.dev.yml up
```

### 3️⃣ 브라우저 열기 (1분)
- http://localhost:3000 (앱)
- http://localhost:8000/admin (관리자)
- 계정: admin / admin123

## 끝! 🎉

---

## 🔧 실제 개발 시작하기

### 코드 수정 예시
1. **Frontend 수정**: `frontend/src/pages/` 에서 원하는 페이지 수정
2. **Backend 수정**: `backend/apps/api/` 에서 API 수정
3. **저장하면 자동 반영됨** (Hot Reload)

### 새 기능 추가하려면?
```bash
# 1. 브랜치 만들기
git checkout -b feature/my-feature

# 2. 코드 작성
# ... 수정 ...

# 3. 커밋 & 푸시
git add .
git commit -m "feat: 새 기능 추가"
git push origin feature/my-feature

# 4. GitHub에서 Pull Request 만들기
```

## 📞 막히면?
- Slack: #healthwise-dev
- 또는 GitHub Issues에 질문

---

**참고**: API 키는 팀장이 별도로 전달합니다.
