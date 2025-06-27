import api from '../api';

export interface WorkoutResultData {
  exercise_name: string;
  exercise_type: string;
  duration: number; // seconds
  rep_count: number;
  average_score: number;
  total_frames: number;
  calories_burned?: number;
  key_feedback: string[];
  muscle_groups: string[];
  video_url?: string;
  thumbnail_url?: string;
}

export interface ShareToSocialData {
  content: string;
  workout_result_id: number;
  visibility?: 'public' | 'friends' | 'private';
  tags?: string[];
}

// 운동 결과 저장
export const saveWorkoutResult = async (data: WorkoutResultData) => {
  try {
    const response = await api.post('/workout-results/', data);
    return response.data;
  } catch (error) {
    console.error('Error saving workout result:', error);
    throw error;
  }
};

// 소셜 피드에 공유
export const shareToSocialFeed = async (data: ShareToSocialData) => {
  try {
    const response = await api.post('/social-posts/', data);
    return response.data;
  } catch (error) {
    console.error('Error sharing to social feed:', error);
    throw error;
  }
};

// 운동 결과 조회
export const getWorkoutResults = async (userId?: number, limit: number = 10) => {
  try {
    const params = userId ? { user_id: userId, limit } : { limit };
    const response = await api.get('/workout-results/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching workout results:', error);
    throw error;
  }
};

// 운동 결과 상세 조회
export const getWorkoutResultDetail = async (resultId: number) => {
  try {
    const response = await api.get(`/workout-results/${resultId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching workout result detail:', error);
    throw error;
  }
};

// 칼로리 계산 (간단한 추정)
export const calculateCaloriesBurned = (exerciseName: string, duration: number, repCount: number): number => {
  // MET (Metabolic Equivalent of Task) 값 기반 간단한 계산
  const metValues: { [key: string]: number } = {
    '푸시업': 8.0,
    '스쿼트': 5.0,
    '플랭크': 3.0,
    '런지': 6.0,
    '버피': 10.0,
    '마운틴 클라이머': 8.0,
    '점핑잭': 8.0,
    '사이드 플랭크': 3.0,
    'default': 5.0
  };

  const met = metValues[exerciseName] || metValues.default;
  const weightKg = 70; // 평균 체중 가정
  const hours = duration / 3600;
  
  // 칼로리 = MET × 체중(kg) × 시간(hours)
  const calories = Math.round(met * weightKg * hours);
  
  return calories;
};

// 운동 분석 결과 포맷팅
export const formatWorkoutAnalysis = (
  frames: any[],
  exercise: any,
  duration: number,
  averageScore: number,
  repCount: number
): WorkoutResultData => {
  // 주요 피드백 수집
  const feedbackCounts: Record<string, number> = {};
  frames.forEach(frame => {
    frame.feedback?.forEach((fb: string) => {
      feedbackCounts[fb] = (feedbackCounts[fb] || 0) + 1;
    });
  });

  const keyFeedback = Object.entries(feedbackCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([feedback]) => feedback);

  const caloriesBurned = calculateCaloriesBurned(exercise.name, duration, repCount);

  return {
    exercise_name: exercise.name,
    exercise_type: exercise.category || 'general',
    duration: Math.round(duration),
    rep_count: repCount,
    average_score: Math.round(averageScore),
    total_frames: frames.length,
    calories_burned: caloriesBurned,
    key_feedback: keyFeedback,
    muscle_groups: exercise.targetMuscles || exercise.target_muscles || [],
  };
};

// 소셜 공유 메시지 생성
export const generateShareMessage = (
  exercise: any,
  averageScore: number,
  repCount: number,
  duration: number,
  caloriesBurned: number
): string => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}분 ${secs}초`;
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 60) return '🥉';
    return '💪';
  };

  const scoreEmoji = getScoreEmoji(averageScore);
  const time = formatTime(duration);

  return `${scoreEmoji} ${exercise.name} 운동 완료!\n\n` +
    `⏱️ 운동 시간: ${time}\n` +
    `🎯 평균 점수: ${Math.round(averageScore)}점\n` +
    `🔥 소모 칼로리: ${caloriesBurned}kcal\n` +
    `💪 반복 횟수: ${repCount}회\n\n` +
    `#헬스와이즈 #운동완료 #${exercise.name} #AI운동분석`;
};

// 업적 업데이트 체크
export const checkAchievementUpdate = async (workoutResultId: number) => {
  try {
    const response = await api.post(`/workout-results/${workoutResultId}/check-achievements/`);
    return response.data;
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
};
