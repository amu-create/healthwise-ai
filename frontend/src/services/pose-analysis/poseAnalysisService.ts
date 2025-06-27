// Pose Analysis API Service
import api from '../api';

// 운동 목록 가져오기
export const getExercises = async () => {
  try {
    const response = await api.get('/pose-analysis/exercises/');
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
};

// 카테고리별 운동 목록
export const getExercisesByCategory = async (category?: string) => {
  try {
    const url = category 
      ? `/pose-analysis/exercises/by_category/?category=${category}`
      : `/pose-analysis/exercises/by_category/`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises by category:', error);
    throw error;
  }
};

// 운동 추천 받기
export const getExerciseRecommendations = async () => {
  try {
    const response = await api.get('/pose-analysis/exercises/recommendations/');
    return response.data;
  } catch (error) {
    console.error('Error fetching exercise recommendations:', error);
    throw error;
  }
};

// 분석 세션 생성
export const createAnalysisSession = async (exerciseId: number, mode: 'realtime' | 'upload', videoFile?: File) => {
  try {
    // 실시간 분석의 경우 JSON으로 전송
    if (mode === 'realtime') {
      const requestData = {
        exercise: exerciseId,  // Django는 ID를 받아서 자동으로 객체로 변환함
        mode: mode
      };
      console.log('Creating analysis session with data:', requestData);
      console.log('Exercise ID type:', typeof exerciseId);
      console.log('Request data JSON:', JSON.stringify(requestData));
      
      const response = await api.post(
        '/pose-analysis/sessions/', 
        requestData
      );
      return response.data;
    } else {
      // 비디오 업로드의 경우 FormData 사용
      const formData = new FormData();
      formData.append('exercise', exerciseId.toString());
      formData.append('mode', mode);
      
      if (videoFile) {
        formData.append('video_file', videoFile);
      }
      
      const response = await api.post('/pose-analysis/sessions/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error creating analysis session:', error);
    throw error;
  }
};

// 실시간 프레임 분석
export const analyzeFrame = async (sessionId: number, landmarks: any[], timestamp: number, frameIndex: number) => {
  try {
    const response = await api.post(
      `/pose-analysis/sessions/${sessionId}/analyze_frame/`,
      {
        session_id: sessionId,
        landmarks,
        timestamp,
        frame_index: frameIndex
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error analyzing frame:', error);
    throw error;
  }
};

// 세션 완료
export const completeSession = async (sessionId: number) => {
  try {
    const response = await api.post(
      `/pose-analysis/sessions/${sessionId}/complete/`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
};

// 비디오 분석
export const analyzeVideo = async (videoFile: File, exerciseId: number) => {
  try {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('exercise_id', exerciseId.toString());
    
    const response = await api.post(
      '/pose-analysis/sessions/analyze_video/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error analyzing video:', error);
    throw error;
  }
};

// 사용자 운동 통계 가져오기
export const getUserExerciseStats = async () => {
  try {
    const response = await api.get('/pose-analysis/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user exercise stats:', error);
    throw error;
  }
};

// 운동 통계 요약
export const getUserExerciseSummary = async () => {
  try {
    const response = await api.get('/pose-analysis/stats/summary/');
    return response.data;
  } catch (error) {
    console.error('Error fetching exercise summary:', error);
    throw error;
  }
};

// 분석 세션 목록 가져오기
export const getAnalysisSessions = async () => {
  try {
    const response = await api.get('/pose-analysis/sessions/');
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis sessions:', error);
    throw error;
  }
};

// 특정 세션 상세 정보
export const getSessionDetail = async (sessionId: number) => {
  try {
    const response = await api.get(`/pose-analysis/sessions/${sessionId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session detail:', error);
    throw error;
  }
};
