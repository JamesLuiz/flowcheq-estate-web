import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { api, getApiBaseUrl, getAuthToken, type AppNotification } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Subscribe to incoming chat messages delivered over the socket. */
  onChatMessage: (handler: (msg: ChatMessageEvent) => void) => () => void;
}

export interface ChatMessageEvent {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  houseId?: string;
  conversationType: 'tenant-agent' | 'co-tenant';
  createdAt: string;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const POLL_INTERVAL = 30000;

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatHandlers = useRef<Set<(msg: ChatMessageEvent) => void>>(new Set());

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [list, count] = await Promise.all([
        api.notifications.list(),
        api.notifications.unreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.notifications.markRead(id);
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead();
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  }, []);

  const onChatMessage = useCallback((handler: (msg: ChatMessageEvent) => void) => {
    chatHandlers.current.add(handler);
    return () => {
      chatHandlers.current.delete(handler);
    };
  }, []);

  // Initial + polling fallback
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  // Socket connection for realtime notifications + chat
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const token = getAuthToken();
    if (!token) return;

    const socket = io(getApiBaseUrl(), {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification:new', (n: AppNotification) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
      toast(n.title, { description: n.body });
    });

    socket.on('chat:message', (msg: ChatMessageEvent) => {
      chatHandlers.current.forEach((handler) => handler(msg));
    });

    return () => {
      socket.off('notification:new');
      socket.off('chat:message');
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      connected,
      markRead,
      markAllRead,
      refresh,
      onChatMessage,
    }),
    [notifications, unreadCount, connected, markRead, markAllRead, refresh, onChatMessage],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
