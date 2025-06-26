import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  IconButton,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Close,
} from '@mui/icons-material';

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  open,
  onClose,
  imageUrl,
  onCropComplete,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScaleChange = (event: Event, newValue: number | number[]) => {
    setScale(newValue as number);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => prev + (direction === 'left' ? -90 : 90));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputSize = 200; // 최종 출력 크기
    canvas.width = outputSize;
    canvas.height = outputSize;

    // 이미지를 로드하고 그리기
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // 원형 마스크 적용
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();

      // 캔버스 중앙으로 이동
      ctx.save();
      ctx.translate(outputSize / 2, outputSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // 이미지의 실제 표시 크기 계산
      const containerRect = containerRef.current!.getBoundingClientRect();
      // const imageRect = imageRef.current!.getBoundingClientRect(); // 현재 사용되지 않음
      
      // 컨테이너 내에서 이미지가 차지하는 비율
      let displayWidth, displayHeight;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = containerRect.width / containerRect.height;
      
      if (imgAspect > containerAspect) {
        // 이미지가 더 넓음
        displayWidth = containerRect.width;
        displayHeight = containerRect.width / imgAspect;
      } else {
        // 이미지가 더 높음
        displayHeight = containerRect.height;
        displayWidth = containerRect.height * imgAspect;
      }
      
      // 크롭 영역 크기 (200x200)
      const cropSize = 200;
      
      // 현재 스케일과 위치를 고려한 소스 영역 계산
      const sourceSize = cropSize / scale;
      const sourceX = (img.naturalWidth / 2) - (sourceSize / 2) - (position.x * img.naturalWidth / displayWidth / scale);
      const sourceY = (img.naturalHeight / 2) - (sourceSize / 2) - (position.y * img.naturalHeight / displayHeight / scale);
      
      // 이미지의 크롭된 부분만 그리기
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        -outputSize / 2,
        -outputSize / 2,
        outputSize,
        outputSize
      );
      
      ctx.restore();
      
      // 크롭된 이미지를 base64로 변환
      const croppedImageUrl = canvas.toDataURL('image/png');
      onCropComplete(croppedImageUrl);
    };
    
    img.onerror = () => {
      console.error('이미지 로드 실패');
    };
    
    img.src = imageUrl;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        프로필 사진 편집
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: 400,
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 원형 가이드라인 */}
          <Box
            sx={{
              position: 'absolute',
              width: 200,
              height: 200,
              border: '2px solid rgba(0, 212, 255, 0.5)',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 2,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
          />
          
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Profile"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: 'center',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </Box>

        {/* 컨트롤 */}
        <Box sx={{ mt: 3 }}>
          <Typography gutterBottom>확대/축소</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ZoomOut />
            <Slider
              value={scale}
              onChange={handleScaleChange}
              min={0.5}
              max={3}
              step={0.1}
              sx={{ flex: 1 }}
            />
            <ZoomIn />
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RotateLeft />}
            onClick={() => handleRotate('left')}
          >
            왼쪽 회전
          </Button>
          <Button
            variant="outlined"
            startIcon={<RotateRight />}
            onClick={() => handleRotate('right')}
          >
            오른쪽 회전
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
            color: '#000',
          }}
        >
          적용
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper;
