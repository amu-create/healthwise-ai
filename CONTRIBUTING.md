# Contributing to HealthWise

HealthWise 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 📋 목차

- [개발 환경 설정](#개발-환경-설정)
- [브랜치 전략](#브랜치-전략)
- [커밋 규칙](#커밋-규칙)
- [Pull Request 프로세스](#pull-request-프로세스)
- [코드 스타일 가이드](#코드-스타일-가이드)
- [테스트](#테스트)

## 🛠 개발 환경 설정

### 1. 저장소 Fork & Clone
```bash
# Fork 후 클론
git clone https://github.com/YOUR_USERNAME/healthwise.git
cd healthwise

# Upstream 저장소 추가
git remote add upstream https://github.com/ORIGINAL_OWNER/healthwise.git
```

### 2. 브랜치 생성
```bash
# 최신 코드 가져오기
git fetch upstream
git checkout main
git merge upstream/main

# 새 브랜치 생성
git checkout -b feature/your-feature-name
```

## 🌳 브랜치 전략

### 브랜치 종류
- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 새로운 기능 개발
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정
- `docs/*`: 문서 작업
- `refactor/*`: 코드 리팩토링

### 브랜치 명명 규칙
```
feature/user-authentication
bugfix/fix-login-error
docs/update-api-documentation
```

## 📝 커밋 규칙

### 커밋 메시지 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 보조 도구 변경
- `perf`: 성능 개선

### 예시
```
feat(auth): JWT 토큰 기반 인증 구현

- JWT 토큰 생성 및 검증 로직 추가
- 리프레시 토큰 구현
- 토큰 만료 시간 설정 (액세스: 15분, 리프레시: 7일)

Closes #123
```

## 🔄 Pull Request 프로세스

### PR 생성 전 체크리스트
- [ ] 최신 develop 브랜치와 동기화
- [ ] 모든 테스트 통과
- [ ] 코드 스타일 가이드 준수
- [ ] 적절한 문서화
- [ ] 의미 있는 커밋 메시지

### PR 템플릿
```markdown
## 변경 사항
<!-- 무엇을 변경했는지 간단히 설명 -->

## 변경 이유
<!-- 왜 이 변경이 필요한지 설명 -->

## 테스트
<!-- 어떻게 테스트했는지 설명 -->

## 체크리스트
- [ ] 코드가 프로젝트 스타일 가이드를 따름
- [ ] 셀프 리뷰 완료
- [ ] 코드에 주석 추가 (특히 복잡한 부분)
- [ ] 문서 업데이트
- [ ] 테스트 추가/수정
- [ ] 모든 테스트 통과
```

## 💻 코드 스타일 가이드

### Python (Backend)
```python
# PEP 8 준수
# Black 포매터 사용
# Type hints 사용 권장

from typing import List, Optional

class UserService:
    """사용자 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        사용자 ID로 사용자를 조회합니다.
        
        Args:
            user_id: 조회할 사용자 ID
            
        Returns:
            User 객체 또는 None
        """
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
```

### JavaScript/TypeScript (Frontend)
```typescript
// ESLint + Prettier 설정 준수
// 함수형 컴포넌트 사용
// TypeScript 타입 정의 필수

interface UserProps {
  name: string;
  age: number;
  isActive?: boolean;
}

const UserCard: React.FC<UserProps> = ({ name, age, isActive = true }) => {
  // 명확한 변수명 사용
  const formattedAge = `${age}세`;
  
  return (
    <div className={`user-card ${isActive ? 'active' : 'inactive'}`}>
      <h3>{name}</h3>
      <p>{formattedAge}</p>
    </div>
  );
};
```

## 🧪 테스트

### Backend 테스트
```bash
# 전체 테스트 실행
python manage.py test

# 특정 앱 테스트
python manage.py test apps.core

# 커버리지 확인
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend 테스트
```bash
# 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

### 테스트 작성 가이드
1. 단위 테스트는 필수
2. 중요한 비즈니스 로직은 통합 테스트 추가
3. 테스트 이름은 명확하게
4. AAA 패턴 사용 (Arrange, Act, Assert)

## 🐛 이슈 리포팅

### 버그 리포트 템플릿
```markdown
**버그 설명**
<!-- 버그에 대한 명확한 설명 -->

**재현 방법**
1. '...'로 이동
2. '...' 클릭
3. '...' 입력
4. 오류 확인

**예상 동작**
<!-- 정상적으로 작동했을 때의 예상 동작 -->

**스크린샷**
<!-- 가능하다면 스크린샷 첨부 -->

**환경 정보**
- OS: [예: Windows 10]
- 브라우저: [예: Chrome 120]
- 버전: [예: 1.0.0]
```

## 📚 추가 리소스

- [Django 문서](https://docs.djangoproject.com/)
- [React 문서](https://reactjs.org/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [프로젝트 Wiki](https://github.com/YOUR_USERNAME/healthwise/wiki)

## ❓ 도움이 필요하신가요?

- Slack 채널: #healthwise-dev
- 이메일: healthwise-dev@example.com
- GitHub Discussions: [링크](https://github.com/YOUR_USERNAME/healthwise/discussions)

감사합니다! 🙏
