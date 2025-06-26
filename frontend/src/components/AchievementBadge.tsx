import React from 'react';
import { Avatar, Badge, Box } from '@mui/material';
import {
  EmojiEvents,
  WorkspacePremium,
  AutoAwesome,
  Star,
  LocalFireDepartment,
  FitnessCenter,
  Restaurant,
  Whatshot,
  Flag,
  Bolt,
  Favorite,
  Timer,
  TrendingUp,
  Groups,
  Mood,
  SportsScore,
  Psychology,
  Shield,
  MilitaryTech,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface AchievementBadgeProps {
  achievement: {
    badge_level: string;
    icon_name?: string;
    category?: string;
  };
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  completed?: boolean;
}

const badgeColors: { [key: string]: string } = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const badgeGradients: { [key: string]: string } = {
  bronze: 'linear-gradient(135deg, #CD7F32, #8B4513)',
  silver: 'linear-gradient(135deg, #C0C0C0, #808080)',
  gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
  platinum: 'linear-gradient(135deg, #E5E4E2, #B0B0B0)',
  diamond: 'linear-gradient(135deg, #B9F2FF, #4169E1)',
};

const categoryIcons: { [key: string]: React.ReactElement } = {
  workout: <FitnessCenter />,
  nutrition: <Restaurant />,
  streak: <Whatshot />,
  milestone: <Flag />,
  challenge: <LocalFireDepartment />,
  // 추가 아이콘들
  strength: <Shield />,
  cardio: <Bolt />,
  social: <Groups />,
  mental: <Psychology />,
  wellness: <Mood />,
  competition: <SportsScore />,
  champion: <MilitaryTech />,
  heart: <Favorite />,
  time: <Timer />,
  progress: <TrendingUp />,
};

const sizeMap = {
  small: { avatar: 40, icon: 24, border: 2 },
  medium: { avatar: 64, icon: 36, border: 3 },
  large: { avatar: 100, icon: 56, border: 4 },
};

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  animated = false,
  completed = false,
}) => {
  const sizes = sizeMap[size];
  const badgeLevel = achievement.badge_level;
  
  // 아이콘 선택
  const getIcon = () => {
    if (achievement.icon_name && categoryIcons[achievement.icon_name]) {
      return categoryIcons[achievement.icon_name];
    }
    if (achievement.category && categoryIcons[achievement.category]) {
      return categoryIcons[achievement.category];
    }
    
    // 레벨별 기본 아이콘
    switch (badgeLevel) {
      case 'diamond':
        return <AutoAwesome />;
      case 'platinum':
        return <WorkspacePremium />;
      case 'gold':
        return <Star />;
      default:
        return <EmojiEvents />;
    }
  };

  const BadgeContent = (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        completed && badgeLevel === 'diamond' ? (
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Star
              sx={{
                fontSize: sizes.avatar / 3,
                color: '#FFD700',
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))',
              }}
            />
          </motion.div>
        ) : null
      }
    >
      <Avatar
        sx={{
          width: sizes.avatar,
          height: sizes.avatar,
          background: completed ? badgeGradients[badgeLevel] : 'linear-gradient(135deg, #424242, #212121)',
          border: `${sizes.border}px solid`,
          borderColor: completed ? badgeColors[badgeLevel] : '#424242',
          boxShadow: completed 
            ? `0 0 ${sizes.avatar / 4}px ${badgeColors[badgeLevel]}50, 0 0 ${sizes.avatar / 2}px ${badgeColors[badgeLevel]}30`
            : 'none',
          opacity: completed ? 1 : 0.6,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* 다이아몬드 레벨 특수 효과 */}
        {completed && badgeLevel === 'diamond' && (
          <>
            {/* 반짝임 효과 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: 4,
                  height: 4,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  top: '20%',
                  left: '50%',
                }}
                animate={{
                  x: [0, 20, -20, 0],
                  y: [0, -20, 20, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </>
        )}
        
        {/* 메인 아이콘 */}
        <Box
          component={motion.div}
          animate={animated && completed ? {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          sx={{
            fontSize: sizes.icon,
            color: completed ? '#FFFFFF' : '#757575',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: completed && (badgeLevel === 'gold' || badgeLevel === 'diamond')
              ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))'
              : 'none',
          }}
        >
          {getIcon()}
        </Box>
        
        {/* 플래티넘/다이아몬드 추가 장식 */}
        {completed && (badgeLevel === 'platinum' || badgeLevel === 'diamond') && (
          <Box
            sx={{
              position: 'absolute',
              inset: -sizes.border,
              border: `1px solid`,
              borderColor: badgeColors[badgeLevel],
              borderRadius: '50%',
              opacity: 0.5,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 0.5,
                },
                '50%': {
                  transform: 'scale(1.1)',
                  opacity: 0.3,
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 0.5,
                },
              },
            }}
          />
        )}
      </Avatar>
    </Badge>
  );

  if (animated && completed) {
    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {BadgeContent}
      </motion.div>
    );
  }

  return BadgeContent;
};

export default AchievementBadge;
