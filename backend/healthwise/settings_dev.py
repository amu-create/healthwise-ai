"""
Django settings for Docker development environment.
Inherits from base settings and overrides for Docker.
"""

from .settings import *
import os

# Docker 환경에서 DATABASE_URL 사용
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )

# Docker 환경에서 Redis URL 사용
if os.environ.get('REDIS_URL'):
    CHANNEL_LAYERS['default']['CONFIG']['hosts'] = [os.environ.get('REDIS_URL')]
    
    # Cache 설정도 업데이트
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {'max_connections': 50},
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': 'healthwise',
            'TIMEOUT': 3600,
        }
    }

# Docker 환경에서는 정적 파일 디렉토리를 동적으로 생성
STATICFILES_DIRS = []

# 존재하는 디렉토리만 추가
static_dirs = [
    BASE_DIR / 'static',
    BASE_DIR / 'frontend' / 'build' / 'static',
    BASE_DIR / 'frontend' / 'build',
]

for static_dir in static_dirs:
    if static_dir.exists():
        STATICFILES_DIRS.append(static_dir)

# Docker 환경에서 로그 설정
LOGGING['handlers']['file']['filename'] = '/app/logs/debug.log'

# 호스트 설정 확장
ALLOWED_HOSTS.extend(['backend', 'frontend', 'nginx', 'host.docker.internal'])

# CORS 설정 확장
CORS_ALLOWED_ORIGINS.extend([
    "http://frontend:3000",
    "http://backend:8000",
    "http://host.docker.internal:3000",
    "http://host.docker.internal:8000",
])

print("=" * 50)
print("Django Settings Loaded for Docker Development")
print(f"DEBUG: {DEBUG}")
print(f"DATABASE: {DATABASES['default']['ENGINE']}")
print(f"STATIC_ROOT: {STATIC_ROOT}")
print(f"STATICFILES_DIRS: {STATICFILES_DIRS}")
print("=" * 50)
