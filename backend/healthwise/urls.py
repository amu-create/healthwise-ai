from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import HttpResponse
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.api.urls')),
    path('api/', include('apps.workout.urls')),
    path('api/pose-analysis/', include('apps.pose_analysis.urls')),
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React 앱 서빙 - 개발 환경에서는 React dev server가 처리하므로 Django는 API만 처리
# hot-update.json 같은 webpack 파일들은 무시
if settings.DEBUG:
    # 개발 환경에서는 React dev server (포트 3000)가 프론트엔드 처리
    # Django는 API와 미디어 파일만 처리
    urlpatterns += [
        # webpack hot reload 파일들은 404 반환
        re_path(r'^.*\.hot-update\.(json|js)$', lambda request, *args, **kwargs: HttpResponse(status=404)),
        # sockjs-node는 404 반환
        re_path(r'^sockjs-node/.*', lambda request, *args, **kwargs: HttpResponse(status=404)),
        # 나머지는 개발 서버로 리다이렉트 제안
        re_path(r'^(?!api|admin|media|static).*', 
                lambda request, *args, **kwargs: HttpResponse(
                    '<h1>React Development Server</h1>'
                    '<p>Please access the application at <a href="http://localhost:3000">http://localhost:3000</a></p>'
                    '<p>This is the Django backend server running on port 8000.</p>'
                )),
    ]
else:
    # 프로덕션에서는 React build 파일 서빙
    urlpatterns += [
        re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
    ]
