import { EventEmitter } from 'events';

interface NotificationEvent {
  type: 'achievement' | 'level_up' | 'follow' | 'like' | 'comment' | 'goal_achieved' | 'reminder';
  data: any;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private url: string;
  private isConnecting = false;

  constructor() {
    super();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_HOST || window.location.host;
    this.url = `${protocol}//${host}/ws/notifications/`;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.emit('connected');
        
        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Send ping every 30 seconds to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('disconnected');
        this.stopPingInterval();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'connection':
        console.log('Connection confirmed:', data.message);
        break;
        
      case 'pong':
        // Ping response, connection is alive
        break;
        
      case 'achievement':
        this.emit('notification', {
          type: 'achievement',
          data: {
            achievement: data.achievement,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      case 'level_up':
        this.emit('notification', {
          type: 'level_up',
          data: {
            newLevel: data.new_level,
            previousLevel: data.previous_level,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      case 'follow':
        this.emit('notification', {
          type: 'follow',
          data: {
            follower: data.follower,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      case 'like':
        this.emit('notification', {
          type: 'like',
          data: {
            user: data.user,
            post: data.post,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      case 'comment':
        this.emit('notification', {
          type: 'comment',
          data: {
            user: data.user,
            post: data.post,
            comment: data.comment,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      case 'goal_achieved':
        this.emit('notification', {
          type: 'goal_achieved',
          data: {
            goal: data.goal,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      case 'reminder':
        this.emit('notification', {
          type: 'reminder',
          data: {
            reminderType: data.reminder_type,
            message: data.message,
            timestamp: data.timestamp,
          },
        });
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private pingInterval: NodeJS.Timeout | null = null;

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, this.reconnectInterval);
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getConnectionState(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
export type { NotificationEvent };
