FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 정적 파일 수집 (프로덕션용)
RUN python manage.py collectstatic --noinput || true

# 포트 노출
EXPOSE 8000

# 실행 명령
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "healthwise.wsgi:application"]
