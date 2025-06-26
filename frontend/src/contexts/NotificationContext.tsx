import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert, Box, Typography, Chip } from '@mui/material';
import { EmojiEvents, CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface AchievementNotificationData {
  id: number;
  name: string;
  description: string;
  points: number;
  badge_level: string;
  icon_name?: string;
}

interface NotificationContextType {
  showAchievementNotification: (achievement: AchievementNotificationData) => void;
  showSuccessNotification: (message: string) => void;
  showErrorNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const badgeColors: { [key: string]: string } = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [achievementData, setAchievementData] = useState<AchievementNotificationData | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const showAchievementNotification = useCallback((achievement: AchievementNotificationData) => {
    setAchievementData(achievement);
    setAchievementOpen(true);
    
    // 컨페티 효과
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#00D4FF', '#00FFB3', badgeColors[achievement.badge_level]],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#00D4FF', '#00FFB3', badgeColors[achievement.badge_level]],
      });
    }, 250);
  }, []);

  // Auto close achievement notification after 5 seconds
  useEffect(() => {
    if (achievementOpen) {
      const timer = setTimeout(() => {
        setAchievementOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievementOpen]);

  const showSuccessNotification = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, []);

  const showErrorNotification = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showAchievementNotification,
        showSuccessNotification,
        showErrorNotification,
      }}
    >
      {children}
      
      {/* Achievement Notification */}
      <AnimatePresence>
        {achievementOpen && achievementData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: 0.5, type: 'spring' }}
            style={{
              position: 'fixed',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.95), rgba(0, 255, 179, 0.95))',
                borderRadius: 3,
                p: 4,
                minWidth: 400,
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: `3px solid ${badgeColors[achievementData.badge_level]}`,
              }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
              >
                <EmojiEvents
                  sx={{
                    fontSize: 80,
                    color: badgeColors[achievementData.badge_level],
                    filter: `drop-shadow(0 0 20px ${badgeColors[achievementData.badge_level]})`,
                    mb: 2,
                  }}
                />
              </motion.div>
              
              <Typography variant="h4" fontWeight={900} color="black" gutterBottom>
                업적 달성!
              </Typography>
              
              <Typography variant="h5" fontWeight={700} color="black" gutterBottom>
                {achievementData.name}
              </Typography>
              
              <Typography variant="body1" color="black" sx={{ mb: 2 }}>
                {achievementData.description}
              </Typography>
              
              <Box display="flex" justifyContent="center" gap={1}>
                <Chip
                  icon={<CheckCircle />}
                  label={`+${achievementData.points} 포인트`}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                />
                <Chip
                  label={achievementData.badge_level}
                  sx={{
                    bgcolor: badgeColors[achievementData.badge_level],
                    color: 'white',
                    fontWeight: 700,
                  }}
                />
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* General Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
    </NotificationContext.Provider>
  );
};
