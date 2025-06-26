from django.shortcuts import render
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.api.permissions import IsOwnerOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Avg, Count, Q
from django.utils import timezone
from .models import Exercise, AnalysisSession, AnalysisFrame, UserExerciseStats
from .serializers import (
    ExerciseSerializer, AnalysisSessionSerializer, 
    AnalysisSessionCreateSerializer, UserExerciseStatsSerializer,
    PoseAnalysisRequestSerializer, VideoAnalysisSerializer,
    AnalysisFrameSerializer
)
from .utils.mediapipe_processor import MediaPipeProcessor
from .utils.feedback_generator import FeedbackGenerator
import json
import logging

logger = logging.getLogger(__name__)


class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    """운동 정보 뷰셋"""
    queryset = Exercise.objects.filter(is_active=True)
    serializer_class = ExerciseSerializer
    permission_classes = [AllowAny]  # 운동 목록은 누구나 볼 수 있도록
    
    def list(self, request, *args, **kwargs):
        logger.debug(f"Exercise list called: user={request.user}, authenticated={request.user.is_authenticated}")
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """카테고리별 운동 목록"""
        category = request.query_params.get('category', None)
        if category:
            exercises = self.get_queryset().filter(category=category)
        else:
            exercises = self.get_queryset()
        
        # 카테고리별로 그룹화
        grouped = {}
        for exercise in exercises:
            if exercise.category not in grouped:
                grouped[exercise.category] = []
            grouped[exercise.category].append(ExerciseSerializer(exercise).data)
        
        return Response(grouped)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """사용자 맞춤 운동 추천"""
        user = request.user
        
        # 사용자가 최근에 하지 않은 운동 우선 추천
        recent_exercises = AnalysisSession.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).values_list('exercise_id', flat=True).distinct()
        
        # 사용자 수준에 맞는 운동 추천
        user_stats = UserExerciseStats.objects.filter(user=user)
        avg_score = user_stats.aggregate(avg=Avg('average_score'))['avg'] or 0
        
        if avg_score < 60:
            difficulty = 'beginner'
        elif avg_score < 80:
            difficulty = 'intermediate'
        else:
            difficulty = 'advanced'
        
        recommended = self.get_queryset().exclude(
            id__in=recent_exercises
        ).filter(
            difficulty=difficulty
        )[:5]
        
        if recommended.count() < 5:
            # 부족하면 다른 난이도에서 추가
            additional = self.get_queryset().exclude(
                id__in=recent_exercises
            ).exclude(
                id__in=recommended.values_list('id', flat=True)
            )[:5-recommended.count()]
            recommended = list(recommended) + list(additional)
        
        serializer = ExerciseSerializer(recommended, many=True)
        return Response(serializer.data)


