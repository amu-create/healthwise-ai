// types/social.ts
export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture_url?: string;
  is_following?: boolean;
  profile?: {
    profile_image?: string;
  };
}

export interface UserProfile {
  id: number;
  user: User;
  bio?: string;
  profile_picture?: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  total_posts: number;
  total_workouts: number;
}

export interface WorkoutInfo {
  date: string;
  duration: number;
  routine_name?: string;
}

export interface Comment {
  id: number;
  user: User;
  content: string;
  parent?: number;
  replies: Comment[];
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  user: User & {
    profile_image?: string;
    avatar_url?: string;
  };
  content: string;
  visibility: 'public' | 'followers' | 'private';
  visibility_display?: string;
  workout_log?: number;
  workout_info?: WorkoutInfo;
  exercise_name?: string;
  duration?: number;
  calories_burned?: number;
  media_file?: string;
  media_type?: 'image' | 'video' | 'gif';
  media_type_display?: string;
  media_url?: string;
  likes: any[];
  likes_count: number;
  comments: Comment[];
  comments_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  can_edit?: boolean;
  created_at: string;
  updated_at: string;
  location?: string;
}
