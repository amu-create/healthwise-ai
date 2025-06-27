import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface StoryAvatarProps {
  username: string;
  avatarUrl?: string;
  hasUnviewed?: boolean;
  isOwnStory?: boolean;
  size?: number;
  onClick?: () => void;
}

const StoryBorder = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasUnviewed' && prop !== 'size',
})<{ hasUnviewed: boolean; size: number }>(({ theme, hasUnviewed, size }) => ({
  width: size + 8,
  height: size + 8,
  borderRadius: '50%',
  background: hasUnviewed
    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
    : theme.palette.grey[300],
  padding: 2,
  cursor: 'pointer',
  position: 'relative',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const StoryAvatar: React.FC<StoryAvatarProps> = ({
  username,
  avatarUrl,
  hasUnviewed = false,
  isOwnStory = false,
  size = 56,
  onClick,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <StoryBorder hasUnviewed={hasUnviewed} size={size}>
        <Avatar
          src={avatarUrl}
          sx={{
            width: size,
            height: size,
            border: '2px solid white',
          }}
        >
          {username[0].toUpperCase()}
        </Avatar>
        {isOwnStory && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'white',
            }}
          >
            +
          </Box>
        )}
      </StoryBorder>
      <Typography
        variant="caption"
        sx={{
          maxWidth: size + 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem',
        }}
      >
        {isOwnStory ? '내 스토리' : username}
      </Typography>
    </Box>
  );
};

export default StoryAvatar;
