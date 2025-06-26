# Docker 환경용 설정 오버라이드
from .settings import *
import os

# Docker 환경에서 PostgreSQL 사용
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
else:
    # PostgreSQL 직접 설정
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'healthwise_dev',
            'USER': 'developer',
            'PASSWORD': 'devpass123',
            'HOST': os.environ.get('POSTGRES_HOST', 'db'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }

# Redis 설정 - Docker 환경
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(REDIS_HOST, 6379)],
        },
    },
}

# Cache 설정 - Docker Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {'max_connections': 50},
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'IGNORE_EXCEPTIONS': True,
        },
        'KEY_PREFIX': 'healthwise',
        'TIMEOUT': 3600,
    }
}

# 로깅 설정 - 파일 핸들러 제거
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} [{name}:{lineno}] {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'colored': {
            'format': '\033[1;36m[{levelname}]\033[0m {asctime} \033[1;33m[{name}:{lineno}]\033[0m {message}',
            'style': '{',
            'datefmt': '%H:%M:%S'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'colored',
            'level': 'DEBUG',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'api': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'api.simple_chatbot': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'api.views': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
