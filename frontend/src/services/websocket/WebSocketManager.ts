// WebSocket 연결 관리 클래스
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(url: string) {
    this.url = url;
    this.token = localStorage.getItem('access_token');
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isIntentionallyClosed = false;
      const wsUrl = `${this.url}${this.token ? `?token=${this.token}` : ''}`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.type, data);
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          if (!this.isIntentionallyClosed) {
            this.handleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed', { reason: 'max_attempts_reached' });
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat' });
      }
    }, 30000); // 30초마다 heartbeat
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
let notificationWSInstance: WebSocketManager | null = null;
let dmWSInstance: WebSocketManager | null = null;

export const getNotificationWebSocket = (): WebSocketManager => {
  if (!notificationWSInstance) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    notificationWSInstance = new WebSocketManager(`${wsUrl}/ws/notifications/`);
    
    // WebSocket이 활성화된 경우에만 연결 시도
    if (process.env.REACT_APP_ENABLE_WEBSOCKET === 'true') {
      notificationWSInstance.connect().catch(() => {
        console.log('WebSocket notifications disabled - Django Channels not configured');
      });
    }
  }
  return notificationWSInstance;
};

export const getDMWebSocket = (): WebSocketManager => {
  if (!dmWSInstance) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    dmWSInstance = new WebSocketManager(`${wsUrl}/ws/dm/`);
    
    // WebSocket이 활성화된 경우에만 연결 시도
    if (process.env.REACT_APP_ENABLE_WEBSOCKET === 'true') {
      dmWSInstance.connect().catch(() => {
        console.log('WebSocket DM disabled - Django Channels not configured');
      });
    }
  }
  return dmWSInstance;
};

export const disconnectAllWebSockets = (): void => {
  if (notificationWSInstance) {
    notificationWSInstance.disconnect();
    notificationWSInstance = null;
  }
  if (dmWSInstance) {
    dmWSInstance.disconnect();
    dmWSInstance = null;
  }
};