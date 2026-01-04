import { useState, useEffect, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  content: string;
  read: boolean;
  houseId?: string;
  conversationType: 'tenant-agent' | 'co-tenant';
  createdAt: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerRole?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  houseId?: string;
  conversationType: 'tenant-agent' | 'co-tenant';
}

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'eu';
const POLLING_INTERVAL = 10000; // 10 seconds fallback polling

export const useMessaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.messages.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.messages.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user]);

  // Initialize Pusher or fallback to polling
  useEffect(() => {
    if (!user) return;

    if (PUSHER_KEY) {
      // Use Pusher for real-time
      const pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });

      const channel = pusher.subscribe(`user-${user.id}`);
      
      channel.bind('new-message', (data: any) => {
        // Update unread count
        setUnreadCount((prev) => prev + 1);
        
        // Update conversations
        setConversations((prev) => {
          const existing = prev.find((c) => c.partnerId === data.senderId);
          if (existing) {
            return prev.map((c) =>
              c.partnerId === data.senderId
                ? {
                    ...c,
                    lastMessage: data.content,
                    lastMessageAt: data.createdAt,
                    unreadCount: c.unreadCount + 1,
                  }
                : c
            );
          }
          // New conversation
          return [
            {
              partnerId: data.senderId,
              partnerName: data.senderName,
              partnerAvatar: data.senderAvatar,
              lastMessage: data.content,
              lastMessageAt: data.createdAt,
              unreadCount: 1,
              houseId: data.houseId,
              conversationType: data.conversationType,
            },
            ...prev,
          ];
        });
      });

      pusher.connection.bind('connected', () => {
        setIsConnected(true);
        console.log('Pusher connected');
      });

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false);
        console.log('Pusher disconnected');
      });

      pusherRef.current = pusher;

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(`user-${user.id}`);
        pusher.disconnect();
      };
    } else {
      // Fallback to polling
      console.log('Pusher not configured, using polling');
      
      const poll = () => {
        fetchConversations();
        fetchUnreadCount();
      };

      poll(); // Initial fetch
      pollingRef.current = setInterval(poll, POLLING_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [user, fetchConversations, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

  // Send message
  const sendMessage = async (
    receiverId: string,
    content: string,
    houseId?: string,
    conversationType: 'tenant-agent' | 'co-tenant' = 'tenant-agent'
  ) => {
    const response = await api.messages.send({
      receiverId,
      content,
      houseId,
      conversationType,
    });
    return response;
  };

  // Get messages for a conversation
  const getMessages = async (partnerId: string, houseId?: string): Promise<Message[]> => {
    return api.messages.getMessages(partnerId, houseId);
  };

  // Mark messages as read
  const markAsRead = async (partnerId: string) => {
    await api.messages.markAsRead(partnerId);
    setUnreadCount((prev) => Math.max(0, prev - (conversations.find((c) => c.partnerId === partnerId)?.unreadCount || 0)));
    setConversations((prev) =>
      prev.map((c) =>
        c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  return {
    conversations,
    unreadCount,
    isConnected,
    sendMessage,
    getMessages,
    markAsRead,
    refreshConversations: fetchConversations,
    refreshUnreadCount: fetchUnreadCount,
  };
};
