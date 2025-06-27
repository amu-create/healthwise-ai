import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  EmojiEvents,
  Timer,
  FitnessCenter,
  TrendingUp,
  CheckCircle,
  Warning,
  Share,
  Replay,
  BarChart as BarChartIcon,
  Save,
  Psychology,
  FitnessCenterOutlined,
  LocalFireDepartment,
  Straighten
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../../services/pose-analysis/exercises';
import AnalysisChart from './AnalysisChart';
import ShareDialog from './ShareDialog';
import { 
  saveWorkoutResult, 
  formatWorkoutAnalysis, 
  generateShareMessage,
  calculateCaloriesBurned 
} from '../../services/workout/workoutResultService';
import { useSnackbar } from 'notistack';

interface FinalResultsProps {
  frames: any[];
  exercise: Exercise;
  duration: number;
  averageScore: number;
  repCount: number;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// 정적 운동 체크 (플랭크, 사이드 플랭크 등)
const isStaticExercise = (exerciseName: string): boolean => {
  const staticExercises = ['플랭크', '사이드 플랭크', 'Plank', 'Side Plank', 'plank', 'side plank'];
  return staticExercises.includes(exerciseName);
};

// 운동별 주요 체크포인트 정의
const getExerciseCheckpoints = (exerciseName: string) => {
  // 영어와 한글 이름 모두 체크
  const normalizedName = exerciseName.toLowerCase();
  
  const checkpoints: Record<string, { joints: string[], targetAngles: Record<string, { min: number, max: number, ideal: number }> }> = {
    '푸시업': {
      joints: ['elbow', 'shoulder', 'hip', 'knee'],
      targetAngles: {
        elbow: { min: 80, max: 100, ideal: 90 },
        shoulder: { min: 40, max: 50, ideal: 45 },
        hip: { min: 170, max: 180, ideal: 175 },
        knee: { min: 170, max: 180, ideal: 175 }
      }
    },
    'push-up': {
      joints: ['elbow', 'shoulder', 'hip', 'knee'],
      targetAngles: {
        elbow: { min: 80, max: 100, ideal: 90 },
        shoulder: { min: 40, max: 50, ideal: 45 },
        hip: { min: 170, max: 180, ideal: 175 },
        knee: { min: 170, max: 180, ideal: 175 }
      }
    },
    'pushup': {
      joints: ['elbow', 'shoulder', 'hip', 'knee'],
      targetAngles: {
        elbow: { min: 80, max: 100, ideal: 90 },
        shoulder: { min: 40, max: 50, ideal: 45 },
        hip: { min: 170, max: 180, ideal: 175 },
        knee: { min: 170, max: 180, ideal: 175 }
      }
    },
    '스쿼트': {
      joints: ['knee', 'hip', 'ankle', 'torso'],
      targetAngles: {
        knee: { min: 80, max: 100, ideal: 90 },
        hip: { min: 80, max: 100, ideal: 90 },
        ankle: { min: 70, max: 90, ideal: 80 },
        torso: { min: 165, max: 180, ideal: 170 }
      }
    },
    'squat': {
      joints: ['knee', 'hip', 'ankle', 'torso'],
      targetAngles: {
        knee: { min: 80, max: 100, ideal: 90 },
        hip: { min: 80, max: 100, ideal: 90 },
        ankle: { min: 70, max: 90, ideal: 80 },
        torso: { min: 165, max: 180, ideal: 170 }
      }
    },
    '플랭크': {
      joints: ['shoulder', 'hip', 'neck', 'spine'],
      targetAngles: {
        shoulder: { min: 85, max: 95, ideal: 90 },
        hip: { min: 170, max: 180, ideal: 175 },
        neck: { min: 170, max: 180, ideal: 175 },
        spine: { min: 170, max: 180, ideal: 175 }
      }
    },
    'plank': {
      joints: ['shoulder', 'hip', 'neck', 'spine'],
      targetAngles: {
        shoulder: { min: 85, max: 95, ideal: 90 },
        hip: { min: 170, max: 180, ideal: 175 },
        neck: { min: 170, max: 180, ideal: 175 },
        spine: { min: 170, max: 180, ideal: 175 }
      }
    },
    '런지': {
      joints: ['front_knee', 'back_knee', 'hip', 'torso'],
      targetAngles: {
        front_knee: { min: 85, max: 95, ideal: 90 },
        back_knee: { min: 80, max: 100, ideal: 90 },
        hip: { min: 85, max: 95, ideal: 90 },
        torso: { min: 165, max: 180, ideal: 175 }
      }
    },
    'lunge': {
      joints: ['front_knee', 'back_knee', 'hip', 'torso'],
      targetAngles: {
        front_knee: { min: 85, max: 95, ideal: 90 },
        back_knee: { min: 80, max: 100, ideal: 90 },
        hip: { min: 85, max: 95, ideal: 90 },
        torso: { min: 165, max: 180, ideal: 175 }
      }
    },
    '데드리프트': {
      joints: ['hip', 'knee', 'spine', 'shoulder'],
      targetAngles: {
        hip: { min: 90, max: 180, ideal: 135 },
        knee: { min: 160, max: 180, ideal: 170 },
        spine: { min: 165, max: 180, ideal: 175 },
        shoulder: { min: 0, max: 20, ideal: 10 }
      }
    },
    'deadlift': {
      joints: ['hip', 'knee', 'spine', 'shoulder'],
      targetAngles: {
        hip: { min: 90, max: 180, ideal: 135 },
        knee: { min: 160, max: 180, ideal: 170 },
        spine: { min: 165, max: 180, ideal: 175 },
        shoulder: { min: 0, max: 20, ideal: 10 }
      }
    }
  };
  
  // 한글 이름으로도 체크, 영어 이름으로도 체크
  return checkpoints[exerciseName] || checkpoints[normalizedName] || checkpoints[exerciseName.toLowerCase()] || null;
};

// 각도 분석 기반 구체적 피드백 생성
const generateDetailedAngleFeedback = (
  exercise: Exercise,
  frames: any[]
): string[] => {
  const feedback: string[] = [];
  const checkpoints = getExerciseCheckpoints(exercise.name);
  
  console.log('generateDetailedAngleFeedback - exercise:', exercise.name);
  console.log('generateDetailedAngleFeedback - frames length:', frames.length);
  console.log('generateDetailedAngleFeedback - checkpoints:', checkpoints);
  console.log('generateDetailedAngleFeedback - sample frame:', frames[0]);
  
  if (!checkpoints) {
    console.log('No checkpoints found for exercise:', exercise.name);
    return feedback;
  }
  
  // 프레임별 각도 데이터 수집 및 분석
  const angleAnalysis: Record<string, { 
    avg: number, 
    min: number, 
    max: number, 
    outOfRangeCount: number,
    values: number[] 
  }> = {};
  
  frames.forEach(frame => {
    // angleScores가 없으면 angles를 사용
    const angleData = frame.angleScores || frame.angles;
    if (angleData) {
      checkpoints.joints.forEach(joint => {
        if (angleData[joint] !== undefined) {
          if (!angleAnalysis[joint]) {
            angleAnalysis[joint] = {
              avg: 0,
              min: Infinity,
              max: -Infinity,
              outOfRangeCount: 0,
              values: []
            };
          }
          
          const angle = angleData[joint];
          angleAnalysis[joint].values.push(angle);
          angleAnalysis[joint].min = Math.min(angleAnalysis[joint].min, angle);
          angleAnalysis[joint].max = Math.max(angleAnalysis[joint].max, angle);
          
          // 목표 각도 범위에서 벗어난 경우 카운트
          const target = checkpoints.targetAngles[joint];
          if (angle < target.min || angle > target.max) {
            angleAnalysis[joint].outOfRangeCount++;
          }
        }
      });
    }
  });
  
  // 각 관절의 평균 계산 및 피드백 생성
  Object.entries(angleAnalysis).forEach(([joint, data]) => {
    if (data.values.length > 0) {
      data.avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      const target = checkpoints.targetAngles[joint];
      const deviationPercent = (data.outOfRangeCount / frames.length) * 100;
      
      // 운동별 구체적인 각도 피드백
      const exerciseNameLower = exercise.name.toLowerCase();
      if (exercise.name === '푸시업' || exerciseNameLower === 'push-up' || exerciseNameLower === 'pushup') {
        if (joint === 'elbow') {
          if (data.avg < target.min) {
            feedback.push(`📐 팔꿈치 각도가 너무 좁습니다 (평균 ${Math.round(data.avg)}도). 팔을 내릴 때 팔꿈치를 ${target.ideal}도까지 굽혀주세요. 가슴이 바닥에서 주먹 하나 정도 떨어진 위치까지 내려가면 적절합니다.`);
          } else if (data.avg > target.max) {
            feedback.push(`📐 팔꿈치가 너무 많이 벌어졌습니다 (평균 ${Math.round(data.avg)}도). 팔꿈치를 몸통에 가깝게 ${target.ideal}도 정도로 유지하세요. 겨드랑이에 달걀을 끼운다는 느낌으로 운동하세요.`);
          }
          
          if (deviationPercent > 50) {
            feedback.push(`⚠️ 운동 중 ${Math.round(deviationPercent)}%의 시간 동안 팔꿈치 각도가 부정확했습니다. 속도를 줄이고 정확한 자세에 집중하세요.`);
          }
        } else if (joint === 'hip') {
          if (data.avg < target.min) {
            feedback.push(`🔴 엉덩이가 처져 있습니다 (평균 ${Math.round(data.avg)}도). 복부와 엉덩이에 힘을 주어 몸을 일직선(${target.ideal}도)으로 유지하세요. 거울을 옆에 두고 확인하면서 연습하세요.`);
          }
        } else if (joint === 'shoulder') {
          if (Math.abs(data.avg - target.ideal) > 10) {
            feedback.push(`💪 손 위치를 조정하세요. 손은 어깨너비보다 약간 넓게 벌리고, 어깨와 손목이 일직선이 되도록 위치시키세요.`);
          }
        }
      } else if (exercise.name === '스쿼트' || exerciseNameLower === 'squat') {
        if (joint === 'knee') {
          if (data.min < target.min) {
            feedback.push(`🦵 무릎을 너무 깊게 굽혔습니다 (최소 ${Math.round(data.min)}도). 무릎이 ${target.ideal}도가 될 때까지만 내려가세요. 허벅지가 바닥과 평행이 되면 충분합니다.`);
          }
          
          // 무릎이 발끝을 넘는지 체크 (knee angle이 너무 예각인 경우)
          const kneeTooForward = data.values.filter(v => v < 70).length / data.values.length;
          if (kneeTooForward > 0.3) {
            feedback.push(`⚠️ 무릎이 발끝을 넘어간 비율: ${Math.round(kneeTooForward * 100)}%. 엉덩이를 뒤로 더 빼면서 앉으세요. 의자에 앉는 것처럼 엉덩이부터 내려가세요.`);
          }
        } else if (joint === 'hip') {
          if (data.avg > target.max) {
            feedback.push(`🔄 엉덩이를 더 깊게 내려보세요 (현재 평균 ${Math.round(data.avg)}도). 목표는 ${target.ideal}도입니다. 유연성이 부족하다면 발을 어깨너비보다 약간 더 벌려보세요.`);
          }
        } else if (joint === 'torso') {
          if (data.avg < target.min) {
            feedback.push(`📏 상체가 너무 앞으로 기울었습니다 (평균 ${Math.round(data.avg)}도). 가슴을 들고 시선은 정면을 향하세요. 등에 막대기를 대고 있다고 상상하며 운동하세요.`);
          }
        } else if (joint === 'ankle') {
          if (data.avg < target.min) {
            feedback.push(`👟 발목 유연성 부족으로 발뒤꿈치가 들립니다. 종아리 스트레칭을 충분히 하고, 필요시 발뒤꿈치 아래 1-2cm 높이의 판을 놓고 운동하세요.`);
          }
        }
      } else if (exercise.name === '플랭크' || exerciseNameLower === 'plank') {
        if (joint === 'hip') {
          const hipVariation = data.max - data.min;
          if (hipVariation > 15) {
            feedback.push(`📊 엉덩이 높이가 일정하지 않습니다 (변동폭: ${Math.round(hipVariation)}도). 복부에 지속적으로 힘을 주어 엉덩이 높이를 ${target.ideal}도로 고정하세요.`);
          }
          if (data.avg < target.min) {
            feedback.push(`⬇️ 엉덩이가 처졌습니다 (평균 ${Math.round(data.avg)}도). 배꼽을 등쪽으로 당긴다는 느낌으로 복부에 힘을 주세요.`);
          } else if (data.avg > target.max) {
            feedback.push(`⬆️ 엉덩이가 너무 높습니다 (평균 ${Math.round(data.avg)}도). 엉덩이를 낮춰 어깨부터 발끝까지 일직선을 만드세요.`);
          }
        } else if (joint === 'shoulder') {
          if (Math.abs(data.avg - target.ideal) > 5) {
            feedback.push(`🎯 팔꿈치 위치를 조정하세요. 어깨가 팔꿈치 바로 위(${target.ideal}도)에 오도록 하여 어깨 부담을 줄이세요.`);
          }
        }
      } else if (exercise.name === '런지' || exerciseNameLower === 'lunge') {
        if (joint === 'front_knee') {
          if (data.avg < target.min) {
            feedback.push(`🦵 앞 무릎 각도가 너무 예각입니다 (평균 ${Math.round(data.avg)}도). 앞 무릎을 ${target.ideal}도로 유지하고, 무릎이 발끝을 넘지 않도록 주의하세요.`);
          }
          
          // 좌우 균형 체크
          const kneeAlignment = data.values.filter(v => v >= target.min && v <= target.max).length / data.values.length;
          if (kneeAlignment < 0.7) {
            feedback.push(`⚖️ 앞 무릎이 안쪽이나 바깥쪽으로 기울어집니다. 무릎이 발가락 방향과 일치하도록 정렬을 유지하세요.`);
          }
        } else if (joint === 'back_knee') {
          if (data.min > 120) {
            feedback.push(`📏 뒤 무릎을 더 깊게 굽히세요. 뒤 무릎이 바닥에서 주먹 하나 정도 떨어진 위치까지 내려가야 합니다.`);
          }
        } else if (joint === 'torso') {
          if (data.avg < target.min) {
            feedback.push(`🏃 상체가 앞으로 기울어졌습니다 (평균 ${Math.round(data.avg)}도). 상체를 수직(${target.ideal}도)으로 유지하고, 코어에 힘을 주세요.`);
          }
        }
      }
    }
  });
  
  // 전체적인 일관성 체크
  const overallConsistency = Object.values(angleAnalysis).reduce((acc, data) => {
    if (data.values.length > 0) {
      const variance = data.values.reduce((sum, val) => sum + Math.pow(val - data.avg, 2), 0) / data.values.length;
      return acc + Math.sqrt(variance);
    }
    return acc;
  }, 0) / Object.keys(angleAnalysis).length;
  
  if (overallConsistency > 15) {
    feedback.push(`📊 전체적으로 자세의 일관성이 부족합니다. 천천히 운동하면서 각 동작마다 정확한 자세를 유지하는 데 집중하세요.`);
  }
  
  return feedback;
};

// 자세 분석 전문 코치 피드백 생성
const generateCoachFeedback = (
  exercise: Exercise,
  averageScore: number,
  frames: any[],
  repCount: number,
  duration: number
): string[] => {
  const feedback: string[] = [];
  const isStatic = isStaticExercise(exercise.name);
  
  // 점수별 기본 피드백
  if (averageScore >= 90) {
    feedback.push("🎯 훌륭한 자세입니다! 현재 수준을 유지하면서 운동 강도를 높여보세요.");
  } else if (averageScore >= 80) {
    feedback.push("👍 전체적으로 좋은 자세를 유지하고 있습니다. 몇 가지 세부사항만 개선하면 완벽해질 거예요.");
  } else if (averageScore >= 70) {
    feedback.push("💪 기본 자세는 잘 잡혀있지만, 더 정확한 동작을 위해 연습이 필요합니다.");
  } else {
    feedback.push("📚 기초부터 차근차근 연습해보세요. 거울을 보며 자세를 확인하는 것을 추천합니다.");
  }

  // 각도 기반 구체적 피드백 추가
  const angleFeedback = generateDetailedAngleFeedback(exercise, frames);
  feedback.push(...angleFeedback);
  
  // 각도 피드백이 없으면 기본 자세 교정 피드백 추가
  if (angleFeedback.length === 0) {
    const exerciseNameLower = exercise.name.toLowerCase();
    
    if (exercise.name === '플랭크' || exerciseNameLower === 'plank') {
      if (averageScore < 40) {
        feedback.push("🔴 엉덩이가 처졌습니다. 복부와 엉덩이에 힘을 주어 몸을 일직선으로 만드세요.");
        feedback.push("👀 머리가 너무 낮거나 높습니다. 시선은 바닥을 향하고 목은 체간과 일직선이 되도록 하세요.");
        feedback.push("🤲 팔꿈치는 어깨 바로 아래에 위치시키고, 손목은 공직선을 유지하세요.");
      } else if (averageScore <= 70) {
        feedback.push("⚠️ 엉덩이 높이가 일정하지 않습니다. 복부에 지속적으로 힘을 주어 고정하세요.");
        feedback.push("🧍 배꼽을 등쪽으로 당긴다는 느낌으로 복부에 힘을 주세요.");
      }
    } else if (exercise.name === '푸시업' || exerciseNameLower === 'push-up' || exerciseNameLower === 'pushup') {
      if (averageScore <= 60) {
        feedback.push("👋 팔을 내릴 때 팔꿈치가 90도가 되도록 하세요. 가슴이 바닥에서 주먹 하나 떨어진 위치까지 내려가세요.");
        feedback.push("🎯 팔꿈치를 몸통에 가까이 붙여 유지하세요. 겨드랑이에 달걀을 끼운다는 느낌으로 하세요.");
        feedback.push("🧍 복부와 엉덩이에 힘을 주어 몸이 일직선이 되도록 하세요. 엉덩이가 처지거나 너무 높이 들리지 않도록 주의하세요.");
      }
    } else if (exercise.name === '스쿼트' || exerciseNameLower === 'squat') {
      if (averageScore <= 60) {
        feedback.push("🧎 무릎을 구부릴 때 무릎이 발끝을 넘어가지 않도록 주의하세요. 엉덩이를 뒤로 빼면서 의자에 앉는 것처럼 내려가세요.");
        feedback.push("🤸 가슴을 들고 시선은 정면을 향하세요. 등이 구부정하게 괽혀지지 않도록 유지하세요.");
        feedback.push("🧍 허벽지가 바닥과 평행이 될 때까지만 내려가세요. 무릎이 발가락 방향과 일치하도록 정렬하세요.");
      }
    } else if (exercise.name === '런지' || exerciseNameLower === 'lunge') {
      if (averageScore <= 60) {
        feedback.push("🧎 앞무릎은 90도로 구부리고, 뒤무릎은 바닥에 가까이 내립니다. 양쪽 무릎 모두 90도를 목표로 하세요.");
        feedback.push("🎯 상체는 수직으로 유지하고, 코어에 힘을 주세요. 앞으로 기울어지지 않도록 주의하세요.");
        feedback.push("⚖️ 체중을 양쪽 다리에 균등하게 분배하세요. 앞무릎에만 힘이 실리지 않도록 하세요.");
      }
    }
  }

  // 운동 시간에 따른 피드백
  if (isStatic) {
    // 정적 운동 (플랭크 등)
    if (duration < 30) {
      feedback.push(`⏱️ ${Math.round(duration)}초 유지했습니다. 처음에는 30초를 목표로 하고, 점차 1분, 2분으로 늘려가세요.`);
    } else if (duration < 60) {
      feedback.push(`⏱️ ${Math.round(duration)}초 동안 잘 버텼습니다! 이제 1분을 목표로 도전해보세요.`);
    } else if (duration < 120) {
      feedback.push(`⏱️ 1분 이상 유지한 것은 대단합니다! 다음 목표는 2분입니다. 꾸준히 연습하면 달성할 수 있어요.`);
    } else {
      feedback.push(`⏱️ 2분 이상 유지하셨네요! 이제 세트를 늘리거나 변형 동작에 도전해보세요.`);
    }
  } else {
    // 동적 운동
    if (duration < 60) {
      feedback.push(`⏱️ 운동 시간이 짧습니다. 최소 1분 이상 지속하여 근지구력을 향상시키세요.`);
    } else if (duration > 180) {
      feedback.push(`⏱️ 충분한 운동 시간입니다! 이제 세트를 나누어 휴식을 취하며 운동하는 것을 권장합니다.`);
    }

    // 반복 횟수에 따른 피드백 (동적 운동만)
    if (repCount > 0) {
      const repsPerMinute = (repCount / duration) * 60;
      if (repsPerMinute > 30) {
        feedback.push(`⚡ 반복 속도가 빠릅니다. 각 동작을 2-3초에 걸쳐 천천히 수행하면 근육에 더 많은 자극을 줄 수 있습니다.`);
      } else if (repsPerMinute < 10) {
        feedback.push(`🐢 반복 속도가 느립니다. 근지구력 향상에는 좋지만, 필요시 템포를 약간 높여보세요.`);
      } else {
        feedback.push(`✨ 적절한 속도로 운동하고 있습니다. 이 템포를 유지하세요!`);
      }
    }
  }

  // 개선 방법 제안
  if (averageScore < 85) {
    feedback.push("💡 개선 팁: 거울을 보며 연습하거나, 느린 속도로 정확한 자세를 익히는 것부터 시작하세요.");
    if (!isStatic) {
      feedback.push("📱 동영상을 찍어 자신의 자세를 확인하고, 표준 자세와 비교해보세요.");
    }
  }

  // 운동별 구체적인 코칭 팁
  const exerciseNameLower = exercise.name.toLowerCase();
  if (exercise.name === '플랭크' || exercise.name === '사이드 플랭크' || exerciseNameLower === 'plank' || exerciseNameLower === 'side plank') {
    feedback.push("💡 호흡을 멈추지 마세요. 편안하게 숨을 쉬면서 복부에 힘을 유지하세요.");
    if (averageScore < 80) {
      feedback.push("🎯 초보자 팁: 무릎을 바닥에 대고 시작하면 더 쉽게 할 수 있습니다. 점차 난이도를 높여가세요.");
    }
  } else if (exercise.name === '푸시업' || exerciseNameLower === 'push-up' || exerciseNameLower === 'pushup') {
    feedback.push("💡 손목이 아프다면 주먹을 쥐거나 푸시업 바를 사용해보세요.");
    if (averageScore < 70) {
      feedback.push("🎯 초보자 팁: 벽에 기대어 하거나 무릎을 바닥에 대고 하는 수정된 푸시업부터 시작하세요.");
    }
  } else if (exercise.name === '스쿼트' || exerciseNameLower === 'squat') {
    feedback.push("💡 무릎이 안쪽으로 모이지 않도록 주의하세요. 무릎은 항상 발가락 방향을 향해야 합니다.");
    if (averageScore < 80) {
      feedback.push("🎯 유연성 팁: 발목과 골반 유연성을 기르기 위해 스트레칭을 충분히 하세요.");
    }
  } else if (exercise.name === '런지' || exerciseNameLower === 'lunge') {
    feedback.push("💡 전후 균형을 유지하세요. 상체가 흔들리지 않도록 코어에 힘을 주세요.");
    if (averageScore < 75) {
      feedback.push("🎯 초보자 팁: 난간을 잡거나 벽을 짚고 연습하면 균형 잡기가 더 쉽습니다.");
    }
  } else if (exercise.name === '데드리프트' || exerciseNameLower === 'deadlift') {
    feedback.push("💡 허리는 항상 일직선을 유지하세요. 무거운 무게보다는 정확한 자세가 우선입니다.");
    if (averageScore < 75) {
      feedback.push("🎯 초보자 팁: 가벼운 무게나 빈 바로 시작하여 자세를 완벽히 익힌 후 무게를 늘리세요.");
    }
  }

  // 부상 방지 조언
  if (averageScore < 70) {
    feedback.push("⚠️ 안전 주의: 자세가 흐트러지면 부상 위험이 있습니다. 무리하지 말고 천천히 정확한 자세를 익히세요.");
  }

  // 격려 메시지
  feedback.push("🌟 꾸준한 연습이 완벽한 자세를 만듭니다. 오늘도 수고하셨어요!");

  return feedback;
};

const FinalResults: React.FC<FinalResultsProps> = ({
  frames,
  exercise,
  duration,
  averageScore,
  repCount,
  onClose
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [currentTab, setCurrentTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [workoutResultId, setWorkoutResultId] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const isStatic = isStaticExercise(exercise.name);
  const caloriesBurned = calculateCaloriesBurned(exercise.name, duration, repCount);
  const coachFeedback = generateCoachFeedback(exercise, averageScore, frames, repCount, duration);
  
  // 디버깅을 위한 로그 추가
  console.log('FinalResults - frames:', frames);
  console.log('FinalResults - exercise:', exercise);
  console.log('FinalResults - averageScore:', averageScore);
  console.log('FinalResults - coachFeedback:', coachFeedback);
  console.log('FinalResults - currentTab:', currentTab);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'success' };
    if (score >= 80) return { grade: 'A', color: 'success' };
    if (score >= 70) return { grade: 'B', color: 'warning' };
    if (score >= 60) return { grade: 'C', color: 'warning' };
    return { grade: 'D', color: 'error' };
  };

  const scoreGrade = getScoreGrade(averageScore);

  // 가장 빈번한 피드백 계산
  const feedbackCounts: Record<string, number> = {};
  frames.forEach(frame => {
    frame.feedback?.forEach((fb: string) => {
      feedbackCounts[fb] = (feedbackCounts[fb] || 0) + 1;
    });
  });

  const topFeedback = Object.entries(feedbackCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([feedback, count]) => ({ feedback, count }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 운동 결과 저장 (API 구현 전까지는 로컬 저장)
  const handleSaveResult = async () => {
    if (saved) return;
    
    setSaving(true);
    try {
      // API가 구현되면 주석 해제
      // const workoutData = formatWorkoutAnalysis(frames, exercise, duration, averageScore, repCount);
      // const result = await saveWorkoutResult(workoutData);
      // setWorkoutResultId(result.id);
      
      // 임시로 로컬스토리지에 저장
      const workoutData = formatWorkoutAnalysis(frames, exercise, duration, averageScore, repCount);
      const savedResults = JSON.parse(localStorage.getItem('workoutResults') || '[]');
      const newResult = {
        id: Date.now(),
        ...workoutData,
        createdAt: new Date().toISOString()
      };
      savedResults.push(newResult);
      localStorage.setItem('workoutResults', JSON.stringify(savedResults));
      
      setWorkoutResultId(newResult.id);
      setSaved(true);
      enqueueSnackbar(t('pose_analysis.save_success'), { variant: 'success' });
    } catch (error) {
      console.error('Error saving workout result:', error);
      enqueueSnackbar(t('pose_analysis.save_error'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 공유하기
  const handleShare = async () => {
    // 저장되지 않았다면 먼저 저장
    if (!saved) {
      await handleSaveResult();
    }
    
    // API가 구현되면 다이얼로그 열기
    // if (workoutResultId) {
    //   setShareDialogOpen(true);
    // }
    
    // 임시로 알림만 표시
    enqueueSnackbar('운동 결과가 저장되었습니다. 소셜 공유 기능은 준비 중입니다.', { variant: 'info' });
  };

  const shareMessage = generateShareMessage(exercise, averageScore, repCount, duration, caloriesBurned);

  return (
    <>
      <Card sx={{ mt: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmojiEvents sx={{ color: 'gold' }} />
              <Typography variant="h5">
                {t('pose_analysis.analysis_complete')}
              </Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('pose_analysis.save_result')}>
                <IconButton 
                  onClick={handleSaveResult} 
                  disabled={saving || saved}
                  color={saved ? 'success' : 'default'}
                >
                  {saving ? <CircularProgress size={24} /> : <Save />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t('pose_analysis.share_results')}>
                <IconButton onClick={handleShare} disabled={saving}>
                  <Share />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<Replay />}
                onClick={onClose}
              >
                {t('pose_analysis.analyze_again')}
              </Button>
            </Box>
          }
        />
        
        <CardContent>
          {/* 요약 통계 */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ flex: '1 1 150px', minWidth: 0 }}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h2" color={scoreGrade.color as any}>
                  {scoreGrade.grade}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pose_analysis.grade')}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {Math.round(averageScore)}점
                </Typography>
              </Paper>
            </Box>
            
            <Box sx={{ flex: '1 1 150px', minWidth: 0 }}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                <Timer sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h6">
                  {formatTime(duration)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pose_analysis.exercise_time')}
                </Typography>
              </Paper>
            </Box>
            
            {/* 정적 운동이 아닐 때만 반복 횟수 표시 */}
            {!isStatic && (
              <Box sx={{ flex: '1 1 150px', minWidth: 0 }}>
                <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                  <FitnessCenterOutlined sx={{ fontSize: 40, color: 'success.main' }} />
                  <Typography variant="h6">
                    {repCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('pose_analysis.rep_count')}
                  </Typography>
                </Paper>
              </Box>
            )}
            
            {/* 정적 운동일 때는 평균 자세 점수 표시 */}
            {isStatic && (
              <Box sx={{ flex: '1 1 150px', minWidth: 0 }}>
                <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                  <Straighten sx={{ fontSize: 40, color: 'info.main' }} />
                  <Typography variant="h6">
                    {Math.round(averageScore)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    자세 정확도
                  </Typography>
                </Paper>
              </Box>
            )}
            
            <Box sx={{ flex: '1 1 150px', minWidth: 0 }}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                <LocalFireDepartment sx={{ fontSize: 40, color: 'error.main' }} />
                <Typography variant="h6">
                  {caloriesBurned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pose_analysis.calories_burned')}
                </Typography>
              </Paper>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 탭 */}
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab icon={<Psychology />} label={t('pose_analysis.coach_feedback')} />
            <Tab icon={<BarChartIcon />} label={t('pose_analysis.detailed_analysis')} />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            {/* AI 코치 피드백 */}
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  {t('pose_analysis.ai_coach_says')}
                </Typography>
              </Alert>
              
              <List>
                {coachFeedback.map((feedback, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                          {feedback}
                        </Typography>
                      }
                      sx={{ my: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {/* 상세 차트 */}
            <AnalysisChart frames={frames} exercise={exercise} />
          </TabPanel>
        </CardContent>
      </Card>

      {/* 공유 다이얼로그 (API 구현 후 활성화) */}
      {/* {workoutResultId && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          workoutResultId={workoutResultId}
          defaultMessage={shareMessage}
          exerciseName={exercise.name}
        />
      )} */}
    </>
  );
};

export default FinalResults;
