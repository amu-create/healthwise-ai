// 비디오 분석 완료 상태 추적
export interface VideoAnalysisState {
  isComplete: boolean;
  frameCount: number;
  duration: number;
}

export const createVideoAnalysisTracker = () => {
  let state: VideoAnalysisState = {
    isComplete: false,
    frameCount: 0,
    duration: 0
  };

  return {
    reset: () => {
      state = {
        isComplete: false,
        frameCount: 0,
        duration: 0
      };
    },
    
    incrementFrame: () => {
      state.frameCount++;
    },
    
    complete: (duration: number) => {
      state.isComplete = true;
      state.duration = duration;
    },
    
    isComplete: () => state.isComplete,
    getState: () => ({ ...state })
  };
};
