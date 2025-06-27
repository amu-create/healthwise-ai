# HealthWise AI - 마이그레이션 의존성 문제 해결 가이드

## 문제 원인
Django 앱들 간의 순환 참조로 인한 마이그레이션 의존성 충돌:
- `social` 앱이 `workout` 앱의 모델을 참조 (ForeignKey)
- 마이그레이션 생성 순서가 꼬여서 발생

## 해결 방법

### 방법 1: 빠른 해결 (데이터 초기화 OK인 경우) ✅ 추천
```bash
# PowerShell 관리자 권한으로 실행
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### 방법 2: 자동 스크립트 사용
```bash
# PowerShell 관리자 권한으로 실행
.\scripts\fix_migration_order.ps1
```

### 방법 3: 수동으로 해결
1. 백엔드 컨테이너 접속
   ```bash
   docker exec -it healthwise_backend bash
   ```

2. 마이그레이션 파일 삭제
   ```bash
   find apps -path '*/migrations/0*.py' -delete
   ```

3. 올바른 순서로 마이그레이션 재생성
   ```bash
   python manage.py makemigrations core
   python manage.py makemigrations workout
   python manage.py makemigrations pose_analysis
   python manage.py makemigrations api
   python manage.py makemigrations social
   python manage.py makemigrations achievements
   ```

4. 마이그레이션 적용
   ```bash
   python manage.py migrate
   ```

## 근본적 해결 (완료)
`backend/healthwise/settings.py`의 INSTALLED_APPS 순서를 수정했습니다:
```python
# Local apps - 순서가 중요합니다!
'apps.core',           # User 모델 (다른 앱이 참조)
'apps.workout',        # 독립적인 운동 관련 모델
'apps.pose_analysis',  # 독립적인 자세 분석
'apps.api',           # workout을 참조할 수 있음
'apps.social',        # workout과 api를 참조
'apps.achievements',  # 다른 앱들을 참조
```

## 환경 체크
문제가 계속되면 환경을 체크하세요:
```bash
# 환경 체크 스크립트 실행
.\scripts\RUN_CHECK.bat
```

## 주의사항
- 방법 1을 사용하면 모든 데이터가 초기화됩니다
- 프로덕션 환경에서는 절대 사용하지 마세요
- 백업을 먼저 하는 것을 권장합니다