class AnalysisSessionViewSet(viewsets.ModelViewSet):
    """분석 세션 뷰셋"""
    permission_classes = [AllowAny]  # 게스트도 사용 가능
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return AnalysisSession.objects.filter(user=self.request.user)
        return AnalysisSession.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AnalysisSessionCreateSerializer
        return AnalysisSessionSerializer
    
    def create(self, request, *args, **kwargs):
        """세션 생성 - perform_create 대신 create 메서드 오버라이드"""
        logger.debug(f"Create session request data: {request.data}")
        logger.debug(f"Request headers: {dict(request.headers)}")
        logger.debug(f"Request META X-Guest-ID: {request.META.get('HTTP_X_GUEST_ID', 'Not found')}")
        logger.debug(f"Request META X-Is-Guest: {request.META.get('HTTP_X_IS_GUEST', 'Not found')}")
        logger.debug(f"User: {request.user}")
        logger.debug(f"User authenticated: {request.user.is_authenticated}")
        logger.debug(f"User ID: {request.user.id if request.user.is_authenticated else 'Anonymous'}")
        logger.debug(f"Session key: {request.session.session_key if hasattr(request, 'session') else 'No session'}")
        logger.debug(f"Content-Type: {request.content_type}")
        logger.debug(f"CSRF token: {request.META.get('HTTP_X_CSRFTOKEN', 'Not found')}")
        logger.debug(f"Authorization header: {request.META.get('HTTP_AUTHORIZATION', 'Not found')}")
        logger.debug(f"Cookie header: {request.META.get('HTTP_COOKIE', 'Not found')}")
        logger.debug(f"Origin: {request.META.get('HTTP_ORIGIN', 'Not found')}")
        logger.debug(f"Referer: {request.META.get('HTTP_REFERER', 'Not found')}")
        
        # 요청 본문 확인
        if hasattr(request, '_body'):
            logger.debug(f"Raw body: {request._body}")
        else:
            logger.debug("No raw body available")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Serializer errors: {serializer.errors}")
            logger.error(f"Request data type: {type(request.data)}")
            logger.error(f"Request data: {dict(request.data)}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 게스트 사용 제한 확인
        if not request.user.is_authenticated:
            # 게스트 ID로 세션 수 확인
            guest_id = request.headers.get('X-Guest-ID', '')
            if guest_id:
                guest_sessions = AnalysisSession.objects.filter(
                    guest_id=guest_id,
                    created_at__gte=timezone.now() - timezone.timedelta(days=30)
                ).count()
                
                if guest_sessions >= 3:
                    return Response({
                        'error': '게스트는 최대 3회까지만 무료로 사용할 수 있습니다.',
                        'guest_limit_reached': True
                    }, status=status.HTTP_403_FORBIDDEN)
                
                # 게스트 세션 생성
                session = serializer.save(guest_id=guest_id)
            else:
                return Response({
                    'error': '게스트 ID가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # 일반 사용자 세션 생성
            session = serializer.save(user=request.user)
            
            # 사용자 통계 업데이트
            stats, created = UserExerciseStats.objects.get_or_create(
                user=request.user,
                exercise=session.exercise
            )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            AnalysisSessionSerializer(session).data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    
    @action(detail=True, methods=['post'])
    def analyze_frame(self, request, pk=None):
        """실시간 프레임 분석"""
        session = self.get_object()
        serializer = PoseAnalysisRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            try:
                # MediaPipe 처리
                processor = MediaPipeProcessor()
                analysis_result = processor.analyze_pose(
                    landmarks=data['landmarks'],
                    exercise=session.exercise
                )
                
                # 프레임 데이터 저장
                frame = AnalysisFrame.objects.create(
                    session=session,
                    timestamp=data['timestamp'],
                    frame_index=data['frame_index'],
                    angles=analysis_result['angles'],
                    scores=analysis_result['scores'],
                    overall_score=analysis_result['overall_score'],
                    feedback=analysis_result['feedback'],
                    corrections=analysis_result['corrections'],
                    is_in_position=analysis_result['is_in_position']
                )
                
                # 피드백 생성
                feedback_generator = FeedbackGenerator()
                feedback = feedback_generator.generate_realtime_feedback(
                    analysis_result, 
                    session.exercise
                )
                
                return Response({
                    'frame_id': frame.id,
                    'overall_score': analysis_result['overall_score'],
                    'feedback': feedback,
                    'is_in_position': analysis_result['is_in_position']
                })
                
            except Exception as e:
                logger.error(f"Frame analysis error: {str(e)}")
                return Response(
                    {'error': '프레임 분석 중 오류가 발생했습니다.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """세션 완료 처리"""
        session = self.get_object()
        
        if session.completed_at:
            return Response(
                {'error': '이미 완료된 세션입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 세션 통계 계산
        frames = session.frames.all()
        session.calculate_statistics(frames)
        session.completed_at = timezone.now()
        session.save()
        
        # 사용자 통계 업데이트 (인증된 사용자만)
        if request.user.is_authenticated:
            stats, created = UserExerciseStats.objects.get_or_create(
                user=request.user,
                exercise=session.exercise
            )
            stats.update_stats(session)
        
        serializer = AnalysisSessionSerializer(session)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def analyze_video(self, request):
        """비디오 업로드 분석"""
        serializer = VideoAnalysisSerializer(data=request.data)
        
        if serializer.is_valid():
            video_file = serializer.validated_data['video']
            exercise_id = serializer.validated_data['exercise_id']
            
            try:
                exercise = Exercise.objects.get(id=exercise_id)
                
                # 세션 생성
                if request.user.is_authenticated:
                    session = AnalysisSession.objects.create(
                        user=request.user,
                        exercise=exercise,
                        mode='upload',
                        video_file=video_file
                    )
                else:
                    # 게스트 사용자
                    guest_id = request.headers.get('X-Guest-ID', '')
                    if not guest_id:
                        return Response(
                            {'error': '게스트 ID가 필요합니다.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # 게스트 사용 제한 확인
                    guest_sessions = AnalysisSession.objects.filter(
                        guest_id=guest_id,
                        created_at__gte=timezone.now() - timezone.timedelta(days=30)
                    ).count()
                    
                    if guest_sessions >= 3:
                        return Response({
                            'error': '게스트는 최대 3회까지만 무료로 사용할 수 있습니다.',
                            'guest_limit_reached': True
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    session = AnalysisSession.objects.create(
                        guest_id=guest_id,
                        exercise=exercise,
                        mode='upload',
                        video_file=video_file
                    )
                
                # 비디오 분석 (백그라운드 태스크로 처리 가능)
                processor = MediaPipeProcessor()
                analysis_results = processor.analyze_video(
                    video_path=session.video_file.path,
                    exercise=exercise
                )
                
                # 프레임 데이터 저장
                for idx, result in enumerate(analysis_results):
                    AnalysisFrame.objects.create(
                        session=session,
                        timestamp=result['timestamp'],
                        frame_index=idx,
                        angles=result['angles'],
                        scores=result['scores'],
                        overall_score=result['overall_score'],
                        feedback=result['feedback'],
                        corrections=result['corrections'],
                        is_in_position=result['is_in_position']
                    )
                
                # 세션 완료 처리
                session.duration = analysis_results[-1]['timestamp'] if analysis_results else 0
                session.calculate_statistics(session.frames.all())
                session.completed_at = timezone.now()
                session.save()
                
                # 사용자 통계 업데이트
                if request.user.is_authenticated:
                    stats, created = UserExerciseStats.objects.get_or_create(
                        user=request.user,
                        exercise=exercise
                    )
                    stats.update_stats(session)
                
                serializer = AnalysisSessionSerializer(session)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Exercise.DoesNotExist:
                return Response(
                    {'error': '운동을 찾을 수 없습니다.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                logger.error(f"Video analysis error: {str(e)}")
                return Response(
                    {'error': '비디오 분석 중 오류가 발생했습니다.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserExerciseStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """사용자 운동 통계 뷰셋"""
    serializer_class = UserExerciseStatsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserExerciseStats.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """전체 운동 통계 요약"""
        stats = self.get_queryset()
        
        summary = {
            'total_exercises': stats.count(),
            'total_sessions': sum(s.total_sessions for s in stats),
            'total_duration': sum(s.total_duration for s in stats),
            'total_reps': sum(s.total_reps for s in stats),
            'average_score': stats.aggregate(avg=Avg('average_score'))['avg'] or 0,
            'best_exercise': None,
            'most_improved': None,
            'recent_sessions': []
        }
        
        # 가장 잘하는 운동
        if stats:
            best = max(stats, key=lambda x: x.average_score)
            summary['best_exercise'] = {
                'name': best.exercise.name,
                'score': best.average_score,
                'sessions': best.total_sessions
            }
        
        # 가장 향상된 운동
        improved = stats.filter(improvement_rate__gt=0).order_by('-improvement_rate').first()
        if improved:
            summary['most_improved'] = {
                'name': improved.exercise.name,
                'improvement': improved.improvement_rate,
                'current_score': improved.average_score
            }
        
        # 최근 세션
        recent = AnalysisSession.objects.filter(
            user=request.user
        ).select_related('exercise').order_by('-created_at')[:5]
        
        summary['recent_sessions'] = [
            {
                'exercise': session.exercise.name,
                'date': session.created_at,
                'score': session.average_score,
                'duration': session.duration
            }
            for session in recent
        ]
        
        return Response(summary)
