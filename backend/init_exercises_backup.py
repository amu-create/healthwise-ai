from apps.pose_analysis.models import Exercise

# 스쿼트 추가
Exercise.objects.create(
    name='스쿼트',
    name_en='Squat',
    category='lower',
    difficulty='beginner',
    description='하체 전체를 단련하는 기본 운동입니다.',
    target_muscles=['대퇴사두근', '둔근', '햄스트링'],
    angle_calculations={
        'knee': {
            'points': [23, 25, 27],
            'minAngle': 70,
            'maxAngle': 170,
            'feedback': '무릎을 더 굽혀주세요'
        },
        'hip': {
            'points': [11, 23, 25],
            'minAngle': 70,
            'maxAngle': 170,
            'feedback': '엉덩이를 더 뒤로 빼주세요'
        }
    },
    key_points=[
        '발은 어깨너비로 벌립니다',
        '무릎이 발끝을 넘지 않도록 합니다',
        '허벅지가 바닥과 평행할 때까지 내려갑니다',
        '체중은 발뒤꿈치에 실습니다'
    ],
    icon='🦵'
)

# 푸쉬업 추가
Exercise.objects.create(
    name='푸쉬업',
    name_en='Push-up',
    category='upper',
    difficulty='beginner',
    description='가슴, 어깨, 삼두근을 단련하는 기본 운동입니다.',
    target_muscles=['가슴', '어깨', '삼두근'],
    angle_calculations={
        'elbow': {
            'points': [11, 13, 15],
            'minAngle': 50,
            'maxAngle': 170,
            'feedback': '팔꿈치를 더 깊이 굽혀주세요'
        },
        'shoulder': {
            'points': [13, 11, 23],
            'minAngle': 70,
            'maxAngle': 110,
            'feedback': '팔을 몸통에 더 가깝게 유지하세요'
        }
    },
    key_points=[
        '손은 어깨너비보다 약간 넓게 벌립니다',
        '머리부터 발끝까지 일직선을 유지합니다',
        '가슴이 바닥에 거의 닿을 때까지 내려갑니다',
        '팔꿈치는 몸통에서 45도 정도 벌립니다'
    ],
    icon='💪'
)

# 플랭크 추가
Exercise.objects.create(
    name='플랭크',
    name_en='Plank',
    category='core',
    difficulty='beginner',
    description='코어 전체를 강화하는 정적 운동입니다.',
    target_muscles=['복직근', '외복사근', '내복사근', '횡복근'],
    angle_calculations={
        'spine': {
            'points': [11, 23, 25],
            'minAngle': 160,
            'maxAngle': 180,
            'feedback': '허리가 처지지 않도록 유지하세요'
        },
        'elbow': {
            'points': [13, 11, 23],
            'minAngle': 85,
            'maxAngle': 95,
            'feedback': '팔꿈치를 어깨 아래에 유지하세요'
        }
    },
    key_points=[
        '팔꿈치는 어깨 바로 아래 위치합니다',
        '머리부터 발끝까지 일직선을 유지합니다',
        '복부에 힘을 주어 허리가 처지지 않게 합니다',
        '호흡은 자연스럽게 유지합니다'
    ],
    icon='🏋️'
)

# 런지 추가
Exercise.objects.create(
    name='런지',
    name_en='Lunge',
    category='lower',
    difficulty='intermediate',
    description='하체 근력과 균형감각을 향상시키는 운동입니다.',
    target_muscles=['대퇴사두근', '둔근', '햄스트링', '종아리'],
    angle_calculations={
        'front_knee': {
            'points': [23, 25, 27],
            'minAngle': 85,
            'maxAngle': 95,
            'feedback': '앞 무릎을 90도로 굽혀주세요'
        },
        'back_knee': {
            'points': [24, 26, 28],
            'minAngle': 85,
            'maxAngle': 95,
            'feedback': '뒤 무릎도 90도로 굽혀주세요'
        }
    },
    key_points=[
        '앞 무릎이 발끝을 넘지 않도록 합니다',
        '상체는 곧게 세웁니다',
        '양 무릎이 90도가 되도록 내려갑니다',
        '균형을 유지하며 천천히 움직입니다'
    ],
    icon='🚶'
)

# 버피 추가
Exercise.objects.create(
    name='버피',
    name_en='Burpee',
    category='fullbody',
    difficulty='advanced',
    description='전신을 사용하는 고강도 유산소 운동입니다.',
    target_muscles=['전신'],
    angle_calculations={
        'squat_phase': {
            'points': [23, 25, 27],
            'minAngle': 70,
            'maxAngle': 170,
            'feedback': '스쿼트 자세를 정확히 취하세요'
        },
        'plank_phase': {
            'points': [11, 23, 25],
            'minAngle': 160,
            'maxAngle': 180,
            'feedback': '플랭크 자세에서 일직선을 유지하세요'
        }
    },
    key_points=[
        '스쿼트 자세로 시작합니다',
        '손을 바닥에 짚고 다리를 뒤로 뻗어 플랭크 자세를 취합니다',
        '푸쉬업을 한 번 합니다',
        '다리를 다시 당겨 점프하며 일어섭니다'
    ],
    icon='🔥'
)

print("운동 데이터 초기화 완료!")
print(f"총 {Exercise.objects.count()}개의 운동이 추가되었습니다.")
