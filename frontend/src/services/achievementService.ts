import api from './api';

interface AchievementCheckResponse {
  completed: boolean;
  achievement?: {
    id: number;
    name: string;
    name_en: string;
    name_es: string;
    description: string;
    description_en: string;
    description_es: string;
    points: number;
    badge_level: string;
  };
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

class AchievementService {
  private notificationCallback: ((achievement: any) => void) | null = null;

  setNotificationCallback(callback: (achievement: any) => void) {
    this.notificationCallback = callback;
  }

  async checkAchievement(achievementType: string, metadata?: any): Promise<AchievementCheckResponse> {
    try {
      const response = await api.post('/achievements/check/', {
        achievement_type: achievementType,
        ...metadata,
      });

      if (response.data.completed && response.data.achievement && this.notificationCallback) {
        // 업적 완료 시 알림 표시
        this.notificationCallback(response.data.achievement);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to check achievement:', error);
      throw error;
    }
  }

  async checkWorkoutAchievement(workoutData: {
    duration: number;
    routine_name?: string;
    exercises_count?: number;
  }) {
    return this.checkAchievement('workout_completed', workoutData);
  }

  async checkNutritionAchievement(nutritionData: {
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) {
    return this.checkAchievement('nutrition_logged', nutritionData);
  }

  async checkStreakAchievement() {
    return this.checkAchievement('daily_streak');
  }

  async checkSocialAchievement(socialType: 'follow_user' | 'first_post' | 'receive_likes') {
    return this.checkAchievement(socialType);
  }

  async getUserAchievements() {
    try {
      const response = await api.get('/achievements/user_achievements/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user achievements:', error);
      throw error;
    }
  }

  async getFollowingLeaderboard() {
    try {
      const response = await api.get('/achievements/following-leaderboard/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch following leaderboard:', error);
      throw error;
    }
  }
}

export default new AchievementService();
