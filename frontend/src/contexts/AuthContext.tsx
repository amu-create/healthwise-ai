import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService, { User, LoginData, RegisterData } from '../services/authService';
import api from '../services/api';

interface GuestLimits {
  aiWorkout: number;
  aiChat: number;
  aiMusic: number;
  aiNutrition: number;
  exerciseMap: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  guestLimits: GuestLimits;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  guestLogin: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  updateGuestLimit: (feature: keyof GuestLimits) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestLimits, setGuestLimits] = useState<GuestLimits>({
    aiWorkout: 3,
    aiChat: 3,
    aiMusic: 3,
    aiNutrition: 0, // 게스트는 사용 불가
    exerciseMap: 3,
  });

  // 사용자 정보 가져오기
  const fetchUser = async () => {
    try {
      // 게스트 상태 확인
      const guestStatus = localStorage.getItem('isGuest');
      if (guestStatus === 'true') {
        setIsGuest(true);
        const savedLimits = localStorage.getItem('guestLimits');
        if (savedLimits) {
          setGuestLimits(JSON.parse(savedLimits));
        }
        setLoading(false);
        return;
      }

      // 토큰 확인
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        setToken(savedToken);
      }

      const userData = await authService.getCurrentUser();
      // 프로필 데이터가 없으면 fitness-profile도 시도
      if (userData && !userData.profile) {
        try {
          const fitnessResponse = await api.get('/fitness-profile/');
          userData.profile = {
            age: fitnessResponse.data.age || 30,
            height: fitnessResponse.data.height || 170,
            weight: fitnessResponse.data.weight || 70,
            gender: fitnessResponse.data.gender || 'O',
            exercise_experience: fitnessResponse.data.experience || 'beginner',
            diseases: [],
            allergies: [],
          };
        } catch (fitnessErr) {
          console.log('No fitness profile found');
        }
      }
      setUser(userData);
      setIsGuest(false);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    setUser(response.user);
    setToken(response.token || localStorage.getItem('authToken'));
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    localStorage.removeItem('guestLimits');
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user);
    setToken(response.token || localStorage.getItem('authToken'));
  };

  const logout = async () => {
    if (isGuest) {
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestLimits');
      setIsGuest(false);
      setGuestLimits({
        aiWorkout: 3,
        aiChat: 3,
        aiMusic: 3,
        aiNutrition: 0,
        exerciseMap: 3,
      });
    } else {
      await authService.logout();
    }
    setUser(null);
    setToken(null);
  };

  const guestLogin = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('guestLimits', JSON.stringify(guestLimits));
    setUser(null);
    setToken(null);
  };

  const updateGuestLimit = (feature: keyof GuestLimits) => {
    if (guestLimits[feature] > 0) {
      const newLimits = {
        ...guestLimits,
        [feature]: guestLimits[feature] - 1,
      };
      setGuestLimits(newLimits);
      localStorage.setItem('guestLimits', JSON.stringify(newLimits));
    }
  };

  const updateUser = (user: User) => {
    setUser(user);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading, 
      isGuest,
      isAuthenticated: !!user && !isGuest,
      guestLimits,
      login, 
      register, 
      logout, 
      guestLogin,
      updateUser, 
      refreshUser,
      updateGuestLimit
    }}>
      {children}
    </AuthContext.Provider>
  );
};
