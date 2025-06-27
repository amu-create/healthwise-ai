import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  InputAdornment,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send,
  Search,
  Add,
  MoreVert,
  ImageOutlined,
  AttachFile,
  EmojiEmotions,
  Person,
  Circle,
  ArrowBack,
  Delete,
  Block,
  Report,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { getNetworkAwareProfileImageUrl } from '../utils/profileUtils';
import { useConversationWebSocket } from '../services/websocket/useWebSocket';

interface User {
  id: number;
  username: string;
  email?: string;
  profile_picture_url?: string;
  profile?: {
    profile_image?: string;
  };
}

interface Message {
  id: number;
  sender: User;
  content: string;
  media_file?: string;
  media_type?: string;
  is_read: boolean;
  read_at?: string;
  message_type: string;
  reactions: MessageReaction[];
  referenced_story?: any;
  referenced_post?: any;
  created_at: string;
  updated_at: string;
}

interface MessageReaction {
  id: number;
  user: User;
  emoji: string;
  created_at: string;
}

interface Conversation {
  id: number;
  participants: User[];
  last_message?: Message;
  unread_count: number;
  other_participant?: User;
  created_at: string;
  updated_at: string;
}

interface TypingUser {
  userId: number;
  username: string;
}

// WebSocket 연결 상태
let ws: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;
let typingTimeout: NodeJS.Timeout | null = null;

