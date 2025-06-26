"""
ASGI config for healthwise project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthwise.settings')

# Import Django first
django_asgi_app = get_asgi_application()

# Import routing after Django setup
from apps.social.routing import websocket_urlpatterns as social_urls

websocket_urlpatterns = social_urls

# Check if api routing exists
try:
    from apps.api.routing import websocket_urlpatterns as api_urls
    websocket_urlpatterns = api_urls + social_urls
except ImportError:
    pass

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
