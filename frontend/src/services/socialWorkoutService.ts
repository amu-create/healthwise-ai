// 운동 기록을 소셜 피드에 공유하는 서비스
import api from './api';

export interface WorkoutShareData {
  workoutLogId: number;
  content: string;
  visibility: 'public' | 'friends' | 'private';
  exerciseName?: string;
  duration?: number;
  caloriesBurned?: number;
  mediaFile?: File;
}

export interface WorkoutStoryData {
  workoutLogId: number;
  caption?: string;
  stats: {
    duration: number;
    calories: number;
    exercises: number;
  };
}

class SocialWorkoutService {
  // 운동 기록을 소셜 피드에 공유
  async shareWorkoutToFeed(data: WorkoutShareData): Promise<any> {
    const formData = new FormData();
    
    formData.append('content', data.content);
    formData.append('visibility', data.visibility);
    formData.append('workout_log', data.workoutLogId.toString());
    
    if (data.exerciseName) {
      formData.append('exercise_name', data.exerciseName);
    }
    
    if (data.duration) {
      formData.append('duration', data.duration.toString());
    }
    
    if (data.caloriesBurned) {
      formData.append('calories_burned', data.caloriesBurned.toString());
    }
    
    if (data.mediaFile) {
      formData.append('media_file', data.mediaFile);
    }

    const response = await api.post('/social/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // 운동 성과를 스토리로 공유
  async createWorkoutStory(data: WorkoutStoryData): Promise<any> {
    // 운동 통계 이미지 생성 (Canvas 사용)
    const imageBlob = await this.generateWorkoutStatsImage(data.stats);
    const imageFile = new File([imageBlob], 'workout-stats.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('media_file', imageFile);
    formData.append('caption', data.caption || `💪 오늘의 운동 완료!\n⏱️ ${data.stats.duration}분\n🔥 ${data.stats.calories}kcal\n💯 ${data.stats.exercises}개 운동`);

    const response = await api.post('/social/stories/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // 운동 통계 이미지 생성
  private async generateWorkoutStatsImage(stats: { duration: number; calories: number; exercises: number }): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#00D4FF');
    gradient.addColorStop(1, '#00FFB3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 반투명 배경 박스
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.roundRect(100, 600, 880, 720, 40);
    ctx.fill();

    // 텍스트 스타일
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';

    // 제목
    ctx.font = 'bold 80px Arial';
    ctx.fillText('운동 완료! 💪', canvas.width / 2, 750);

    // 통계
    ctx.font = '60px Arial';
    const statsY = 950;
    const lineHeight = 120;

    ctx.fillText(`⏱️ 운동 시간: ${stats.duration}분`, canvas.width / 2, statsY);
    ctx.fillText(`🔥 칼로리: ${stats.calories}kcal`, canvas.width / 2, statsY + lineHeight);
    ctx.fillText(`💯 운동 개수: ${stats.exercises}개`, canvas.width / 2, statsY + lineHeight * 2);

    // HealthWise 로고
    ctx.font = 'bold 40px Arial';
    ctx.fillText('HealthWise', canvas.width / 2, 1800);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }

  // 운동 목표 달성 시 자동 공유
  async shareAchievement(achievementType: string, details: any): Promise<any> {
    let content = '';
    
    switch (achievementType) {
      case 'streak':
        content = `🔥 ${details.days}일 연속 운동 달성! 꾸준함이 최고의 무기입니다. #HealthWise #운동스트릭`;
        break;
      case 'personal_record':
        content = `🏆 개인 기록 갱신! ${details.exercise}: ${details.record} #HealthWise #개인기록`;
        break;
      case 'monthly_goal':
        content = `🎯 이번 달 운동 목표 달성! ${details.workouts}회 운동 완료 #HealthWise #목표달성`;
        break;
      default:
        content = `🎉 새로운 성취 달성! #HealthWise`;
    }

    return this.shareWorkoutToFeed({
      workoutLogId: details.workoutLogId || 0,
      content,
      visibility: 'public',
    });
  }

  // 주간 운동 요약 생성
  async generateWeeklySummary(weekData: any): Promise<string> {
    const totalWorkouts = weekData.workouts.length;
    const totalDuration = weekData.workouts.reduce((sum: number, w: any) => sum + w.duration, 0);
    const totalCalories = weekData.workouts.reduce((sum: number, w: any) => sum + w.calories, 0);

    return `📊 이번 주 운동 요약
    
🏃 총 운동 횟수: ${totalWorkouts}회
⏱️ 총 운동 시간: ${Math.round(totalDuration / 60)}시간 ${totalDuration % 60}분
🔥 총 소모 칼로리: ${totalCalories}kcal
    
${weekData.favoriteExercise ? `💪 가장 많이 한 운동: ${weekData.favoriteExercise}` : ''}
    
꾸준히 운동하는 당신, 정말 멋져요! 💯
#HealthWise #주간운동요약`;
  }

  // 운동 친구 찾기 (비슷한 운동 패턴)
  async findWorkoutBuddies(preferences: {
    exerciseTypes: string[];
    workoutTime: string;
    level: string;
  }): Promise<any[]> {
    const response = await api.get('/social/profiles/workout-buddies/', {
      params: preferences,
    });
    return response.data;
  }

  // 운동 챌린지 생성/참여
  async createChallenge(challenge: {
    title: string;
    description: string;
    goalType: 'duration' | 'frequency' | 'calories';
    goalValue: number;
    duration: number; // days
  }): Promise<any> {
    const response = await api.post('/social/challenges/', challenge);
    return response.data;
  }

  async joinChallenge(challengeId: number): Promise<any> {
    const response = await api.post(`/social/challenges/${challengeId}/join/`);
    return response.data;
  }

  // 운동 기록 리액션 (응원)
  async cheerWorkout(postId: number, message?: string): Promise<any> {
    const response = await api.post(`/social/posts/${postId}/cheer/`, {
      message: message || '화이팅! 💪',
    });
    return response.data;
  }
}

export const socialWorkoutService = new SocialWorkoutService();