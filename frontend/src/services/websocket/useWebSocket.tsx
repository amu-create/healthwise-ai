// 실시간 알림 처리를 위한 React Hook
import { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { getNotificationWebSocket, getDMWebSocket } from './WebSocketManager';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'dm_notification' | 'achievement' | 'level_up';
  title: string;
  message: string;
  from_user?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  post_id?: number;
  conversation_id?: number;
  created_at: string;
}

export const useNotificationWebSocket = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleNotification = useCallback((data: any) => {
    console.log('New notification:', data);
    
    // 알림 목록에 추가
    if (data.notification) {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }

    // 토스트 알림 표시
    const getNotificationIcon = () => {
      switch (data.type) {
        case 'like': return '❤️';
        case 'comment': return '💬';
        case 'follow': return '👤';
        case 'mention': return '@';
        case 'dm_notification': return '✉️';
        case 'achievement': return '🏆';
        case 'level_up': return '⭐';
        default: return '🔔';
      }
    };

    const icon = getNotificationIcon();
    const title = data.title || t('social.newNotification');
    const message = data.message || '';

    toast.info(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <div>
          <strong>{title}</strong>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{message}</div>
        </div>
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }, [t]);

  const handleDMNotification = useCallback((data: any) => {
    console.log('New DM notification:', data);
    
    // DM 알림 처리
    if (data.type === 'dm_notification') {
      handleNotification({
        ...data,
        title: t('dm.newMessage'),
        message: `${data.message.sender.username}: ${data.message.content}`,
      });
    }
  }, [handleNotification, t]);

  const markAsRead = useCallback((notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const notificationWS = getNotificationWebSocket();
    const dmWS = getDMWebSocket();

    // WebSocket이 활성화된 경우에만 연결
    if (process.env.REACT_APP_ENABLE_WEBSOCKET === 'true') {
      // 알림 WebSocket 연결
      notificationWS.connect().then(() => {
        console.log('Notification WebSocket connected');
        
        // 이벤트 리스너 등록
        notificationWS.on('notification', handleNotification);
        notificationWS.on('achievement_unlocked', (data: any) => {
          handleNotification({
            ...data,
            type: 'achievement',
            title: t('achievements.unlocked'),
            message: data.achievement_name,
          });
        });
        notificationWS.on('level_up', (data: any) => {
          handleNotification({
            ...data,
            type: 'level_up',
            title: t('common.levelUp'),
            message: t('common.levelUpMessage', { level: data.new_level }),
          });
        });
      }).catch(console.error);

      // DM WebSocket 연결
      dmWS.connect().then(() => {
        console.log('DM WebSocket connected');
        dmWS.on('dm_notification', handleDMNotification);
      }).catch(console.error);
    } else {
      console.log('WebSocket disabled - Django Channels not configured');
    }

    // Cleanup
    return () => {
      notificationWS.off('notification', handleNotification);
      notificationWS.off('achievement_unlocked', handleNotification);
      notificationWS.off('level_up', handleNotification);
      dmWS.off('dm_notification', handleDMNotification);
    };
  }, [isAuthenticated, user, handleNotification, handleDMNotification, t]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};

// DM 대화방용 WebSocket Hook
export const useConversationWebSocket = (conversationId: number | null) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const sendMessage = useCallback((content: string, mediaFile?: File) => {
    if (!conversationId) return;

    const dmWS = getDMWebSocket();
    if (!dmWS.isConnected()) {
      console.error('WebSocket not connected');
      return;
    }

    dmWS.send({
      type: 'send_message',
      conversation_id: conversationId,
      content,
      media_file: mediaFile ? URL.createObjectURL(mediaFile) : null,
      message_type: mediaFile ? 'media' : 'text',
    });
  }, [conversationId]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!conversationId) return;

    const dmWS = getDMWebSocket();
    if (!dmWS.isConnected()) return;

    dmWS.send({
      type: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  }, [conversationId]);

  const markMessagesAsRead = useCallback((messageIds: number[]) => {
    if (!conversationId || messageIds.length === 0) return;

    const dmWS = getDMWebSocket();
    if (!dmWS.isConnected()) return;

    dmWS.send({
      type: 'mark_read',
      conversation_id: conversationId,
      message_ids: messageIds,
    });
  }, [conversationId]);

  const addReaction = useCallback((messageId: number, emoji: string) => {
    const dmWS = getDMWebSocket();
    if (!dmWS.isConnected()) return;

    dmWS.send({
      type: 'add_reaction',
      message_id: messageId,
      emoji,
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !conversationId) return;

    const dmWS = getDMWebSocket();

    // 메시지 수신 처리
    const handleNewMessage = (data: any) => {
      if (data.message && data.message.conversation === conversationId) {
        setMessages(prev => [...prev, data.message]);
        
        // 자동으로 읽음 처리
        if (data.message.sender.id !== parseInt(localStorage.getItem('userId') || '0')) {
          markMessagesAsRead([data.message.id]);
        }
      }
    };

    // 타이핑 상태 처리
    const handleTypingStatus = (data: any) => {
      if (data.conversation_id === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing) {
            newSet.add(data.user_id);
          } else {
            newSet.delete(data.user_id);
          }
          return newSet;
        });

        // 3초 후 자동으로 타이핑 상태 제거
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.user_id);
            return newSet;
          });
        }, 3000);
      }
    };

    // 반응 추가 처리
    const handleReactionAdded = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.reaction.message_id) {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), data.reaction],
          };
        }
        return msg;
      }));
    };

    // 이벤트 리스너 등록
    dmWS.on('new_message', handleNewMessage);
    dmWS.on('typing_status', handleTypingStatus);
    dmWS.on('reaction_added', handleReactionAdded);

    // Cleanup
    return () => {
      dmWS.off('new_message', handleNewMessage);
      dmWS.off('typing_status', handleTypingStatus);
      dmWS.off('reaction_added', handleReactionAdded);
      setTypingUsers(new Set());
    };
  }, [isAuthenticated, conversationId, markMessagesAsRead]);

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTypingStatus,
    markMessagesAsRead,
    addReaction,
  };
};