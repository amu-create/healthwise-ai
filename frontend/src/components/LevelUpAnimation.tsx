import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, AutoAwesome, Bolt } from '@mui/icons-material';
import confetti from 'canvas-confetti';

interface LevelUpAnimationProps {
  show: boolean;
  level: number;
  title: string;
  onComplete?: () => void;
}

// 헬퍼 함수를 컴포넌트 밖으로 이동
function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({
  show,
  level,
  title,
  onComplete,
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      // 색종이 효과
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
      }, 250);

      // 파티클 생성
      setParticles(Array.from({ length: 20 }, (_, i) => i));

      // 애니메이션 완료 후 콜백
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
          }}
        >
          {/* 배경 파티클 */}
          {particles.map((i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 100,
                rotate: Math.random() * 360,
              }}
              animate={{
                y: -100,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: randomInRange(3, 5),
                ease: 'linear',
                delay: Math.random() * 2,
              }}
              style={{
                position: 'absolute',
                fontSize: randomInRange(20, 40),
              }}
            >
              {['⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 4)]}
            </motion.div>
          ))}

          {/* 메인 컨텐츠 */}
          <Paper
            component={motion.div}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 100 }}
            elevation={24}
            sx={{
              p: 6,
              background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
              color: '#000',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 400,
            }}
          >
            {/* 빛나는 효과 */}
            <Box
              component={motion.div}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 300,
                height: 300,
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* 레벨 아이콘 */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Star sx={{ fontSize: 100, color: '#FFD700', mb: 2 }} />
            </motion.div>

            {/* LEVEL UP 텍스트 */}
            <Typography
              component={motion.div}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              variant="h2"
              fontWeight={900}
              sx={{
                textTransform: 'uppercase',
                letterSpacing: 4,
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Level Up!
            </Typography>

            {/* 레벨 숫자 */}
            <Typography
              component={motion.div}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              variant="h1"
              fontWeight={900}
              sx={{
                fontSize: 120,
                lineHeight: 1,
                mb: 2,
                textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
              }}
            >
              {level}
            </Typography>

            {/* 타이틀 */}
            <Typography
              component={motion.div}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              variant="h4"
              fontWeight={700}
              sx={{
                mb: 3,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </Typography>

            {/* 추가 이펙트 아이콘들 */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              {[AutoAwesome, Bolt, Star].map((Icon, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <Icon
                    sx={{
                      fontSize: 40,
                      color: '#FFD700',
                      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
                    }}
                  />
                </motion.div>
              ))}
            </Box>

            {/* 진행바 애니메이션 */}
            <Box
              component={motion.div}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 2 }}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 8,
                background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                transformOrigin: 'left',
              }}
            />
          </Paper>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default LevelUpAnimation;
