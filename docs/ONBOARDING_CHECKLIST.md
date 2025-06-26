# 🎯 동료 개발자 온보딩 체크리스트

## Day 1: 환경 설정 (2시간)

### ✅ Step 1: 프로젝트 받기
```bash
# GitHub에서 클론
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai
```

### ✅ Step 2: Docker 설치 확인
```bash
docker --version
docker-compose --version
```

### ✅ Step 3: 환경 변수 설정
1. `backend/.env.example`을 `backend/.env`로 복사
2. `frontend/.env.example`을 `frontend/.env`로 복사
3. API 키 입력 (팀 리더가 제공)

### ✅ Step 4: Docker 실행
```bash
# 첫 실행 (이미지 빌드 포함, 10-15분 소요)
docker-compose -f docker-compose.dev.yml up --build

# 이후 실행
docker-compose -f docker-compose.dev.yml up
```

### ✅ Step 5: 동작 확인
- http://localhost:3000 접속
- 회원가입 테스트
- 각 메뉴 클릭해보기

## Day 2: 코드 이해하기 (4시간)

### 📂 폴더 구조 파악
```
healthwise/
├── backend/          # Django REST API
│   ├── apps/        # 기능별 앱
│   │   ├── api/     # API 엔드포인트
│   │   ├── core/    # 사용자 모델
│   │   └── social/  # 소셜 기능
│   └── healthwise/  # 설정 파일
├── frontend/        # React 앱
│   ├── src/
│   │   ├── pages/      # 페이지 컴포넌트
│   │   ├── components/ # 재사용 컴포넌트
│   │   └── services/   # API 통신
│   └── public/
└── docker/          # Docker 설정
```

### 🔍 주요 파일 확인
1. **Backend**
   - `backend/apps/api/urls.py` - API 라우팅
   - `backend/apps/api/views.py` - API 뷰
   - `backend/apps/core/models.py` - 데이터 모델

2. **Frontend**
   - `frontend/src/App.tsx` - 메인 앱
   - `frontend/src/pages/` - 각 페이지
   - `frontend/src/services/api.ts` - API 연결

## Day 3: 첫 기능 개발 (실습)

### 🎯 예제: 프로필 페이지에 새 필드 추가

#### 1. Backend - 모델 수정
```python
# backend/apps/core/models.py
class UserProfile(models.Model):
    # 기존 필드들...
    
    # 새 필드 추가
    favorite_exercise = models.CharField(max_length=100, blank=True)
```

#### 2. 마이그레이션 실행
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

#### 3. API 시리얼라이저 수정
```python
# backend/apps/api/serializers.py
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [..., 'favorite_exercise']
```

#### 4. Frontend - UI 추가
```typescript
// frontend/src/pages/Profile.tsx
<TextField
  label="좋아하는 운동"
  name="favorite_exercise"
  value={profile.favorite_exercise}
  onChange={handleChange}
/>
```

#### 5. 테스트
- 브라우저에서 프로필 페이지 확인
- 새 필드에 데이터 입력
- 저장 후 새로고침해서 확인

## 🚨 일반적인 작업 플로우

### 1. 새 기능 개발 시
```bash
# 1. 새 브랜치 생성
git checkout -b feature/운동-기록-추가

# 2. 코드 작성
# ... 개발 ...

# 3. 테스트
docker-compose exec backend python manage.py test
docker-compose exec frontend npm test

# 4. 커밋
git add .
git commit -m "feat: 운동 기록 추가 기능 구현"

# 5. 푸시
git push origin feature/운동-기록-추가

# 6. GitHub에서 PR 생성
```

### 2. 버그 수정 시
```bash
# 1. 이슈 확인
# GitHub Issues에서 버그 확인

# 2. 브랜치 생성
git checkout -b bugfix/issue-123-로그인-오류

# 3. 수정 및 테스트
# ... 수정 ...

# 4. PR 제출
```

## 💡 실용적인 팁

### Docker 컨테이너 접속
```bash
# Backend 쉘 접속
docker-compose exec backend bash

# Django 쉘
docker-compose exec backend python manage.py shell

# 로그 확인
docker-compose logs -f backend
```

### 데이터베이스 작업
```bash
# DB 초기화
docker-compose down -v
docker-compose up

# 테스트 데이터 생성
docker-compose exec backend python manage.py loaddata fixtures/test_data.json
```

### 디버깅
1. **Backend 디버깅**
   ```python
   import pdb; pdb.set_trace()  # 코드에 추가
   ```

2. **Frontend 디버깅**
   - Chrome DevTools 사용
   - React Developer Tools 확장 프로그램

## 🆘 도움 받기

### 막혔을 때
1. `docs/` 폴더의 문서 확인
2. GitHub Issues 검색
3. Slack에서 질문
4. 코드 리뷰 요청

### 자주 발생하는 문제
- **포트 충돌**: 3000, 8000 포트 사용 중인 프로그램 종료
- **Docker 오류**: `docker-compose down -v` 후 재시작
- **패키지 오류**: 컨테이너 재빌드 `--build` 옵션 사용

---

이제 시작할 준비가 되었습니다! 🚀
