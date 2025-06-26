import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Exercise, 
  analyzePose, 
  initializePose, 
  drawPose, 
  POSE_CONNECTIONS,
  normalizeCoordinates,
  AngleTracker
} from '../../services/pose-analysis/mediapipeUtils';
import { analyzeFrame, createAnalysisSession, completeSession } from '../../services/pose-analysis/poseAnalysisService';

// MediaPipe types
interface Results {
  poseLandmarks: any;
  image: HTMLVideoElement | HTMLCanvasElement;
}

// Window에서 MediaPipe 가져오기
declare global {
  interface Window {
    Camera: any;
    Pose: any;
  }
}

const Camera = window.Camera;

interface UseMediaPipeProps {
  exercise: Exercise;
  onResults?: (result: any) => void;
  mode?: 'realtime' | 'upload';
}

export const useMediaPipe = ({ exercise, onResults, mode = 'realtime' }: UseMediaPipeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);  // MediaPipe Pose 인스턴스
  const cameraRef = useRef<any>(null);  // MediaPipe Camera 인스턴스
  const angleTrackerRef = useRef<AngleTracker>(new AngleTracker());
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  
  // MediaPipe 결과 처리
  const onPoseResults = useCallback(async (results: Results) => {
    if (!canvasRef.current || !results.poseLandmarks) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 크기 설정
    canvas.width = results.image.width;
    canvas.height = results.image.height;
    
    // 이미지 그리기
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    // 랜드마크 정규화
    const normalizedLandmarks = normalizeCoordinates(
      results.poseLandmarks,
      canvas.width,
      canvas.height
    );
    
    // 포즈 그리기
    drawPose(ctx, normalizedLandmarks, POSE_CONNECTIONS);
    
    // 포즈 분석
    const analysis = analyzePose(normalizedLandmarks, exercise);
    setAnalysisResult(analysis);
    
    // 각도 추적
    Object.entries(analysis.angles).forEach(([joint, angle]) => {
      angleTrackerRef.current.track(joint, angle);
    });
    
    // 반복 횟수 계산 (간단한 패턴 인식)
    if (exercise && exercise.angleCalculations && Object.keys(exercise.angleCalculations).length > 0) {
      const mainJoint = Object.keys(exercise.angleCalculations)[0];
      const pattern = angleTrackerRef.current.getPattern(mainJoint);
      setRepCount(Math.floor(pattern.valleys.length / 2));
    }
    
    // 피드백 표시
    if (analysis.feedback.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 400, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      analysis.feedback.slice(0, 3).forEach((feedback, idx) => {
        ctx.fillText(feedback, 20, 35 + idx * 25);
      });
    }
    
    // 점수 표시
    ctx.fillStyle = analysis.overallScore >= 80 ? '#00FF00' : 
                    analysis.overallScore >= 60 ? '#FFFF00' : '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(`${Math.round(analysis.overallScore)}점`, canvas.width - 150, 60);
    
    ctx.restore();
    
    // 콜백 호출
    if (onResults) {
      onResults(analysis);
    }
    
    // 서버에 프레임 데이터 전송 (실시간 모드일 때만)
    if (mode === 'realtime' && sessionId && isAnalyzing) {
      try {
        const currentTime = (Date.now() - startTime) / 1000;
        await analyzeFrame(
          sessionId,
          results.poseLandmarks,
          currentTime,
          frameIndex
        );
        setFrameIndex(prev => prev + 1);
      } catch (error) {
        console.error('Error sending frame data:', error);
      }
    }
  }, [exercise, onResults, mode, sessionId, isAnalyzing, frameIndex, startTime]);
  
  // MediaPipe 초기화
  const initializeMediaPipe = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // MediaPipe가 로드될 때까지 기다리기
    let attempts = 0;
    while (!window.Pose && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!window.Pose) {
      console.error('MediaPipe Pose not loaded');
      return;
    }
    
    try {
      // Pose 초기화
      const pose = await initializePose();
      pose.onResults(onPoseResults);
      poseRef.current = pose;
      
      // 실시간 모드일 때 카메라 초기화
      if (mode === 'realtime' && window.Camera) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });
        cameraRef.current = camera;
      } else if (mode === 'realtime') {
        console.error('MediaPipe Camera not loaded');
      }
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
    }
  }, [onPoseResults, mode]);
  
  // 분석 시작
  const startAnalysis = useCallback(async () => {
    try {
      // 세션 생성
      console.log('Starting analysis with exercise:', exercise);
      console.log('Exercise object:', JSON.stringify(exercise, null, 2));
      const exerciseId = typeof exercise.id === 'string' ? parseInt(exercise.id) : exercise.id;
      console.log('Exercise ID for session:', exerciseId, 'Type:', typeof exerciseId);
      
      if (!exerciseId || isNaN(exerciseId)) {
        console.error('Invalid exercise ID:', exerciseId);
        throw new Error('Invalid exercise ID');
      }
      
      const session = await createAnalysisSession(
        exerciseId, 
        mode
      );
      setSessionId(session.id);
      setStartTime(Date.now());
      setFrameIndex(0);
      angleTrackerRef.current.clear();
      
      setIsAnalyzing(true);
      
      // 실시간 모드일 때 카메라 시작
      if (mode === 'realtime' && cameraRef.current) {
        await cameraRef.current.start();
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
    }
  }, [exercise, mode]);
  
  // 분석 중지
  const stopAnalysis = useCallback(async () => {
    setIsAnalyzing(false);
    
    // 카메라 중지
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    
    // 세션 완료 처리
    if (sessionId) {
      try {
        await completeSession(sessionId);
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
  }, [sessionId]);
  
  // 비디오 파일 분석
  const analyzeVideoFile = useCallback(async (file: File) => {
    if (!videoRef.current || !poseRef.current) return;
    
    const video = videoRef.current;
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      video.play();
    };
    
    video.onplay = () => {
      const processFrame = async () => {
        if (video.paused || video.ended) return;
        
        if (poseRef.current) {
          await poseRef.current.send({ image: video });
        }
        
        requestAnimationFrame(processFrame);
      };
      
      processFrame();
    };
  }, []);
  
  // 초기화
  useEffect(() => {
    initializeMediaPipe();
    
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, [initializeMediaPipe]);
  
  return {
    videoRef,
    canvasRef,
    isAnalyzing,
    analysisResult,
    repCount,
    startAnalysis,
    stopAnalysis,
    analyzeVideoFile
  };
};
