import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Send,
  Person,
  Clear,
  Info,
  FitnessCenter,
  Restaurant,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { guestLimitsService } from '../services/guestLimitsService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatSessionList from '../components/ChatSessionList';
import ProfileAvatar from '../components/ProfileAvatar';
import '../styles/chat.css';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
  context?: any;
  session_id?: number;
}

interface ChatStatus {
  status: string;
  user_context: any;
  message_count: number;
  has_profile: boolean;
}

// 최적화된 메시지 컴포넌트
const MessageComponent = React.memo(({ 
  message, 
  isUser, 
  profileImageKey, 
  user,
  shouldAnimate = true,
  language
}: { 
  message: Message; 
  isUser: boolean; 
  profileImageKey: number;
  user: any;
  shouldAnimate?: boolean;
  language: string;
}) => {
  const content = (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: '70%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isUser ? 'primary.main' : 'transparent',
              color: 'white',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {isUser ? (
              <ProfileAvatar
                src={user?.profile?.profile_image || ''}
                name={user?.username}
                size={40}
              />
            ) : (
              <img 
                src="/images/avatar-bot.png" 
                alt="AI Assistant" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }} 
              />
            )}
          </Box>
          
          <Paper
            sx={{
              p: 2,
              background: isUser
                ? 'linear-gradient(135deg, #00D4FF, #00FFB3)'
                : 'rgba(17, 17, 17, 0.8)',
              color: isUser ? '#000' : '#fff',
              backdropFilter: 'blur(20px)',
              border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.message}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                opacity: 0.7,
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString(language, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Paper>
        </Box>
      </Box>
  );
  
  return shouldAnimate ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  ) : content;
});

