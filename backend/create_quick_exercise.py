# 빠른 해결을 위한 간단한 스크립트
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthwise.settings')
django.setup()

from apps.pose_analysis.models import Exercise

# 스쿼트만 먼저 생성
exercise, created = Exercise.objects.get_or_create(
    id=1,
    defaults={
        'name': '스쿼트',
        'name_en': 'Squat',
        'category': 'lower',  # 모델에 정의된 choices에 맞춤
        'difficulty': 'beginner',
        'description': '하체 근력 운동의 기본이 되는 운동입니다.',
        'target_muscles': ['대퇴사두근', '둔근', '햄스트링'],
        'angle_calculations': {
            'hip_knee_ankle': {
                'points': ['LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'],
                'ideal_angle': 90,
                'tolerance': 15
            },
            'knee_alignment': {
                'points': ['LEFT_HIP', 'LEFT_KNEE', 'LEFT_FOOT_INDEX'],
                'ideal_angle': 180,
                'tolerance': 10
            }
        },
        'key_points': [
            '발을 어깨 너비로 벌리고 섭니다',
            '가슴을 펴고 시선은 정면을 봅니다',
            '엉덩이를 뒤로 빼면서 천천히 앉습니다',
            '허벅지가 바닥과 평행할 때까지 내려갑니다',
            '발뒤꿈치로 바닥을 밀며 일어섭니다'
        ],
        'icon': '🏋️',
        'is_active': True
    }
)

if created:
    print(f"Created exercise: {exercise.name} with ID: {exercise.id}")
else:
    print(f"Exercise already exists: {exercise.name} with ID: {exercise.id}")
