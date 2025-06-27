// MediaPipe 포즈 분석 유틸리티
declare global {
  interface Window {
    Pose: any;
  }
}

const Pose = window.Pose;

// MediaPipe POSE_CONNECTIONS 정의
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [11, 23],
  [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29],
  [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface AngleConfig {
  points: number[];
  minAngle: number;
  maxAngle: number;
  feedback?: string;
}

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  difficulty: string;
  description: string;
  targetMuscles: string[];
  angleCalculations: Record<string, AngleConfig>;
  keyPoints: string[];
  icon: string;
}

export interface AnalysisResult {
  angles: Record<string, number>;
  scores: Record<string, number>;
  overallScore: number;
  feedback: string[];
  corrections: any[];
  isInPosition: boolean;
}

// 각도 계산 함수
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * 180.0 / Math.PI);
  
  if (degrees > 180.0) {
    degrees = 360 - degrees;
  }
  
  return degrees;
}

// 좌표 정규화
export function normalizeCoordinates(landmarks: Landmark[], width: number, height: number): Landmark[] {
  return landmarks.map(landmark => ({
    ...landmark,
    x: landmark.x * width,
    y: landmark.y * height,
    z: landmark.z * width
  }));
}

// 포즈 분석 함수
export function analyzePose(landmarks: Landmark[], exercise: Exercise): AnalysisResult {
  const angles: Record<string, number> = {};
  const scores: Record<string, number> = {};
  const feedback: string[] = [];
  const corrections: any[] = [];
  let isInPosition = true;

  // exercise 객체 검증
  if (!exercise) {
    console.error('No exercise provided for analysis');
    return {
      angles: {},
      scores: {},
      overallScore: 0,
      feedback: ['운동이 선택되지 않았습니다.'],
      corrections: [],
      isInPosition: false
    };
  }

  // angleCalculations이 없으면 기본값 사용
  if (!exercise.angleCalculations || typeof exercise.angleCalculations !== 'object' || Object.keys(exercise.angleCalculations).length === 0) {
    console.warn('No angle calculations defined for exercise:', exercise.name);
    return {
      angles: {},
      scores: {},
      overallScore: 0,
      feedback: ['각도 계산 설정이 없습니다.'],
      corrections: [],
      isInPosition: false
    };
  }

  // 각 관절의 각도 계산
  Object.entries(exercise.angleCalculations).forEach(([angleName, config]) => {
    const [startIdx, centerIdx, endIdx] = config.points;
    
    if (startIdx < landmarks.length && centerIdx < landmarks.length && endIdx < landmarks.length) {
      const angle = calculateAngle(
        landmarks[startIdx],
        landmarks[centerIdx],
        landmarks[endIdx]
      );
      
      angles[angleName] = angle;
      
      // 점수 계산
      const score = calculateScore(angle, config.minAngle, config.maxAngle);
      scores[angleName] = score;
      
      if (score < 60) {
        isInPosition = false;
        corrections.push({
          joint: angleName,
          current: angle,
          target: [config.minAngle, config.maxAngle],
          message: config.feedback || `${angleName} 각도를 조정하세요`
        });
      }
    }
  });

  // 운동별 상세 피드백 생성
  if (exercise.id) {
    const detailedFeedback = generateDetailedFeedback(exercise.id, angles);
    feedback.push(...detailedFeedback);
  }

  // 전체 점수 계산
  const scoreValues = Object.values(scores);
  let overallScore = 0;
  
  if (scoreValues.length > 0) {
    if (scoreValues.every(s => s === 100)) {
      overallScore = 100;
    } else {
      const avgScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
      overallScore = Math.min(95, avgScore);
    }
  }

  return {
    angles,
    scores,
    feedback,
    corrections,
    overallScore,
    isInPosition
  };
}

// 점수 계산 함수
function calculateScore(angle: number, minAngle: number, maxAngle: number): number {
  const perfectMin = (minAngle + maxAngle) / 2 - 5;
  const perfectMax = (minAngle + maxAngle) / 2 + 5;
  
  if (angle >= perfectMin && angle <= perfectMax) {
    return 100;
  } else if (angle >= minAngle && angle <= maxAngle) {
    const deviation = Math.min(
      Math.abs(angle - perfectMin),
      Math.abs(angle - perfectMax)
    );
    return Math.max(70, 90 - deviation);
  } else {
    const deviation = Math.min(
      Math.abs(angle - minAngle),
      Math.abs(angle - maxAngle)
    );
    return Math.max(0, 70 - deviation * 2);
  }
}