// 가상화된 메시지 렌더러 컴포넌트
const MessageRow = React.memo(({ 
  index, 
  style, 
  messages, 
  profileImageKey, 
  user, 
  setItemSize,
  language
}: { 
  index: number; 
  style: React.CSSProperties;
  messages: Message[];
  profileImageKey: number;
  user: any;
  setItemSize: (index: number, size: number) => void;
  language: string;
}) => {
  const message = messages[index];
  const isUser = message.sender === 'user';
  const shouldAnimate = messages.length - index <= 5;
  const measuredRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measuredRef.current) {
      const height = measuredRef.current.getBoundingClientRect().height;
      if (height && height > 0) {
        setItemSize(index, height);
      }
    }
  }, [index, setItemSize]);

  return (
    <div style={style}>
      <div ref={measuredRef}>
        <MessageComponent
          message={message}
          isUser={isUser}
          profileImageKey={profileImageKey}
          user={user}
          shouldAnimate={shouldAnimate}
          language={language}
        />
      </div>
    </div>
  );
});

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [profileImageKey, setProfileImageKey] = useState(0);
  const [guestLimitDialogOpen, setGuestLimitDialogOpen] = useState(false);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<List>(null);
  const itemSizeCache = useRef<{ [key: number]: number }>({});

  // 메시지 높이를 계산하는 함수
  const getItemSize = useCallback((index: number) => {
    // 캐시된 크기가 있으면 반환
    if (itemSizeCache.current[index]) {
      return itemSizeCache.current[index];
    }
    // 기본 예상 높이 (실제 렌더링 후 조정됨)
    return 120;
  }, []);

  const setItemSize = useCallback((index: number, size: number) => {
    itemSizeCache.current[index] = size;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, []);

  // 채팅 상태 로드
  useEffect(() => {
    loadChatStatus();
    loadActiveSession();
    // 비회원인 경우 남은 사용 횟수 확인
    if (!user) {
      setRemainingUses(guestLimitsService.getRemainingUses('AI_CHAT'));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // scrollToBottom 함수를 먼저 정의
  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, "end");
    }
  }, [messages.length]);

  // 프로필 이미지 업데이트 이벤트 리스너
  useEffect(() => {
    const handleProfileImageUpdate = () => {
      setProfileImageKey(prev => prev + 1);
    };
    
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  // 메시지 목록이 업데이트될 때 스크롤
  useEffect(() => {
    // 새 메시지가 추가될 때만 스크롤
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // 메시지가 변경될 때 캐시 초기화
  useEffect(() => {
    itemSizeCache.current = {};
  }, [messages]);

  const loadChatStatus = async () => {
    try {
      const response = await api.get('/chatbot/status/');
      setChatStatus(response.data);
    } catch (error) {
      console.error('Failed to load chat status:', error);
    }
  };

  const loadActiveSession = async () => {
    try {
      const response = await api.get('/chatbot/sessions/active/');
      if (response.data.session && response.data.session.id) {
        setCurrentSessionId(response.data.session.id);
        loadSessionMessages(response.data.session.id);
      } else if (response.data.session_id) {
        setCurrentSessionId(response.data.session_id);
        loadSessionMessages(response.data.session_id);
      } else {
        // 게스트 세션인 경우
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load active session:', error);
      // 게스트인 경우 오류 무시
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const loadSessionMessages = async (sessionId: number | string | null) => {
    if (!sessionId || sessionId === 'guest-session') {
      // 게스트 세션인 경우 메시지 로드 건너뛰기
      setLoadingHistory(false);
      return;
    }
    
    try {
      setLoadingHistory(true);
      const response = await api.get(`/chatbot/sessions/${sessionId}/messages/`);
      setMessages(response.data.messages);
      setCurrentSessionId(Number(sessionId));
    } catch (error) {
      console.error('Failed to load session messages:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSessionSelect = (sessionId: number) => {
    loadSessionMessages(sessionId);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const response = await api.post('/chatbot/sessions/');
      setCurrentSessionId(response.data.session_id);
      setMessages([]);
      setRefreshTrigger(prev => prev + 1); // 세션 목록 새로고침
      if (isMobile) {
        setDrawerOpen(false);
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    // 비회원 사용 제한 체크
    if (!user) {
      if (!guestLimitsService.canUseFeature('AI_CHAT')) {
        setGuestLimitDialogOpen(true);
        return;
      }
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');

    // 사용자 메시지 추가
    const tempUserMessage: Message = {
      id: Date.now(),
      sender: 'user',
      message: userMessage,
      timestamp: new Date().toISOString(),
      session_id: currentSessionId || undefined,
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      setLoading(true);
      
      const response = await api.post('/chatbot/', {
        message: userMessage,
        language: i18n.language, // 현재 언어 전달
      });

      // 봇 응답 추가
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        message: response.data.raw_response || response.data.response,
        timestamp: new Date().toISOString(),
        context: {
          sources: response.data.sources,
          user_context: response.data.user_context,
        },
        session_id: response.data.session_id || currentSessionId || undefined,
      };
      setMessages(prev => [...prev, botMessage]);
      
      // 세션 목록 새로고침 (메시지가 추가되었으므로)
      setRefreshTrigger(prev => prev + 1);

      // 메시지 카운트 업데이트
      if (chatStatus) {
        setChatStatus({
          ...chatStatus,
          message_count: chatStatus.message_count + 2,
        });
      }
      
      // 비회원인 경우 사용 횟수 증가
      if (!user) {
        guestLimitsService.incrementUsage('AI_CHAT');
        setRemainingUses(guestLimitsService.getRemainingUses('AI_CHAT'));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || t('errors.general');
      setError(errorMessage);
      
      // 실패한 메시지 제거
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/chatbot/history/clear/');
      setMessages([]);
      setClearDialogOpen(false);
      if (chatStatus) {
        setChatStatus({
          ...chatStatus,
          message_count: 0,
        });
      }
      // 새 세션 시작
      handleNewSession();
    } catch (error) {
      setError(t('pages.chat.error'));
    }
  };

  // 추천 질문을 다국어화
  const suggestedQuestions = [
    t('pages.chat.suggestions.exercise'),
    t('pages.chat.suggestions.nutrition'),
    t('pages.chat.suggestions.health'),
    t('pages.chat.suggestions.stress'),
  ];

  // 운동 경험 번역
  const getExperienceLabel = (experience: string) => {
    const experienceMap: { [key: string]: string } = {
      'beginner': t('profile.beginner'),
      'intermediate': t('profile.intermediate'),
      'advanced': t('profile.advanced'),
      'expert': t('profile.expert'),
    };
    return experienceMap[experience] || experience;
  };

  // 성별 번역
  const getGenderLabel = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      'male': t('profile.male'),
      'female': t('profile.female'),
      'other': t('profile.other'),
    };
    return genderMap[gender] || gender;
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex' }}>
      {/* 비회원 사용 제한 알림 */}
      {!user && remainingUses !== null && (
        <Alert
          severity="warning"
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            mt: 2,
          }}
        >
          {t('pages.chat.guestLimit', { count: remainingUses })}
        </Alert>
      )}

      {/* 대화 목록 Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerOpen ? 280 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',
          },
        }}
      >
        <ChatSessionList
          onSessionSelect={handleSessionSelect}
          currentSessionId={currentSessionId}
          onNewSession={handleNewSession}
          onSessionDeleted={() => {
            // 삭제 후 새 세션 시작
            handleNewSession();
          }}
          onSessionRenamed={() => {
            // 필요시 추가 동작
            setRefreshTrigger(prev => prev + 1);
          }}
          refreshTrigger={refreshTrigger}
        />
      </Drawer>

      {/* 메인 채팅 영역 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: drawerOpen && !isMobile ? 0 : 0 }}>
        {/* 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {(isMobile || !drawerOpen) && (
                <IconButton onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h4" fontWeight={900}>
                {t('pages.chat.title')}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={() => setClearDialogOpen(true)}
              disabled={messages.length === 0}
            >
              {t('common.delete')}
            </Button>
          </Box>

          {/* 사용자 정보 표시 */}
          {chatStatus?.has_profile && chatStatus.user_context && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={<Person />}
                label={`${chatStatus.user_context.age} ${t('common.years')} ${getGenderLabel(chatStatus.user_context.gender)}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<FitnessCenter />}
                label={getExperienceLabel(chatStatus.user_context.exercise_experience)}
                size="small"
                color="secondary"
                variant="outlined"
              />
              {chatStatus.user_context.diseases.length > 0 && (
                <Chip
                  icon={<Info />}
                  label={`${t('profile.diseases')} ${chatStatus.user_context.diseases.length}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {chatStatus.user_context.allergies.length > 0 && (
                <Chip
                  icon={<Restaurant />}
                  label={`${t('profile.allergies')} ${chatStatus.user_context.allergies.length}`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          )}

          {!chatStatus?.has_profile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('pages.chat.profileHint')}
            </Alert>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 메시지 영역 */}
        <Paper
          sx={{
            flex: 1,
            p: 3,
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 메시지 영역 - 가상화 적용 */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              mb: 2,
            }}
          >
            {loadingHistory ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : messages.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100%"
                gap={3}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    opacity: 0.8,
                  }}
                >
                  <img 
                    src="/images/avatar-bot.png" 
                    alt="AI Assistant" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                </Box>
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  {t('pages.chat.welcome')}
                </Typography>
                
                {/* 추천 질문 */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {suggestedQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      clickable
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (setInputMessage && typeof setInputMessage === 'function') {
                          setInputMessage(question);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <AutoSizer>
                {({ height, width }: { height: number; width: number }) => (
                  <List
                    ref={listRef}
                    height={height}
                    width={width}
                    itemCount={messages.length}
                    itemSize={getItemSize}
                    overscanCount={5}
                    style={{
                      overflowX: 'hidden',
                    }}
                    className="message-list"
                  >
                    {({ index, style }) => (
                      <MessageRow
                        index={index}
                        style={style}
                        messages={messages}
                        profileImageKey={profileImageKey}
                        user={user}
                        setItemSize={setItemSize}
                        language={i18n.language}
                      />
                    )}
                  </List>
                )}
              </AutoSizer>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 입력 영역 */}
          <Box>
            {!user && remainingUses !== null && remainingUses > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {t('pages.chat.messagesRemaining', { count: remainingUses })}
              </Typography>
            )}
            <Box display="flex" gap={1}>
              <TextField
              ref={inputRef}
              fullWidth
              placeholder={t('pages.chat.messagePlaceholder')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={loading}
              multiline
              maxRows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: '#000',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : <Send />}
            </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* 대화 삭제 확인 다이얼로그 */}
        <Dialog
          open={clearDialogOpen}
          onClose={() => setClearDialogOpen(false)}
        >
          <DialogTitle>{t('pages.chat.deleteAllTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('pages.chat.deleteConfirm')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleClearHistory} color="error" variant="contained">
              {t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 비회원 사용 제한 다이얼로그 */}
        <Dialog
          open={guestLimitDialogOpen}
          onClose={() => setGuestLimitDialogOpen(false)}
        >
          <DialogTitle>{t('pages.chat.limitExceededTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('pages.chat.limitExceededMessage')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGuestLimitDialogOpen(false)}>{t('common.close')}</Button>
            <Button
              onClick={() => navigate('/register')}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                color: '#000',
              }}
            >
              {t('auth.register')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Chat;
