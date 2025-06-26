import React from 'react';

interface ExerciseImageProps {
  src?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  onError?: () => void;
}

const ExerciseImage: React.FC<ExerciseImageProps> = ({ 
  src, 
  alt, 
  width = '100%', 
  height = 200,
  onError 
}) => {
  // src가 없으면 아무것도 표시하지 않음
  if (!src) {
    return null;
  }

  return (
    <img 
      src={src}
      alt={alt}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        objectFit: 'contain',
        borderRadius: '8px'
      }}
      onError={onError}
    />
  );
};

export default ExerciseImage;
