// 운동 데이터 정의
import { Exercise } from './mediapipeUtils';

// Exercise 타입 재엑스포트
export type { Exercise };

// 상체 운동
const upperBodyExercises: Exercise[] = [
  {
    id: 1,
    name: '푸시업',
    nameEn: 'Push-up',
    category: 'upper',
    difficulty: 'beginner',
    description: '가슴, 어깨, 삼두근을 단련하는 기본 운동입니다.',
    targetMuscles: ['가슴', '어깨', '삼두근'],
    icon: '💪',
    angleCalculations: {
      elbow: {
        points: [11, 13, 15], // shoulder, elbow, wrist
        minAngle: 50,
        maxAngle: 170,
        feedback: '팔꿈치를 더 깊이 굽혀주세요'
      },
      shoulder: {
        points: [13, 11, 23], // elbow, shoulder, hip
        minAngle: 70,
        maxAngle: 110,
        feedback: '팔을 몸통에 더 가깝게 유지하세요'
      },
      hip: {
        points: [11, 23, 25], // shoulder, hip, knee
        minAngle: 165,
        maxAngle: 195,
        feedback: '몸통을 일직선으로 유지하세요'
      }
    },
    keyPoints: [
      '손은 어깨너비보다 약간 넓게 벌립니다',
      '머리부터 발끝까지 일직선을 유지합니다',
      '가슴이 바닥에 거의 닿을 때까지 내려갑니다',
      '팔꿈치는 몸통에서 45도 정도 벌립니다'
    ]
  },
  {
    id: 2,
    name: '바이셉 컬',
    nameEn: 'Bicep Curl',
    category: 'upper',
    difficulty: 'beginner',
    description: '이두근을 집중적으로 단련하는 운동입니다.',
    targetMuscles: ['이두근'],
    icon: '💪',
    angleCalculations: {
      elbow: {
        points: [11, 13, 15], // shoulder, elbow, wrist
        minAngle: 20,
        maxAngle: 160,
        feedback: '팔을 완전히 굽혀주세요'
      },
      shoulder: {
        points: [13, 11, 23], // elbow, shoulder, hip
        minAngle: 80,
        maxAngle: 100,
        feedback: '팔꿈치를 몸통에 고정하세요'
      }
    },
    keyPoints: [
      '팔꿈치를 몸통에 고정합니다',
      '천천히 올리고 내립니다',
      '최고점에서 잠시 멈춥니다',
      '손목을 곧게 유지합니다'
    ]
  }
];

// 하체 운동
const lowerBodyExercises: Exercise[] = [
  {
    id: 3,
    name: '스쿼트',
    nameEn: 'Squat',
    category: 'lower',
    difficulty: 'beginner',
    description: '하체 전체를 단련하는 기본 운동입니다.',
    targetMuscles: ['대퇴사두근', '둔근', '햄스트링'],
    icon: '🦵',
    angleCalculations: {
      knee: {
        points: [23, 25, 27], // hip, knee, ankle
        minAngle: 70,
        maxAngle: 170,
        feedback: '무릎을 더 굽혀주세요'
      },
      hip: {
        points: [11, 23, 25], // shoulder, hip, knee
        minAngle: 70,
        maxAngle: 170,
        feedback: '엉덩이를 더 뒤로 빼주세요'
      },
      back: {
        points: [11, 23, 25], // shoulder, hip, knee
        minAngle: 160,
        maxAngle: 190,
        feedback: '허리를 곧게 펴주세요'
      }
    },
    keyPoints: [
      '발은 어깨너비로 벌립니다',
      '무릎이 발끝을 넘지 않도록 합니다',
      '허벅지가 바닥과 평행할 때까지 내려갑니다',
      '체중은 발뒤꿈치에 실습니다'
    ]
  },
  {
    id: 4,
    name: '런지',
    nameEn: 'Lunge',
    category: 'lower',
    difficulty: 'intermediate',
    description: '하체 균형과 근력을 향상시키는 운동입니다.',
    targetMuscles: ['대퇴사두근', '둔근', '햄스트링'],
    icon: '🦵',
    angleCalculations: {
      frontKnee: {
        points: [23, 25, 27], // hip, knee, ankle (front leg)
        minAngle: 70,
        maxAngle: 110,
        feedback: '앞 무릎을 90도로 굽혀주세요'
      },
      backKnee: {
        points: [24, 26, 28], // hip, knee, ankle (back leg)
        minAngle: 70,
        maxAngle: 110,
        feedback: '뒤 무릎을 더 굽혀주세요'
      },
      hip: {
        points: [11, 23, 25], // shoulder, hip, knee
        minAngle: 160,
        maxAngle: 190,
        feedback: '상체를 곧게 세워주세요'
      }
    },
    keyPoints: [
      '앞 무릎은 90도로 굽힙니다',
      '뒤 무릎도 90도로 굽혀 바닥에 거의 닿게 합니다',
      '상체는 곧게 세웁니다',
      '체중은 앞발 뒤꿈치에 실습니다'
    ]
  }
];

