import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Container } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { guestLimitsService } from '../services/guestLimitsService';
import LanguageSelector from '../components/common/LanguageSelector';

// Styled Components

const VideoBackground = styled('video')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'brightness(0.5) contrast(1.2)',
  zIndex: -2,
});

const GradientOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)',
  zIndex: -1,
});

const HeroSection = styled(Box)({
  height: '100vh',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

const GradientText = styled('span')({
  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 50%, #7B61FF 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'inline-block',
});

// 스티키 이미지 섹션 스타일
const MainContainer = styled(Box)({
  position: 'relative',
  display: 'flex',
  background: '#000',
  minHeight: '100vh',
});

const TextSide = styled(Box)(({ theme }) => ({
  flex: 1,
  paddingLeft: 120,
  paddingRight: 60,
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('lg')]: {
    paddingLeft: 80,
    paddingRight: 40,
  },
  [theme.breakpoints.down('md')]: {
    padding: '60px 40px',
  },
}));

const TextSection = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
});

const TextContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  maxWidth: 600,
  opacity: active ? 1 : 0,
  transform: active ? 'translateY(0)' : 'translateY(40px)',
  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const ImageSide = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'sticky',
  top: 0,
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  [theme.breakpoints.down('md')]: {
    position: 'relative',
    height: 600,
    padding: '40px 20px',
  },
}));

const ImageBox = styled(Box)({
  position: 'relative',
  width: '100%',
  maxWidth: 700,
  height: '80vh',
  maxHeight: 800,
  borderRadius: 30,
  overflow: 'hidden',
  boxShadow: '0 50px 100px rgba(0, 0, 0, 0.5)',
  background: '#111',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: 'linear-gradient(135deg, #00D4FF, #00FFB3, #7B61FF)',
    borderRadius: 30,
    zIndex: -1,
    opacity: 0.5,
    animation: 'borderGlow 3s ease-in-out infinite alternate',
  },
  '@keyframes borderGlow': {
    '0%': { opacity: 0.3 },
    '100%': { opacity: 0.7 },
  },
});

const StickyImage = styled('img', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  position: 'absolute',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: active ? 1 : 0,
  transition: 'opacity 0.8s ease',
  pointerEvents: 'none',
  zIndex: active ? 2 : 1,
}));

const Indicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  width: 50,
  height: 4,
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 2,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: active ? '100%' : '0%',
    height: '100%',
    background: 'linear-gradient(90deg, #00D4FF, #00FFB3)',
    transition: 'width 0.3s ease',
  },
}));

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { guestLogin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const textSectionRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // 스크롤 진행률
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / scrollHeight) * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for sticky images
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-section') || '0') - 1;
          setActiveFeature(index);
        }
      });
    }, observerOptions);

    // 현재 ref 배열의 복사본을 만들어 cleanup 시 사용
    const currentRefs = textSectionRefs.current.slice();
    
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const features = [
    {
      label: t('landing.features.feature1.label'),
      title: t('landing.features.feature1.title'),
      titleHighlight: t('landing.features.feature1.titleHighlight'),
      description: t('landing.features.feature1.description'),
      items: t('landing.features.feature1.items', { returnObjects: true }) as string[],
      image: '/images/chatbot.png',
      bgColor: 'rgba(0, 212, 255, 0.1)',
    },
    {
      label: t('landing.features.feature2.label'),
      title: t('landing.features.feature2.title'),
      titleHighlight: t('landing.features.feature2.titleHighlight'),
      description: t('landing.features.feature2.description'),
      items: t('landing.features.feature2.items', { returnObjects: true }) as string[],
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
      bgColor: 'rgba(0, 255, 179, 0.1)',
    },
    {
      label: t('landing.features.feature3.label'),
      title: t('landing.features.feature3.title'),
      titleHighlight: t('landing.features.feature3.titleHighlight'),
      description: t('landing.features.feature3.description'),
      items: t('landing.features.feature3.items', { returnObjects: true }) as string[],
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      bgColor: 'rgba(123, 97, 255, 0.1)',
    },
    {
      label: t('landing.features.feature4.label'),
      title: t('landing.features.feature4.title'),
      titleHighlight: t('landing.features.feature4.titleHighlight'),
      description: t('landing.features.feature4.description'),
      items: t('landing.features.feature4.items', { returnObjects: true }) as string[],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      bgColor: 'rgba(255, 107, 107, 0.1)',
    },
  ];

  const handleIndicatorClick = (index: number) => {
    const targetSection = textSectionRefs.current[index];
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: '#000',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.8s ease',
            }}
          >
            <Box textAlign="center" maxWidth={400}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 50%, #7B61FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 4,
                }}
              >
                {t('common.appName')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: 4,
                  textTransform: 'none',
                  mb: 4,
                }}
              >
                {t('common.tagline')}
              </Typography>
              <Box sx={{ width: '100%', position: 'relative' }}>
                <Box
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${loadingProgress}%`,
                      background: 'linear-gradient(90deg, #00D4FF, #00FFB3, #7B61FF)',
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                      boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -30,
                    right: 0,
                    color: '#00FFB3',
                    fontWeight: 700,
                  }}
                >
                  {Math.floor(loadingProgress)}%
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 1001,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #00D4FF, #00FFB3, #7B61FF)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
          }}
        />
      </Box>

      {/* Language Selector */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1100,
        }}
      >
        <LanguageSelector />
      </Box>

      {/* Hero Section */}
      <HeroSection>
        <VideoBackground autoPlay muted loop playsInline>
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </VideoBackground>
        <GradientOverlay />
        
        <Container maxWidth="lg">
          <Box textAlign="center" zIndex={10} position="relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: '#00FFB3',
                  letterSpacing: 4,
                  mb: 2,
                  display: 'block',
                }}
              >
                {t('landing.hero.subtitle')}
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  mb: 3,
                }}
              >
                <GradientText>{t('landing.hero.title1')}</GradientText>
                <br />
                {t('landing.hero.title2')}
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 5,
                  maxWidth: 800,
                  mx: 'auto',
                }}
              >
                {t('landing.hero.description')}
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    // 게스트 사용 기록 확인 및 디버깅
                    console.log('Guest login clicked');
                    guestLimitsService.debugUsage();
                    
                    guestLogin();
                    navigate('/dashboard');
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                    color: '#000',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 60,
                    textTransform: 'none',
                    letterSpacing: 0.5,
                    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 15px 40px rgba(0, 212, 255, 0.5)',
                    },
                  }}
                >
                  {t('landing.hero.guestButton')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 60,
                    textTransform: 'none',
                    letterSpacing: 0.5,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {t('landing.hero.memberButton')}
                </Button>
                <Button
                  variant="text"
                  size="large"
                  onClick={() => {
                    const element = document.getElementById('features');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 60,
                    textTransform: 'none',
                    letterSpacing: 0.5,
                    '&:hover': {
                      color: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {t('landing.hero.learnMore')}
                </Button>
              </Box>
            </motion.div>
          </Box>
        </Container>
        
        {/* Scroll Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'bounce 2s ease-in-out infinite',
            zIndex: 10,
            cursor: 'pointer',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
              '50%': { transform: 'translateX(-50%) translateY(10px)' },
            },
          }}
          onClick={() => {
            const element = document.getElementById('features');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.5)">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </Box>
      </HeroSection>

      {/* Sticky Features Section */}
      <MainContainer id="features">
        {/* Background Effects */}
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: activeFeature === index ? 1 : 0,
              transition: 'opacity 1s ease',
              pointerEvents: 'none',
              background: `radial-gradient(circle at ${index % 2 === 0 ? '20%' : '80%'} 50%, ${
                feature.bgColor
              } 0%, transparent 50%)`,
            }}
          />
        ))}

        {/* Text Side */}
        <TextSide>
          {features.map((feature, index) => (
            <TextSection
              key={index}
              ref={(el: HTMLDivElement | null) => {
                if (el) textSectionRefs.current[index] = el;
              }}
              data-section={index + 1}
            >
              <TextContent active={activeFeature === index}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: '#00FFB3',
                      letterSpacing: 3,
                      fontWeight: 700,
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    {feature.label}
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      mb: 3,
                      lineHeight: 1.1,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                    }}
                  >
                    <GradientText>{feature.titleHighlight}</GradientText>
                    <br />
                    {feature.title.replace(feature.titleHighlight, '').trim()}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      mb: 4,
                      lineHeight: 1.8,
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
                    {feature.items.map((item, itemIndex) => (
                      <motion.li
                        key={itemIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: itemIndex * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            py: 2.5,
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '1.1rem',
                            position: 'relative',
                            pl: 5,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              color: '#fff',
                              pl: 6,
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 20,
                              height: 20,
                              background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                              borderRadius: '50%',
                              opacity: 0.2,
                              transition: 'all 0.3s ease',
                            },
                            '&:hover::before': {
                              opacity: 1,
                              width: 25,
                              height: 25,
                            },
                          }}
                        >
                          {item}
                        </Typography>
                      </motion.li>
                    ))}
                  </Box>
                </motion.div>
              </TextContent>
            </TextSection>
          ))}
        </TextSide>

        {/* Image Side */}
        <ImageSide>
          <Box position="relative" width="100%" height="100%">
            <ImageBox>
              {features.map((feature, index) => (
                <StickyImage
                  key={index}
                  src={feature.image}
                  alt={feature.title}
                  active={activeFeature === index}
                />
              ))}
              
              {/* Image Info */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 40,
                  left: 40,
                  right: 40,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(20px)',
                  padding: 3,
                  borderRadius: 2.5,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  opacity: 0,
                  transform: 'translateY(20px)',
                  transition: 'all 0.5s ease',
                  ':hover': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                }}
              >
                <Typography variant="h6" sx={{ color: '#00FFB3', mb: 1 }}>
                  {t('landing.imageInfo.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {t('landing.imageInfo.description')}
                </Typography>
              </Box>
            </ImageBox>
            
            {/* Indicators */}
            <Box
              sx={{
                position: 'absolute',
                right: { xs: 'auto', md: -60 },
                top: { xs: 'auto', md: '50%' },
                bottom: { xs: -50, md: 'auto' },
                left: { xs: '50%', md: 'auto' },
                transform: {
                  xs: 'translateX(-50%)',
                  md: 'translateY(-50%)',
                },
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                gap: { xs: 2, md: 3 },
              }}
            >
              {features.map((_, index) => (
                <Box key={index} position="relative">
                  <Indicator
                    active={activeFeature === index}
                    onClick={() => handleIndicatorClick(index)}
                  />
                  <Typography
                    sx={{
                      position: 'absolute',
                      right: 60,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.8rem',
                      color: activeFeature === index ? '#00FFB3' : 'rgba(255, 255, 255, 0.3)',
                      fontWeight: 700,
                      opacity: { xs: 0, md: 1 },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    0{index + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </ImageSide>
      </MainContainer>

      {/* Service Features Section */}
      <Box
        sx={{
          py: 15,
          background: 'linear-gradient(to bottom, #000, #0a0a0a)',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h2"
              textAlign="center"
              sx={{
                fontWeight: 900,
                mb: 2,
              }}
            >
              {t('landing.services.title')} <GradientText>{t('landing.services.titleHighlight')}</GradientText>
            </Typography>
            <Typography
              variant="h5"
              textAlign="center"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                mb: 8,
              }}
            >
              {t('landing.services.subtitle')}
            </Typography>
          </motion.div>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 4,
              mb: 10,
            }}
          >
            {(t('landing.services.features', { returnObjects: true }) as Array<{title: string; description: string; limit: string}>).map((feature, index) => {
              const iconData = [
                { iconName: 'robot-01', color: '#00D4FF' },
                { iconName: 'body-part-muscle', color: '#FFB800' },
                { iconName: 'music-note-01', color: '#7B61FF' },
                { iconName: 'vegetarian-food', color: '#FF6B6B' },
                { iconName: 'running-shoes', color: '#00FFB3' },
                { iconName: 'dashboard-circle', color: '#00D4FF' },
                { iconName: 'notification-03', color: '#FFB800' },
                { iconName: 'user-circle', color: '#7B61FF' },
              ][index];
              
              return (
                <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      transform: 'translateY(-5px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2.5,
                      background: `linear-gradient(135deg, ${iconData.color}20, ${iconData.color}10)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      position: 'relative',
                      '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: -1,
                      borderRadius: 2.5,
                      padding: 1,
                      background: `linear-gradient(135deg, ${iconData.color}, transparent)`,
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      },
                      '&:hover::before': {
                      opacity: 0.5,
                      },
                      }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={iconData.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <use href={`/icons/hugeicons.svg#${iconData.iconName}`} />
                    </svg>
                  </Box>
                  <Typography variant="h5" fontWeight={700} mb={1}>
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}
                  >
                    {feature.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: feature.limit.includes('Members') || feature.limit.includes('Solo miembros') || feature.limit.includes('회원 전용') ? '#FF6B6B' : '#00FFB3',
                      fontWeight: 600,
                      display: 'block',
                    }}
                  >
                    {feature.limit}
                  </Typography>
                </Box>
              </motion.div>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box
        sx={{
          py: 15,
          background: 'linear-gradient(to bottom, #0a0a0a, #000)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          },
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h2"
              textAlign="center"
              sx={{
                fontWeight: 900,
                mb: 2,
              }}
            >
              {t('landing.pricing.title')} <GradientText>{t('landing.pricing.titleHighlight')}</GradientText>
            </Typography>
            <Typography
              variant="h5"
              textAlign="center"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                mb: 6,
              }}
            >
              {t('landing.pricing.subtitle')}
            </Typography>
          </motion.div>

          {/* Pricing Toggle */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mb: 8,
            }}
          >
            <Typography
              sx={{
                color: activeFeature === 0 ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: 600,
              }}
            >
              {t('landing.pricing.monthly')}
            </Typography>
            <Box
              onClick={() => setActiveFeature(activeFeature === 0 ? 1 : 0)}
              sx={{
                width: 60,
                height: 30,
                borderRadius: 30,
                background: 'rgba(255, 255, 255, 0.1)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 3,
                  left: activeFeature === 0 ? 3 : 33,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                  transition: 'all 0.3s ease',
                },
              }}
            />
            <Typography
              sx={{
                color: activeFeature === 1 ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: 600,
              }}
            >
              {t('landing.pricing.yearly')}
            </Typography>
          </Box>

          {/* Pricing Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
              maxWidth: 1000,
              mx: 'auto',
            }}
          >
            {[
              {
                name: t('landing.pricing.plans.free.name'),
                price: activeFeature === 0 ? '0' : '0',
                period: activeFeature === 0 ? t('landing.pricing.perMonth') : t('landing.pricing.perYear'),
                features: t('landing.pricing.plans.free.features', { returnObjects: true }) as string[],
                notIncluded: t('landing.pricing.plans.free.notIncluded', { returnObjects: true }) as string[],
                cta: t('landing.pricing.plans.free.cta'),
                recommended: false,
              },
              {
                name: t('landing.pricing.plans.pro.name'),
                price: activeFeature === 0 ? '9,900' : '99,000',
                period: activeFeature === 0 ? t('landing.pricing.perMonth') : t('landing.pricing.perYear'),
                features: t('landing.pricing.plans.pro.features', { returnObjects: true }) as string[],
                notIncluded: t('landing.pricing.plans.pro.notIncluded', { returnObjects: true }) as string[],
                cta: t('landing.pricing.plans.pro.cta'),
                recommended: true,
              },
              {
                name: t('landing.pricing.plans.team.name'),
                price: activeFeature === 0 ? '29,900' : '299,000',
                period: activeFeature === 0 ? t('landing.pricing.perMonth') : t('landing.pricing.perYear'),
                features: t('landing.pricing.plans.team.features', { returnObjects: true }) as string[],
                notIncluded: t('landing.pricing.plans.team.notIncluded', { returnObjects: true }) as string[],
                cta: t('landing.pricing.plans.team.cta'),
                recommended: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    background: plan.recommended
                      ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 179, 0.1))'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 3,
                    border: plan.recommended
                      ? '2px solid rgba(0, 212, 255, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  {plan.recommended && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -15,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                        color: '#000',
                        px: 3,
                        py: 0.5,
                        borderRadius: 20,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {t('landing.pricing.recommended')}
                    </Box>
                  )}
                  <Typography variant="h4" fontWeight={700} mb={2}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h2"
                      component="span"
                      sx={{ fontWeight: 900 }}
                    >
                      {t('landing.pricing.currency')}{plan.price}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ color: 'rgba(255, 255, 255, 0.6)', ml: 1 }}
                    >
                      {plan.period}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 4 }}>
                    {plan.features.map((feature, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          color: 'rgba(255, 255, 255, 0.8)',
                          '&::before': {
                            content: '"✓"',
                            color: '#00FFB3',
                            fontWeight: 700,
                            mr: 2,
                          },
                        }}
                      >
                        {feature}
                      </Typography>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          color: 'rgba(255, 255, 255, 0.3)',
                          textDecoration: 'line-through',
                          '&::before': {
                            content: '"✕"',
                            color: 'rgba(255, 255, 255, 0.3)',
                            fontWeight: 700,
                            mr: 2,
                            textDecoration: 'none',
                          },
                        }}
                      >
                        {feature}
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    variant={plan.recommended ? 'contained' : 'outlined'}
                    onClick={() => navigate(plan.price === '0' ? '/dashboard' : '/register')}
                    sx={{
                      py: 1.5,
                      borderRadius: 30,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      ...(plan.recommended
                        ? {
                            background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                            color: '#000',
                            '&:hover': {
                              boxShadow: '0 10px 30px rgba(0, 212, 255, 0.5)',
                            },
                          }
                        : {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: '#fff',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          }),
                    }}
                  >
                    {plan.cta}
                  </Button>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 20,
          background: 'linear-gradient(to bottom, #000, #0a0a0a)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          },
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 3,
              }}
            >
              <GradientText>{t('landing.cta.ready')}</GradientText>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                mb: 6,
              }}
            >
              {t('landing.cta.experience')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                color: '#000',
                px: 8,
                py: 2.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 60,
                textTransform: 'uppercase',
                letterSpacing: 1,
                boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 15px 40px rgba(0, 212, 255, 0.5)',
                },
              }}
            >
              {t('landing.cta.startFree')}
            </Button>
          </motion.div>
        </Container>
      </Box>
    </>
  );
};

export default Landing;
