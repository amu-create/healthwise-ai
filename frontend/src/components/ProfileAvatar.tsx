import React from 'react';
import { Avatar, AvatarProps } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

interface ProfileAvatarProps extends Omit<AvatarProps, 'src'> {
  src?: string | null;
  name?: string;
  size?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  name,
  size = 40,
  sx,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    // src가 변경되면 에러 상태 리셋
    setImageError(false);
  }, [src]);

  const handleError = () => {
    console.error('ProfileAvatar image load error:', src);
    setImageError(true);
  };

  // 이름에서 이니셜 추출
  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const displayContent = () => {
    if (src && !imageError) {
      return null; // Avatar의 src prop이 이미지를 처리
    }
    if (name) {
      return getInitials(name);
    }
    return <PersonIcon />;
  };

  return (
    <Avatar
      src={!imageError && src ? src : undefined}
      onError={handleError}
      sx={{
        width: size,
        height: size,
        bgcolor: !src || imageError ? 'primary.main' : 'transparent',
        fontSize: size * 0.4,
        '& img': {
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
        },
        ...sx,
      }}
      {...props}
    >
      {displayContent()}
    </Avatar>
  );
};

export default ProfileAvatar;
