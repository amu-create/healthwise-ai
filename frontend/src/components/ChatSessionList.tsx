import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Chat,
  Add,
  Delete,
  Edit,
  MoreVert,
  AccessTime,
  Message,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface ChatSession {
  id: number;
  session_number: number;
  title: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  message_count: number;
  last_message_time: string | null;
}

interface ChatSessionListProps {
  onSessionSelect: (sessionId: number) => void;
  currentSessionId: number | null;
  onNewSession: () => void;
  onSessionDeleted: () => void;
  onSessionRenamed: () => void;
  refreshTrigger?: number;
}

const ChatSessionList: React.FC<ChatSessionListProps> = ({
  onSessionSelect,
  currentSessionId,
  onNewSession,
  onSessionDeleted,
  onSessionRenamed,
  refreshTrigger,
}) => {
  const { t, i18n } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSessionId, setMenuSessionId] = useState<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chatbot/sessions/');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSessionId(null);
  };

  const handleRename = (session: ChatSession) => {
    setSelectedSession(session);
    setNewTitle(session.title);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = (session: ChatSession) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmRename = async () => {
    if (!selectedSession || !newTitle.trim()) return;

    try {
      await api.patch(`/chatbot/sessions/${selectedSession.id}/`, {
        title: newTitle.trim(),
      });
      setRenameDialogOpen(false);
      loadSessions();
      onSessionRenamed();
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedSession) return;

    try {
      await api.delete(`/chatbot/sessions/${selectedSession.id}/`);
      setDeleteDialogOpen(false);
      loadSessions();
      onSessionDeleted();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    const locales = {
      ko: ko,
      en: enUS,
      es: es,
    };
    const currentLocale = locales[i18n.language as keyof typeof locales] || enUS;

    if (diffInDays === 0) {
      return format(date, 'HH:mm', { locale: currentLocale });
    } else if (diffInDays === 1) {
      return t('common.yesterday');
    } else if (diffInDays < 7) {
      return format(date, 'EEEE', { locale: currentLocale });
    } else {
      if (i18n.language === 'ko') {
        return format(date, 'MM월 dd일', { locale: currentLocale });
      } else if (i18n.language === 'es') {
        return format(date, 'dd \\de MMMM', { locale: currentLocale });
      } else {
        return format(date, 'MMM dd', { locale: currentLocale });
      }
    }
  };

  return (
    <>
      <Paper
        sx={{
          width: 280,
          height: '100%',
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            onClick={onNewSession}
            sx={{
              background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            {t('pages.chat.newChat')}
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : sessions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Chat sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography color="text.secondary">
                {t('pages.chat.noHistory')}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {sessions.map((session) => (
                <ListItem
                  key={session.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, session.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    selected={session.id === currentSessionId}
                    onClick={() => onSessionSelect(session.id)}
                    sx={{
                      '&.Mui-selected': {
                        background: 'rgba(0, 212, 255, 0.1)',
                        borderLeft: '3px solid #00D4FF',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`#${session.session_number}`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.75rem',
                              background: 'rgba(0, 212, 255, 0.2)',
                              color: '#00D4FF',
                            }}
                          />
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                            {session.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              component="span"
                              icon={<AccessTime />}
                              label={formatSessionDate(session.started_at)}
                              size="small"
                              sx={{ height: 20 }}
                            />
                            <Chip
                              component="span"
                              icon={<Message />}
                              label={session.message_count}
                              size="small"
                              sx={{ height: 20 }}
                            />
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const session = sessions.find(s => s.id === menuSessionId);
          if (session) handleRename(session);
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          {t('common.rename')}
        </MenuItem>
        <MenuItem onClick={() => {
          const session = sessions.find(s => s.id === menuSessionId);
          if (session) handleDelete(session);
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          {t('common.delete')}
        </MenuItem>
      </Menu>

      {/* 이름 변경 다이얼로그 */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>{t('pages.chat.renameDialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            margin="normal"
            label={t('pages.chat.renameDialog.newName')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={confirmRename} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('pages.chat.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('pages.chat.deleteDialog.message')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatSessionList;