export default function DirectMessages() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchingMessages, setSearchingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionMessageId, setReactionMessageId] = useState<number | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionAnchorEl, setReactionAnchorEl] = useState<null | HTMLElement>(null);

  // WebSocket 연결 설정
  const connectWebSocket = useCallback(() => {
    if (!token || !user) return;

    const wsUrl = selectedConversation 
      ? `ws://localhost:8000/ws/dm/${selectedConversation.id}/?token=${token}`
      : `ws://localhost:8000/ws/dm/?token=${token}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // 재연결 인터벌 정리
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // 재연결 시도
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 5000);
      }
    };

    return () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, [token, user, selectedConversation]);

  // WebSocket 메시지 처리
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        handleNewMessage(data.message);
        break;
      case 'dm_notification':
        handleDMNotification(data);
        break;
      case 'typing_status':
        handleTypingStatus(data);
        break;
      case 'reaction_added':
        handleReactionAdded(data.reaction);
        break;
      case 'reaction_removed':
        handleReactionRemoved(data.reaction);
        break;
      case 'messages_marked_read':
        handleMessagesMarkedRead(data);
        break;
    }
  };

  const handleNewMessage = (message: Message) => {
    // 현재 대화방의 메시지인 경우 추가
    if (selectedConversation && message.sender.id !== user?.id) {
      setMessages(prev => [...prev, message]);
      // 자동 스크롤
      setTimeout(scrollToBottom, 100);
    }
    // 대화 목록 업데이트
    fetchConversations();
  };

  const handleDMNotification = (data: any) => {
    // 새 메시지 알림 표시
    if (data.message.sender.id !== user?.id) {
      toast.info(`${data.message.sender.username}: ${data.message.content}`);
    }
    // 대화 목록 업데이트
    fetchConversations();
  };

  const handleTypingStatus = (data: any) => {
    if (data.is_typing) {
      setTypingUsers(prev => {
        const exists = prev.find(u => u.userId === data.user_id);
        if (!exists) {
          return [...prev, { userId: data.user_id, username: data.username }];
        }
        return prev;
      });
    } else {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.user_id));
    }
  };

  const handleReactionAdded = (reaction: any) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === reaction.message_id) {
        return {
          ...msg,
          reactions: [...msg.reactions, {
            id: Date.now(),
            user: { id: reaction.user_id, username: reaction.username } as User,
            emoji: reaction.emoji,
            created_at: reaction.created_at || new Date().toISOString()
          }]
        };
      }
      return msg;
    }));
  };

  const handleReactionRemoved = (reaction: any) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === reaction.message_id) {
        return {
          ...msg,
          reactions: msg.reactions.filter(r => 
            !(r.user.id === reaction.user_id && r.emoji === reaction.emoji)
          )
        };
      }
      return msg;
    }));
  };

  const handleMessagesMarkedRead = (data: any) => {
    if (data.conversation_id === selectedConversation?.id) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        is_read: true,
        read_at: new Date().toISOString()
      })));
    }
  };

  useEffect(() => {
    fetchConversations();
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (token && user) {
      connectWebSocket();
    }
    return () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/social/conversations/');
      setConversations(response.data.results || response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error(t('messages.errorFetchingConversations'));
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    setLoadingMessages(true);
    try {
      const response = await api.get(`/social/conversations/${conversationId}/messages/`);
      setMessages(response.data.results || []);
      
      // 메시지 읽음 처리
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'mark_read',
          conversation_id: conversationId
        }));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error(t('messages.errorFetchingMessages'));
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && !selectedFile)) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      
      // content는 항상 포함 (빈 문자열이라도)
      formData.append('content', newMessage.trim() || '');
      
      // message_type 추가
      formData.append('message_type', 'text');
      
      if (selectedFile) {
        formData.append('media_file', selectedFile);
      }

      const response = await api.post(
        `/social/conversations/${selectedConversation.id}/send_message/`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setSelectedFile(null);
      
      // 대화 목록 업데이트
      fetchConversations();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      toast.error(t('messages.errorSendingMessage'));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedConversation) return;

    ws.send(JSON.stringify({
      type: 'typing',
      conversation_id: selectedConversation.id,
      is_typing: isTyping
    }));

    // 타이핑 타임아웃 관리
    if (isTyping) {
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    }
  };

  const handleTypingInput = (value: string) => {
    setNewMessage(value);
    handleTyping(true);
  };

  const addReaction = async (messageId: number, emoji: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'add_reaction',
      message_id: messageId,
      emoji: emoji
    }));
    
    setShowReactionPicker(false);
    setReactionMessageId(null);
  };

  const searchUsersForConversation = async (query: string) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      const response = await api.get(`/social/profiles/?search=${query}`);
      const profiles = response.data.results || [];
      // 현재 로그인한 유저 제외
      const filteredUsers = profiles
        .map((profile: any) => profile.user)
        .filter((u: User) => u.id !== user?.id);
      setSearchUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const startNewConversation = async (recipient: User) => {
    try {
      const response = await api.post('/social/conversations/', {
        participant_id: recipient.id
      });
      
      const newConversation = response.data;
      setSelectedConversation(newConversation);
      setMessages([]);
      setNewConversationOpen(false);
      setUserSearchQuery('');
      setSearchUsers([]);
      
      // 대화 목록 업데이트
      fetchConversations();
      
      // WebSocket 재연결 (새 대화방으로)
      if (ws) {
        ws.close();
      }
      connectWebSocket();
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error(t('messages.errorStartingConversation'));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(t('messages.fileTooLarge'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('social.justNow');
    if (diffMins < 60) return t('social.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('social.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('social.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return t('messages.yesterday') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.other_participant;
    return otherUser && otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      await api.delete(`/social/conversations/${selectedConversation.id}/leave/`);
      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
      toast.success(t('messages.conversationDeleted'));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error(t('messages.errorDeletingConversation'));
    }
    handleMenuClose();
  };

  const searchMessages = async () => {
    if (!messageSearchQuery.trim()) return;

    setSearchingMessages(true);
    try {
      const response = await api.get(`/social/messages/search/?q=${messageSearchQuery}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to search messages:', error);
    } finally {
      setSearchingMessages(false);
    }
  };

  const handleReactionClick = (event: React.MouseEvent<HTMLElement>, messageId: number) => {
    setReactionAnchorEl(event.currentTarget);
    setReactionMessageId(messageId);
    setShowReactionPicker(true);
  };

  const commonEmojis = ['❤️', '😂', '😊', '👍', '😮', '😢'];

  return (
    <Box>
      <Paper sx={{ height: '70vh', display: 'flex' }}>
        {/* Conversations List */}
        <Box
          sx={{
            width: { xs: '100%', md: '350px' },
            borderRight: 1,
            borderColor: 'divider',
            display: { xs: selectedConversation ? 'none' : 'block', md: 'block' },
          }}
        >
          <Box p={2} display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              placeholder={t('messages.searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
            <IconButton
              color="primary"
              onClick={() => setNewConversationOpen(true)}
              size="small"
            >
              <Add />
            </IconButton>
          </Box>
          
          <Divider />
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ overflow: 'auto', maxHeight: 'calc(70vh - 80px)' }}>
              {filteredConversations.map((conversation) => {
                const otherUser = conversation.other_participant;
                if (!otherUser) return null;

                return (
                  <ListItem
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      fetchMessages(conversation.id);
                    }}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedConversation?.id === conversation.id ? 'action.selected' : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedConversation?.id === conversation.id ? 'action.selected' : 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={getNetworkAwareProfileImageUrl(otherUser)}>
                        {otherUser.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography>{otherUser.username}</Typography>
                          {conversation.unread_count > 0 && (
                            <Chip
                              label={conversation.unread_count}
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        conversation.last_message && (
                          <>
                            <Typography component="span" variant="body2" color="text.secondary" display="block" noWrap>
                              {conversation.last_message.sender.id === user?.id && t('messages.you') + ': '}
                              {conversation.last_message.content}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary" display="block">
                              {formatTime(conversation.last_message.created_at)}
                            </Typography>
                          </>
                        )
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
          }}
        >
          {selectedConversation ? (
            <>
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <IconButton
                  sx={{ display: { md: 'none' } }}
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowBack />
                </IconButton>
                {selectedConversation.other_participant && (
                  <>
                    <Avatar 
                      src={getNetworkAwareProfileImageUrl(selectedConversation.other_participant)}
                    >
                      {selectedConversation.other_participant.username[0].toUpperCase()}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6">
                        {selectedConversation.other_participant.username}
                      </Typography>
                      {typingUsers.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {t('messages.typing')}...
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
                <IconButton onClick={handleMenuOpen}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleDeleteConversation}>
                    <Delete sx={{ mr: 1 }} />
                    {t('messages.deleteConversation')}
                  </MenuItem>
                </Menu>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {loadingMessages ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender.id === user?.id;
                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                      >
                        {!isOwnMessage && (
                          <Avatar
                            src={getNetworkAwareProfileImageUrl(message.sender)}
                            sx={{ width: 32, height: 32 }}
                          >
                            {message.sender.username[0].toUpperCase()}
                          </Avatar>
                        )}
                        <Box>
                          <Paper
                            sx={{
                              p: 1.5,
                              maxWidth: '350px',
                              bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                              position: 'relative',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => handleReactionClick(e, message.id)}
                          >
                            <Typography variant="body1">{message.content}</Typography>
                            {message.media_file && (
                              <Box mt={1}>
                                {message.media_type === 'image' ? (
                                  <img 
                                    src={message.media_file} 
                                    alt="attachment" 
                                    style={{ maxWidth: '100%', borderRadius: 4 }}
                                  />
                                ) : (
                                  <Chip
                                    icon={<AttachFile />}
                                    label={t('messages.attachment')}
                                    size="small"
                                  />
                                )}
                              </Box>
                            )}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.7,
                                display: 'block',
                                mt: 0.5
                              }}
                            >
                              {formatMessageTime(message.created_at)}
                              {isOwnMessage && message.is_read && ' ✓✓'}
                            </Typography>
                          </Paper>
                          {message.reactions.length > 0 && (
                            <Box display="flex" gap={0.5} mt={0.5}>
                              {message.reactions.map((reaction, index) => (
                                <Chip
                                  key={index}
                                  label={`${reaction.emoji} ${reaction.user.username}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-end',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <IconButton onClick={() => fileInputRef.current?.click()}>
                  <AttachFile />
                </IconButton>
                <IconButton onClick={() => fileInputRef.current?.click()}>
                  <ImageOutlined />
                </IconButton>
                <TextField
                  fullWidth
                  placeholder={t('messages.typeMessage')}
                  value={newMessage}
                  onChange={(e) => handleTypingInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  multiline
                  maxRows={4}
                  size="small"
                />
                <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <EmojiEmotions />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                >
                  <Send />
                </IconButton>
              </Box>
              
              {selectedFile && (
                <Box px={2} pb={1}>
                  <Chip
                    label={selectedFile.name}
                    onDelete={() => setSelectedFile(null)}
                    size="small"
                  />
                </Box>
              )}
            </>
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <Typography variant="h6" color="text.secondary">
                {t('messages.selectConversation')}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationOpen} onClose={() => setNewConversationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('messages.newConversation')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              placeholder={t('messages.searchUsers')}
              value={userSearchQuery}
              onChange={(e) => {
                setUserSearchQuery(e.target.value);
                searchUsersForConversation(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            
            <List sx={{ mt: 2 }}>
              {searchUsers.map((user) => (
                <ListItem
                  key={user.id}
                  onClick={() => startNewConversation(user)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemAvatar>
                    <Avatar src={getNetworkAwareProfileImageUrl(user)}>
                      {user.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationOpen(false)}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            zIndex: 1000,
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiObject: EmojiClickData) => {
              handleTypingInput(newMessage + emojiObject.emoji);
              setShowEmojiPicker(false);
            }}
          />
        </Box>
      )}

      {/* Reaction Picker Menu */}
      <Menu
        anchorEl={reactionAnchorEl}
        open={showReactionPicker}
        onClose={() => {
          setShowReactionPicker(false);
          setReactionMessageId(null);
        }}
      >
        <Box sx={{ display: 'flex', p: 1 }}>
          {commonEmojis.map(emoji => (
            <IconButton
              key={emoji}
              onClick={() => reactionMessageId && addReaction(reactionMessageId, emoji)}
              size="small"
            >
              <Typography fontSize={20}>{emoji}</Typography>
            </IconButton>
          ))}
        </Box>
      </Menu>
    </Box>
  );
}