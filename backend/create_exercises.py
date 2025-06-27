import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthwise.settings')
django.setup()

from apps.pose_analysis.models import Exercise

# 운동 데이터 생성
exercises_data = [
    {
        'name': '스쿼트',
        'name_en': 'Squat',
        'description': '하체 근력 강화를 위한 기본 운동',
        'category': 'lower',
        'difficulty': 'beginner',
        'target_muscles': ['대퇴사두근', '둔근', '햄스트링'],
        'key_points': [
            '발을 어깨너비로 벌리고 서기',
            '무릎이 발끝을 넘지 않도록 주의',
            '허리를 곧게 펴고 시선은 정면',
            '엉덩이를 뒤로 빼면서 앉기'
        ],
        'icon': '🏋️'
    },
    {
        'name': '푸시업',
        'name_en': 'Push-up',
        'description': '상체 근력 강화를 위한 기본 운동',
        'category': 'upper',
        'difficulty': 'beginner',
        'target_muscles': ['가슴근', '삼두근', '전면삼각근'],
        'key_points': [
            '손은 어깨너비보다 약간 넓게',
            '머리부터 발끝까지 일직선 유지',
            '팔꿈치는 45도 각도로',
            '가슴이 바닥에 닿을 듯 말 듯'
        ],
        'icon': '💪'
    },
    {
        'name': '런지',
        'name_en': 'Lunge',
        'description': '하체 균형과 근력 강화 운동',
        'category': 'lower',
        'difficulty': 'intermediate',
        'target_muscles': ['대퇴사두근', '둔근', '종아리'],
        'key_points': [
            '한 발을 크게 앞으로 내딛기',
            '양 무릎이 90도가 되도록',
            '앞 무릎이 발끝을 넘지 않도록',
            '상체는 곧게 유지'
        ],
        'icon': '🦵'
    },
    {
        'name': '플랭크',
        'name_en': 'Plank',
        'description': '코어 근력 강화를 위한 정적 운동',
        'category': 'core',
        'difficulty': 'beginner',
        'target_muscles': ['복직근', '복사근', '척추기립근'],
        'key_points': [
            '팔꿈치는 어깨 바로 아래',
            '머리부터 발끝까지 일직선',
            '엉덩이가 너무 높거나 낮지 않게',
            '복부에 힘을 주고 유지'
        ],
        'icon': '🧘'
    },
    {
        'name': '버피',
        'name_en': 'Burpee',
        'description': '전신 유산소 및 근력 운동',
        'category': 'fullbody',
        'difficulty': 'advanced',
        'target_muscles': ['전신'],
        'key_points': [
            '서있는 자세에서 시작',
            '스쿼트 자세로 앉아 손을 바닥에',
            '다리를 뒤로 뻗어 플랭크 자세',
            '푸시업 후 다시 일어서기'
        ],
        'icon': '🤸'
    }
]

# 기존 데이터 삭제
Exercise.objects.all().delete()

# 새 데이터 생성
for data in exercises_data:
    exercise = Exercise.objects.create(**data)
    print(f"Created: {exercise.name}")

print(f"\nTotal exercises created: {Exercise.objects.count()}")
