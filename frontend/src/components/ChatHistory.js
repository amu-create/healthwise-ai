import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  TextField,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Message as MessageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { api } from '../utils/api';

const ChatHistory = ({ currentSessionId, onSelectSession, onNewChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chatbot/sessions/');
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('세션 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, session) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSession(session);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSession(null);
  };

  const handleEditStart = (session) => {
    setEditingId(session.id);
    setEditTitle(session.title || session.summary || '새 대화');
    handleMenuClose();
  };

  const handleEditSave = async () => {
    try {
      await api.patch(`/api/chatbot/sessions/${editingId}/`, {
        title: editTitle
      });
      await fetchSessions();
      setEditingId(null);
    } catch (error) {
      console.error('제목 수정 실패:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (sessionId) => {
    if (window.confirm('이 대화를 삭제하시겠습니까?')) {
      try {
        await api.delete(`/api/chatbot/sessions/${sessionId}/`);
        await fetchSessions();
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      } catch (error) {
        console.error('세션 삭제 실패:', error);
      }
    }
    handleMenuClose();
  };

  const formatSessionDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'a h:mm', { locale: ko });
    } else if (diffInHours < 48) {
      return '어제';
    } else if (diffInHours < 168) {
      return format(date, 'EEEE', { locale: ko });
    } else {
      return format(date, 'M월 d일', { locale: ko });
    }
  };

  const generateSessionTitle = (session) => {
    if (session.title) return session.title;
    if (session.summary) return session.summary.substring(0, 30) + '...';
    return '새 대화';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          대화 기록
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {sessions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              대화 기록이 없습니다
            </Typography>
          </Box>
        ) : (
          sessions.map((session) => (
            <ListItem
              key={session.id}
              disablePadding
              sx={{ mb: 0.5 }}
              secondaryAction={
                editingId === session.id ? (
                  <Box>
                    <IconButton size="small" onClick={handleEditSave}>
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleEditCancel}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, session)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
              <ListItemButton
                selected={currentSessionId === session.id}
                onClick={() => onSelectSession(session.id)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <MessageIcon sx={{ mr: 1.5, fontSize: 20 }} />
                {editingId === session.id ? (
                  <TextField
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    fullWidth
                    autoFocus
                    variant="standard"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleEditSave();
                      }
                    }}
                  />
                ) : (
                  <ListItemText
                    primary={generateSessionTitle(session)}
                    secondary={formatSessionDate(session.started_at)}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: session.id === currentSessionId ? 600 : 400,
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditStart(selectedSession)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          제목 수정
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedSession?.id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          삭제
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatHistory;