// 운동별 상세 피드백 생성
function generateDetailedFeedback(exerciseId: string, angles: Record<string, number>): string[] {
  const feedback: string[] = [];
  
  switch (exerciseId) {
    case 'squat':
      const kneeAngle = angles.knee || 180;
      const hipAngle = angles.hip || 180;
      
      if (kneeAngle < 70) {
        feedback.push('🔴 무릎이 너무 깊이 굽혀졌습니다. 90도 정도까지만 내려가세요.');
      } else if (kneeAngle > 110 && kneeAngle < 160) {
        feedback.push('⚠️ 더 깊이 앉아주세요. 허벅지가 바닥과 평행할 때까지 내려가세요.');
      } else if (kneeAngle >= 80 && kneeAngle <= 100) {
        feedback.push('✅ 완벽한 스쿼트 깊이입니다!');
      }
      
      if (hipAngle < 80) {
        feedback.push('🔴 엉덩이를 더 뒤로 빼면서 앉아주세요.');
      }
      break;
      
    case 'pushup':
      const elbowAngle = angles.elbow || 180;
      
      if (elbowAngle > 100 && elbowAngle < 170) {
        feedback.push('⚠️ 더 깊이 내려가세요. 가슴이 바닥에 거의 닿을 때까지 내려가세요.');
      } else if (elbowAngle >= 60 && elbowAngle <= 90) {
        feedback.push('✅ 좋은 깊이입니다! 이 정도를 유지하세요.');
      }
      break;
      
    case 'lunge':
      const frontKneeAngle = angles.frontKnee || 180;
      
      if (frontKneeAngle < 70) {
        feedback.push('🔴 앞 무릎이 너무 깊이 굽혀졌습니다.');
      } else if (frontKneeAngle > 110 && frontKneeAngle < 160) {
        feedback.push('⚠️ 더 깊이 내려가세요.');
      } else if (frontKneeAngle >= 80 && frontKneeAngle <= 100) {
        feedback.push('✅ 좋은 런지 깊이입니다!');
      }
      break;
      
    case 'plank':
      const backAngle = angles.back || 180;
      const shoulderAngle = angles.shoulder || 90;
      
      if (backAngle < 160) {
        feedback.push('🔴 허리가 너무 굽어있습니다. 몸을 일직선으로 유지하세요.');
      } else if (backAngle > 185) {
        feedback.push('🔴 엉덩이가 너무 높습니다. 몸을 일직선으로 유지하세요.');
      } else if (backAngle >= 170 && backAngle <= 180) {
        feedback.push('✅ 완벽한 플랭크 자세입니다!');
      }
      
      if (shoulderAngle < 80) {
        feedback.push('⚠️ 팔꿈치를 더 펴고 어깨 아래에 위치시키세요.');
      }
      break;
      
    case 'burpee':
      const standingAngle = angles.standing || 180;
      
      if (standingAngle >= 170) {
        feedback.push('✅ 좋은 서있는 자세입니다!');
      } else if (standingAngle < 170) {
        feedback.push('⚠️ 완전히 일어서세요.');
      }
      break;
  }
  
  return feedback;
}

// MediaPipe 포즈 초기화
export async function initializePose() {
  if (!window.Pose) {
    throw new Error('MediaPipe Pose not loaded');
  }
  
  const pose = new window.Pose({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });
  
  await pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  return pose;
}

// 포즈 그리기 함수
export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: any = POSE_CONNECTIONS
) {
  if (!landmarks || landmarks.length === 0) {
    console.warn('No landmarks to draw');
    return;
  }
  
  // 연결선 그리기
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  
  if (connections && Array.isArray(connections)) {
    connections.forEach(([start, end]: [number, number]) => {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x, landmarks[start].y);
        ctx.lineTo(landmarks[end].x, landmarks[end].y);
        ctx.stroke();
      }
    });
  }
  
  // 랜드마크 점 그리기
  ctx.fillStyle = '#FF0000';
  landmarks.forEach((landmark) => {
    if (landmark) {
      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

// 이동 평균 필터 (노이즈 제거용)
export class MovingAverageFilter {
  private values: number[] = [];
  
  constructor(private windowSize: number = 5) {}
  
  filter(value: number): number {
    this.values.push(value);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
    
    const sum = this.values.reduce((a, b) => a + b, 0);
    return sum / this.values.length;
  }
  
  reset(): void {
    this.values = [];
  }
}

// 각도 추적기 (패턴 분석용)
export class AngleTracker {
  private history: Map<string, number[]> = new Map();
  private maxHistory: number = 300; // 10초 분량 (30fps 기준)
  
  track(jointName: string, angle: number): void {
    if (!this.history.has(jointName)) {
      this.history.set(jointName, []);
    }
    
    const angles = this.history.get(jointName)!;
    angles.push(angle);
    
    if (angles.length > this.maxHistory) {
      angles.shift();
    }
  }
  
  getHistory(jointName: string): number[] {
    return this.history.get(jointName) || [];
  }
  
  getPattern(jointName: string): { peaks: number[], valleys: number[] } {
    const angles = this.getHistory(jointName);
    const peaks: number[] = [];
    const valleys: number[] = [];
    
    for (let i = 1; i < angles.length - 1; i++) {
      if (angles[i] > angles[i - 1] && angles[i] > angles[i + 1]) {
        peaks.push(i);
      } else if (angles[i] < angles[i - 1] && angles[i] < angles[i + 1]) {
        valleys.push(i);
      }
    }
    
    return { peaks, valleys };
  }
  
  clear(): void {
    this.history.clear();
  }
}

export { POSE_CONNECTIONS };
