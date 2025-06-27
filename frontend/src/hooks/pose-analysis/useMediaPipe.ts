import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Exercise, 
  analyzePose, 
  initializePose, 
  drawPose, 
  POSE_CONNECTIONS,
  normalizeCoordinates,
  AngleTracker,
  cleanupPose
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
  onVideoEnd?: () => void;
}

export const useMediaPipe = ({ exercise, onResults, mode = 'realtime', onVideoEnd }: UseMediaPipeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);  // MediaPipe Pose 인스턴스
  const cameraRef = useRef<any>(null);  // MediaPipe Camera 인스턴스
  const angleTrackerRef = useRef<AngleTracker>(new AngleTracker());
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const processingRef = useRef<boolean>(false);
  
  // MediaPipe 결과 처리
  const onPoseResults = useCallback(async (results: Results) => {
    if (!canvasRef.current || !results.poseLandmarks || processingRef.current || isPaused) return;
    
    processingRef.current = true;
    
    try {
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
      
      // display-canvas에도 그리기
      const displayCanvas = document.getElementById('display-canvas') as HTMLCanvasElement;
      let displayCtx: CanvasRenderingContext2D | null = null;
      if (displayCanvas) {
        displayCtx = displayCanvas.getContext('2d');
        if (displayCtx) {
          displayCanvas.width = canvas.width;
          displayCanvas.height = canvas.height;
          displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
          displayCtx.drawImage(results.image, 0, 0, displayCanvas.width, displayCanvas.height);
        }
      }
      
      // 랜드마크 정규화
      const normalizedLandmarks = normalizeCoordinates(
        results.poseLandmarks,
        canvas.width,
        canvas.height
      );
      
      // 포즈 그리기
      drawPose(ctx, normalizedLandmarks, POSE_CONNECTIONS);
      
      // display-canvas에도 포즈 그리기
      if (displayCtx) {
        drawPose(displayCtx, normalizedLandmarks, POSE_CONNECTIONS);
      }
      
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
      const drawFeedback = (context: CanvasRenderingContext2D) => {
        if (analysis.feedback.length > 0) {
          context.fillStyle = 'rgba(0, 0, 0, 0.7)';
          context.fillRect(10, 10, 400, 100);
          context.fillStyle = '#FFFFFF';
          context.font = '16px Arial';
          analysis.feedback.slice(0, 3).forEach((feedback, idx) => {
            context.fillText(feedback, 20, 35 + idx * 25);
          });
        }
        
        // 점수 표시
        context.fillStyle = analysis.overallScore >= 80 ? '#00FF00' : 
                        analysis.overallScore >= 60 ? '#FFFF00' : '#FF0000';
        context.font = 'bold 48px Arial';
        context.fillText(`${Math.round(analysis.overallScore)}점`, canvas.width - 150, 60);
        
        // 일시정지 상태 표시
        if (isPaused) {
          context.fillStyle = 'rgba(0, 0, 0, 0.5)';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = '#FFFFFF';
          context.font = 'bold 48px Arial';
          context.textAlign = 'center';
          context.fillText('일시정지', canvas.width / 2, canvas.height / 2);
          context.textAlign = 'left';
        }
      };
      
      // 메인 캔버스에 피드백 그리기
      drawFeedback(ctx);
      
      // display-canvas에도 피드백 그리기
      if (displayCtx) {
        drawFeedback(displayCtx);
      }
      
      ctx.restore();
      
      // 콜백 호출
      if (onResults && !isPaused) {
        onResults(analysis);
      }
      
      // 서버에 프레임 데이터 전송 (실시간 모드일 때만)
      if (mode === 'realtime' && sessionId && isAnalyzing && !isPaused) {
        try {
          const currentTime = (Date.now() - startTime - pausedTime) / 1000;
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
    } finally {
      processingRef.current = false;
    }
  }, [exercise, onResults, mode, sessionId, isAnalyzing, frameIndex, startTime, pausedTime, isPaused]);
  
  // MediaPipe 초기화
  const initializeMediaPipe = useCallback(async () => {
    console.log('=== initializeMediaPipe START ===');
    console.log('videoRef.current:', videoRef.current);
    console.log('canvasRef.current:', canvasRef.current);
    console.log('window.Pose available:', !!window.Pose);
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('Missing video or canvas element');
      return;
    }
    
    // 기존 인스턴스 정리 - close() 호출 제거
    if (poseRef.current) {
      console.log('Existing pose instance found, will be reused');
      poseRef.current = null;
    }
    
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
      // Pose 초기화 - mediapipeUtils의 캐싱 기능 활용
      const pose = await initializePose();
      pose.onResults(onPoseResults);
      poseRef.current = pose;
      
      // 실시간 모드일 때 카메라 초기화
      if (mode === 'realtime' && window.Camera) {
        // 기존 카메라 정리
        if (cameraRef.current) {
          cameraRef.current.stop();
          cameraRef.current = null;
        }
        
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current && !processingRef.current) {
              try {
                await poseRef.current.send({ image: videoRef.current });
              } catch (error) {
                console.error('Error sending frame to pose:', error);
              }
            }
          },
          width: 1280,
          height: 720
        });
        cameraRef.current = camera;
      } else if (mode === 'realtime') {
        console.error('MediaPipe Camera not loaded');
      }
      
      console.log('=== initializeMediaPipe SUCCESS ===');
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
    }
  }, [onPoseResults, mode]);
  
  // 분석 시작
  const startAnalysis = useCallback(async () => {
    try {
      // 세션 생성
      console.log('Starting analysis with exercise:', exercise);
      const exerciseId = exercise.id;
      console.log('Exercise ID for session:', exerciseId, 'Type:', typeof exerciseId);
      
      if (!exerciseId || typeof exerciseId !== 'number') {
        console.error('Invalid exercise ID:', exerciseId);
        throw new Error('Invalid exercise ID');
      }
      
      const session = await createAnalysisSession(
        exerciseId, 
        mode
      );
      setSessionId(session.id);
      setStartTime(Date.now());
      setPausedTime(0);
      setFrameIndex(0);
      angleTrackerRef.current.clear();
      
      setIsAnalyzing(true);
      setIsPaused(false);
      
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
    setIsPaused(false);
    
    // 카메라 중지
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    // 비디오 스트림 중지 (웹캠 LED 끄기)
    if (videoRef.current && mode === 'realtime') {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    }
    
    // 캔버스 클리어
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    // 세션 완료 처리
    let sessionData = null;
    if (sessionId) {
      try {
        sessionData = await completeSession(sessionId);
        console.log('Session completed, data:', sessionData);
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
    
    // 상태 초기화
    setAnalysisResult(null);
    setRepCount(0);
    
    return sessionData;
  }, [sessionId, mode]);
  
  // 일시정지/재개
  const togglePause = useCallback(() => {
    if (isPaused) {
      // 재개
      const pauseDuration = Date.now() - pauseStartRef.current;
      setPausedTime(prev => prev + pauseDuration);
      setIsPaused(false);
    } else {
      // 일시정지
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isPaused]);
  
  const pauseStartRef = useRef<number>(0);
  
  // 비디오 파일 분석
  const analyzeVideoFile = useCallback(async (file: File) => {
    console.log('=== analyzeVideoFile START ===');
    console.log('File:', file.name, 'Size:', file.size);
    console.log('videoRef.current:', videoRef.current);
    console.log('poseRef.current:', poseRef.current);
    
    if (!videoRef.current) {
      console.error('No video element found');
      return;
    }
    
    // MediaPipe가 초기화되지 않았으면 초기화
    if (!poseRef.current) {
      console.log('Initializing MediaPipe for video analysis...');
      await initializeMediaPipe();
      
      // 초기화 후에도 없으면 에러
      if (!poseRef.current) {
        console.error('Failed to initialize MediaPipe');
        return;
      }
    }
    
    const video = videoRef.current;
    const videoUrl = URL.createObjectURL(file);
    console.log('Video URL created:', videoUrl);
    
    video.src = videoUrl;
    
    // 비디오 분석 시작
    setIsAnalyzing(true);
    setFrameIndex(0);
    angleTrackerRef.current.clear();
    setRepCount(0);
    
    video.onloadedmetadata = () => {
      console.log('Video metadata loaded');
      console.log('Duration:', video.duration, 'Width:', video.width, 'Height:', video.height);
      video.play().then(() => {
        console.log('Video play started');
      }).catch(err => {
        console.error('Video play error:', err);
      });
    };
    
    video.onplay = () => {
      console.log('Video started playing');
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // 캔버스 크기 설정
      if (canvasRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        console.log('Canvas size set to:', canvasRef.current.width, 'x', canvasRef.current.height);
      }
      
      const processFrame = async () => {
        if (video.paused || video.ended) {
          // 비디오가 끝나면 분석 종료
          if (video.ended) {
            console.log('Video ended in processFrame');
            setIsAnalyzing(false);
            // 약간의 지연을 주고 onVideoEnd 호출
            setTimeout(() => {
              console.log('Calling onVideoEnd callback');
              if (onVideoEnd) {
                onVideoEnd();
              }
            }, 100);
          }
          return;
        }
        
        if (poseRef.current && !processingRef.current) {
          try {
            await poseRef.current.send({ image: video });
          } catch (error) {
            console.error('Error sending frame to MediaPipe:', error);
          }
        }
        
        requestAnimationFrame(processFrame);
      };
      
      processFrame();
    };
    
    // 비디오 종료 이벤트 핸들러 추가
    video.onended = () => {
      console.log('Video onended event fired');
      setIsAnalyzing(false);
      if (onVideoEnd) {
        setTimeout(() => {
          onVideoEnd();
        }, 100);
      }
    };
    
    video.onerror = (error) => {
      console.error('Video error:', error);
      console.error('Video error type:', video.error?.code, video.error?.message);
      setIsAnalyzing(false);
    };
    
    console.log('=== analyzeVideoFile END ===');
  }, [onVideoEnd, initializeMediaPipe, isAnalyzing]);
  
  // 초기화
  useEffect(() => {
    initializeMediaPipe();
    
    return () => {
      // 정리 작업
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      // Pose 인스턴스는 cleanupPose로 처리
      poseRef.current = null;
    };
  }, [initializeMediaPipe]);
  
  return {
    videoRef,
    canvasRef,
    isAnalyzing,
    isPaused,
    analysisResult,
    repCount,
    startAnalysis,
    stopAnalysis,
    togglePause,
    analyzeVideoFile,
    setMode: (newMode: 'realtime' | 'upload') => {
      // mode 변경 시 필요한 처리
      if (newMode !== mode) {
        // 기존 분석 중지
        if (isAnalyzing) {
          stopAnalysis();
        }
      }
    }
  };
};
