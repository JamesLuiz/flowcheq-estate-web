import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/hooks/useMessaging';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Users,
  Home,
  UserCircle,
  Loader2,
  Smile,
  Search,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const Messages = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const {
    conversations,
    unreadCount,
    sendMessage,
    getMessages,
    markAsRead,
    refreshConversations,
  } = useMessaging();

  const [selectedPartner, setSelectedPartner] = useState<string | null>(
    searchParams.get('partner')
  );
  const [selectedHouse, setSelectedHouse] = useState<string | null>(
    searchParams.get('house')
  );
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Load messages when partner is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedPartner) return;
      
      setLoadingMessages(true);
      try {
        const msgs = await getMessages(selectedPartner, selectedHouse || undefined);
        setMessages(msgs);
        await markAsRead(selectedPartner);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedPartner, selectedHouse]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages in active conversation
  useEffect(() => {
    if (!selectedPartner) return;

    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(selectedPartner, selectedHouse || undefined);
        setMessages(msgs);
      } catch (error) {
        console.error('Failed to refresh messages:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPartner, selectedHouse]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedPartner || isSending) return;

    setIsSending(true);
    try {
      const newMessage = await sendMessage(
        selectedPartner,
        messageInput.trim(),
        selectedHouse || undefined,
        selectedHouse ? 'co-tenant' : 'tenant-agent'
      );
      
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput('');
      refreshConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConversationPartner = () => {
    return conversations.find((c) => c.partnerId === selectedPartner);
  };

  const partner = getConversationPartner();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search input */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-380px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? 'No matching conversations' : 'No conversations yet'}</p>
                    <p className="text-sm">Start chatting with agents or co-tenants</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.partnerId}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 ${
                        selectedPartner === conversation.partnerId
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : 'border-l-4 border-l-transparent'
                      }`}
                      onClick={() => {
                        setSelectedPartner(conversation.partnerId);
                        setSelectedHouse(conversation.houseId || null);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={conversation.partnerAvatar} />
                          <AvatarFallback>
                            {conversation.partnerName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {conversation.partnerName}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {conversation.conversationType === 'co-tenant' ? (
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                Co-tenant
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Home className="h-3 w-3 mr-1" />
                                Agent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            {selectedPartner ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={partner?.partnerAvatar} />
                      <AvatarFallback>
                        {partner?.partnerName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {partner?.partnerName || 'Loading...'}
                      </CardTitle>
                      {partner?.partnerRole && (
                        <Badge variant="outline" className="text-xs">
                          {partner.partnerRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-[calc(100vh-420px)] p-4">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-16 w-64" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-sm">Send a message to start the conversation</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwn = message.senderId === user.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={isOwn ? user.avatarUrl : message.senderAvatar}
                                />
                                <AvatarFallback>
                                  {(isOwn ? user.name : message.senderName)
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`max-w-[70%] ${
                                  isOwn ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwn
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4 bg-background/95 backdrop-blur">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="space-y-3"
                  >
                    <div className="flex gap-2">
                      <Textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 min-h-[44px] max-h-32 resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className="h-11 px-4"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <UserCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
