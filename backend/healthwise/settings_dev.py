"""
Development settings for HealthWise project.
"""
from .settings import *
import os

# Disable file logging in Docker environment
if 'handlers' in LOGGING and 'file' in LOGGING['handlers']:
    LOGGING['handlers'].pop('file', None)
    LOGGING['root']['handlers'] = ['console']
    for logger in LOGGING['loggers'].values():
        logger['handlers'] = ['console']

# Database configuration for Docker
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Parse database URL manually
    import re
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
    if match:
        user, password, host, port, name = match.groups()
        DATABASES['default'] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': name,
            'USER': user,
            'PASSWORD': password,
            'HOST': host,
            'PORT': port,
        }

# Redis configuration for Docker
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    # Parse Redis URL
    import re
    match = re.match(r'redis://([^:]+):(\d+)/(\d+)', REDIS_URL)
    if match:
        host, port, db = match.groups()
        CHANNEL_LAYERS['default']['CONFIG']['hosts'] = [(host, int(port))]
        
        # Update cache configuration
        try:
            import django_redis
            CACHES['default']['LOCATION'] = REDIS_URL
        except ImportError:
            pass

# Static files - ensure directories exist
STATIC_ROOT = '/tmp/staticfiles'
MEDIA_ROOT = '/tmp/media'

# Ensure DEBUG is True for development
DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# Disable CSRF for development
CSRF_TRUSTED_ORIGINS = ['http://localhost:*', 'http://127.0.0.1:*', 'http://0.0.0.0:*']