// 코어 운동
const coreExercises: Exercise[] = [
  {
    id: 5,
    name: '플랭크',
    nameEn: 'Plank',
    category: 'core',
    difficulty: 'beginner',
    description: '코어 전체를 강화하는 정적 운동입니다.',
    targetMuscles: ['복근', '코어'],
    icon: '🧘',
    angleCalculations: {
      hip: {
        points: [11, 23, 25], // shoulder, hip, knee
        minAngle: 165,
        maxAngle: 195,
        feedback: '엉덩이를 일직선으로 유지하세요'
      },
      shoulder: {
        points: [13, 11, 23], // elbow, shoulder, hip
        minAngle: 80,
        maxAngle: 100,
        feedback: '팔꿈치는 어깨 바로 아래에 위치시키세요'
      }
    },
    keyPoints: [
      '팔꿈치는 어깨 바로 아래에 위치시킵니다',
      '머리부터 발끝까지 일직선을 유지합니다',
      '복부에 힘을 주어 허리를 보호합니다',
      '호흡을 일정하게 유지합니다'
    ]
  }
];

// 전신 운동
const fullBodyExercises: Exercise[] = [
  {
    id: 6,
    name: '버피',
    nameEn: 'Burpee',
    category: 'fullbody',
    difficulty: 'advanced',
    description: '전신을 사용하는 고강도 운동입니다.',
    targetMuscles: ['전신'],
    icon: '🔥',
    angleCalculations: {
      knee: {
        points: [23, 25, 27], // hip, knee, ankle
        minAngle: 70,
        maxAngle: 170,
        feedback: '스쿼트 자세에서 무릎을 더 굽혀주세요'
      },
      hip: {
        points: [11, 23, 25], // shoulder, hip, knee
        minAngle: 70,
        maxAngle: 190,
        feedback: '플랭크 자세에서 몸을 일직선으로 유지하세요'
      }
    },
    keyPoints: [
      '스쿼트 자세로 시작합니다',
      '손을 바닥에 대고 다리를 뒤로 뻗어 플랭크 자세를 만듭니다',
      '푸쉬업을 한 번 합니다',
      '다시 스쿼트 자세로 돌아와 점프합니다'
    ]
  }
];

// 모든 운동 목록
export const allExercises: Exercise[] = [
  ...upperBodyExercises,
  ...lowerBodyExercises,
  ...coreExercises,
  ...fullBodyExercises
];

// 카테고리별 운동 가져오기
export function getExercisesByCategory(category: string): Exercise[] {
  if (category === 'all') return allExercises;
  return allExercises.filter(exercise => exercise.category === category);
}

// 운동 카테고리 정의
export const exerciseCategories = [
  { id: 'all', name: '전체', icon: '🏋️' },
  { id: 'upper', name: '상체', icon: '💪' },
  { id: 'lower', name: '하체', icon: '🦵' },
  { id: 'core', name: '코어', icon: '🧘' },
  { id: 'fullbody', name: '전신', icon: '🔥' }
];

// ID로 운동 찾기
export function getExerciseById(id: number): Exercise | undefined {
  return allExercises.find(exercise => exercise.id === id);
}

// 난이도별 운동 가져오기
export function getExercisesByDifficulty(difficulty: string): Exercise[] {
  return allExercises.filter(exercise => exercise.difficulty === difficulty);
}
