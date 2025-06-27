import os
import sys
import django
from datetime import datetime, timedelta

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthwise.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import WorkoutCategory, WorkoutVideo, DailyRecommendation, WorkoutLog
from apps.api.models import DailyNutrition
from apps.workout.models import WorkoutResult
from django.utils import timezone

User = get_user_model()

def create_initial_data():
    print("🚀 초기 데이터 생성 시작...")
    
    # 1. 운동 카테고리 생성
    categories_data = [
        ('근력 운동', '근육 강화를 위한 운동', 'dumbbell'),
        ('유산소', '심폐 지구력 향상 운동', 'activity'),
        ('요가', '유연성과 정신 건강을 위한 운동', 'heart'),
        ('스트레칭', '유연성 향상과 부상 예방', 'trending-up'),
        ('HIIT', '고강도 인터벌 트레이닝', 'zap')
    ]
    
    categories = {}
    for name, desc, icon in categories_data:
        cat, created = WorkoutCategory.objects.get_or_create(
            name=name,
            defaults={'description': desc, 'icon': icon}
        )
        categories[name] = cat
        if created:
            print(f"✅ 운동 카테고리 생성: {name}")
    
    # 2. 운동 영상 데이터 생성
    workout_videos_data = [
        {
            'youtube_id': 'IODxDxX7oi4',
            'title': '초보자 푸시업 완벽 가이드',
            'description': '올바른 푸시업 자세와 단계별 운동법',
            'thumbnail_url': 'https://img.youtube.com/vi/IODxDxX7oi4/maxresdefault.jpg',
            'duration': 300,
            'category': '근력 운동',
            'difficulty': 'beginner',
            'target_muscles': ['가슴', '팔', '코어']
        },
        {
            'youtube_id': 'aclHkVaku9U',
            'title': '완벽한 스쿼트 자세 마스터하기',
            'description': '하체 운동의 기본, 스쿼트 완전 정복',
            'thumbnail_url': 'https://img.youtube.com/vi/aclHkVaku9U/maxresdefault.jpg',
            'duration': 420,
            'category': '근력 운동',
            'difficulty': 'beginner',
            'target_muscles': ['다리', '엉덩이', '코어']
        },
        {
            'youtube_id': 'ASdvN_XEl_c',
            'title': '10분 전신 요가 루틴',
            'description': '아침에 하기 좋은 전신 스트레칭 요가',
            'thumbnail_url': 'https://img.youtube.com/vi/ASdvN_XEl_c/maxresdefault.jpg',
            'duration': 600,
            'category': '요가',
            'difficulty': 'beginner',
            'target_muscles': ['전신']
        },
        {
            'youtube_id': 'ml6cT4AZdqI',
            'title': '20분 HIIT 전신 운동',
            'description': '집에서 하는 고강도 전신 운동',
            'thumbnail_url': 'https://img.youtube.com/vi/ml6cT4AZdqI/maxresdefault.jpg',
            'duration': 1200,
            'category': 'HIIT',
            'difficulty': 'intermediate',
            'target_muscles': ['전신']
        },
        {
            'youtube_id': 'yDMaOi23LBQ',
            'title': '5분 전신 스트레칭',
            'description': '운동 전후 필수 스트레칭 루틴',
            'thumbnail_url': 'https://img.youtube.com/vi/yDMaOi23LBQ/maxresdefault.jpg',
            'duration': 300,
            'category': '스트레칭',
            'difficulty': 'beginner',
            'target_muscles': ['전신']
        }
    ]
    
    for video_data in workout_videos_data:
        category = categories.get(video_data.pop('category'))
        if category:
            video, created = WorkoutVideo.objects.get_or_create(
                youtube_id=video_data['youtube_id'],
                defaults={
                    **video_data,
                    'category': category
                }
            )
            if created:
                print(f"✅ 운동 영상 생성: {video.title}")
    
    # 3. admin 사용자 데이터 생성
    try:
        admin_user = User.objects.get(username='admin')
        today = timezone.now().date()
        
        # 운동 추천
        workout_rec, created = DailyRecommendation.objects.get_or_create(
            user=admin_user,
            date=today,
            type='workout',
            defaults={
                'title': '오늘의 추천 운동: 전신 운동 루틴',
                'description': '초보자를 위한 20분 전신 운동 프로그램',
                'details': {
                    'exercises': [
                        {'name': '푸시업', 'sets': 3, 'reps': 10, 'rest': 60},
                        {'name': '스쿼트', 'sets': 3, 'reps': 15, 'rest': 60},
                        {'name': '플랭크', 'sets': 3, 'duration': 30, 'rest': 45}
                    ],
                    'total_time': 20,
                    'difficulty': 'beginner',
                    'tips': '각 운동 사이에는 충분한 휴식을 취하세요'
                },
                'reasoning': '운동을 처음 시작하는 사용자를 위한 기본 루틴',
                'based_on': {'user_level': 'beginner', 'goal': 'health_improvement'}
            }
        )
        if created:
            print("✅ 일일 운동 추천 생성")
        
        # 식단 추천
        diet_rec, created = DailyRecommendation.objects.get_or_create(
            user=admin_user,
            date=today,
            type='diet',
            defaults={
                'title': '오늘의 추천 식단: 균형잡힌 한식',
                'description': '단백질과 채소가 풍부한 건강한 한식 메뉴',
                'details': {
                    'breakfast': {
                        'menu': ['현미밥', '된장국', '계란찜', '시금치나물'],
                        'calories': 450,
                        'protein': 25,
                        'carbs': 60,
                        'fat': 12
                    },
                    'lunch': {
                        'menu': ['닭가슴살 샐러드', '고구마', '그릭요거트'],
                        'calories': 550,
                        'protein': 45,
                        'carbs': 50,
                        'fat': 15
                    },
                    'dinner': {
                        'menu': ['구운 연어', '브로콜리', '현미밥', '미역국'],
                        'calories': 600,
                        'protein': 40,
                        'carbs': 55,
                        'fat': 20
                    },
                    'snack': {
                        'menu': ['아몬드 10개', '사과 1개'],
                        'calories': 200,
                        'protein': 5,
                        'carbs': 25,
                        'fat': 10
                    },
                    'total_calories': 1800,
                    'total_protein': 115,
                    'total_carbs': 190,
                    'total_fat': 57,
                    'water': '2L 이상'
                },
                'reasoning': '균형 잡힌 영양소 섭취와 적절한 칼로리를 위한 식단',
                'based_on': {'goal': 'health_improvement', 'dietary_preference': 'balanced'}
            }
        )
        if created:
            print("✅ 일일 식단 추천 생성")
        
        # 일일 영양 기록 생성
        nutrition, created = DailyNutrition.objects.get_or_create(
            user=admin_user,
            date=today,
            defaults={
                'breakfast_calories': 450,
                'lunch_calories': 550,
                'dinner_calories': 600,
                'snack_calories': 200,
                'total_calories': 1800,
                'protein': 115,
                'carbohydrates': 190,
                'fat': 57,
                'fiber': 25,
                'water_intake': 2000
            }
        )
        if created:
            print("✅ 일일 영양 기록 생성")
        
        # 운동 기록 샘플 생성
        for i in range(7):
            date = today - timedelta(days=i)
            log, created = WorkoutLog.objects.get_or_create(
                user=admin_user,
                date=date,
                workout_name='홈트레이닝',
                defaults={
                    'duration': 30,
                    'calories_burned': 250,
                    'workout_type': 'home',
                    'notes': f'Day {7-i} 운동 완료!'
                }
            )
            if created:
                print(f"✅ 운동 기록 생성: {date}")
        
        # 운동 결과 샘플 생성
        result, created = WorkoutResult.objects.get_or_create(
            user=admin_user,
            exercise_name='푸시업',
            defaults={
                'exercise_type': 'strength',
                'duration': 300,
                'rep_count': 30,
                'average_score': 85.5,
                'total_frames': 150,
                'calories_burned': 40,
                'key_feedback': [
                    '팔꿈치 각도를 조금 더 벌려주세요',
                    '코어에 힘을 유지하세요',
                    '호흡을 일정하게 유지하세요'
                ],
                'muscle_groups': ['가슴', '삼두근', '코어'],
                'angle_scores': {
                    'elbow': 82,
                    'shoulder': 88,
                    'hip': 90
                }
            }
        )
        if created:
            print("✅ 운동 결과 샘플 생성")
            
    except User.DoesNotExist:
        print("⚠️ admin 사용자를 찾을 수 없습니다")
    
    print("\n✅ 초기 데이터 생성 완료!")

if __name__ == '__main__':
    create_initial_data()
