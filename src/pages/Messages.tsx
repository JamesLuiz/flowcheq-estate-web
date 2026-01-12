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
  User,
  Building2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Maximize2, Minimize2 } from 'lucide-react';

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
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<any>(null);
  const conversationsScrollRef = useRef<any>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const latestMessagesRef = useRef<any[]>([]);

  // Safe setter: dedupe, sort and only update React state when actual change occurs.
  const userScrolledUpRef = useRef(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Safe setter: dedupe, sort and only update React state when actual change occurs.
  // Returns { changed, appended }
  const setMessagesSafely = (incoming: any[], opts?: { merge?: boolean }) => {
    let combined: any[] = [];
    const prevList = latestMessagesRef.current || [];
    const prevIdsSet = new Set(prevList.map((m) => m.id));

    if (opts?.merge) {
      const merged = [...prevList, ...incoming];
      const map = new Map<string, any>();
      for (const m of merged) map.set(m.id, m);
      combined = Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      const map = new Map<string, any>();
      for (const m of incoming) map.set(m.id, m);
      combined = Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    const prevIds = prevList.map((m) => m.id).join(',');
    const newIds = combined.map((m) => m.id).join(',');
    const appended = combined.some((m) => !prevIdsSet.has(m.id));
    const changed = prevIds !== newIds;
    if (changed) {
      latestMessagesRef.current = combined;
      setMessages(combined);
    }
    return { changed, appended };
  };

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
        const msgs = await getMessages(selectedPartner, expanded ? undefined : (selectedHouse || undefined));
        // Deduplicate messages by id (API might return duplicates across houses)
        const msgsMap = new Map<string, any>();
        for (const m of msgs) {
          msgsMap.set(m.id, m);
        }
        const uniqueMsgs = Array.from(msgsMap.values());
          setMessagesSafely(uniqueMsgs, { merge: false });
        await markAsRead(selectedPartner);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedPartner, selectedHouse, expanded, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Don't force-scroll if the user is reading older messages.
    // We only auto-scroll when: initial load (prev length 0), user is already near bottom,
    // or messages length increased (new incoming message).
    const viewport = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    const prevLen = prevMessagesLengthRef.current;
    const newLen = messages.length;

    let shouldScroll = false;
    if (!viewport) {
      shouldScroll = true;
    } else {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const isNearBottom = distanceFromBottom < 150; // px threshold

      if (prevLen === 0) {
        // initial load
        shouldScroll = true;
      } else if (newLen > prevLen) {
        // new message appended
        shouldScroll = true;
      } else if (isNearBottom) {
        // user is already at bottom
        shouldScroll = true;
      }
    }

    if (shouldScroll && !userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
    }

    prevMessagesLengthRef.current = newLen;
  }, [messages]);

  // Poll for new messages in active conversation (only if Pusher is not connected)
  // This is a fallback - if Pusher is working, it will handle real-time updates
  useEffect(() => {
    if (!selectedPartner) return;
    
    // Only poll if Pusher is not configured/connected
    // Pusher uses WebSockets but it's a managed service that works with Vercel
    const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
    if (PUSHER_KEY) {
      // Pusher is configured, let it handle real-time updates
      // Only poll occasionally as a backup (every 30 seconds)
      const interval = setInterval(async () => {
        try {
          const msgs = await getMessages(selectedPartner, expanded ? undefined : (selectedHouse || undefined));
          const res = setMessagesSafely(msgs, { merge: true });
          if (res.appended && userScrolledUpRef.current) {
            setHasNewMessages(true);
          }
        } catch (error) {
          console.error('Failed to refresh messages:', error);
        }
      }, 30000); // 30 seconds as backup when Pusher is configured

      return () => clearInterval(interval);
    } else {
      // No Pusher, use polling (every 10 seconds)
      const interval = setInterval(async () => {
        try {
          const msgs = await getMessages(selectedPartner, expanded ? undefined : (selectedHouse || undefined));
          const res = setMessagesSafely(msgs, { merge: true });
          if (res.appended && userScrolledUpRef.current) {
            setHasNewMessages(true);
          }
        } catch (error) {
          console.error('Failed to refresh messages:', error);
        }
      }, 10000); // 10 seconds when Pusher is not configured

      return () => clearInterval(interval);
    }
  }, [selectedPartner, selectedHouse, expanded, getMessages]);

  // Attach scroll listener to the messages viewport to detect when the user scrolls up
  useEffect(() => {
    if (!messagesScrollRef.current) return;

    let attached = false;
    let vp: HTMLElement | null = null;
    const tryAttach = () => {
      vp = messagesScrollRef.current?.querySelector?.('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (!vp) return false;

      const onScroll = () => {
        const distanceFromBottom = vp!.scrollHeight - vp!.scrollTop - vp!.clientHeight;
        userScrolledUpRef.current = distanceFromBottom > 150;
        if (!userScrolledUpRef.current) setHasNewMessages(false);
      };

      vp.addEventListener('scroll', onScroll, { passive: true });
      // run once to set initial state
      onScroll();
      (messagesScrollRef as any).cleanup = () => vp!.removeEventListener('scroll', onScroll as any);
      return true;
    };

    if (!tryAttach()) {
      const t = setInterval(() => {
        if (tryAttach()) {
          clearInterval(t);
          attached = true;
        }
      }, 100);
      return () => clearInterval(t);
    }

    return () => {
      if ((messagesScrollRef as any).cleanup) (messagesScrollRef as any).cleanup();
    };
  }, [messagesScrollRef.current, selectedPartner]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedPartner || isSending) return;

    setIsSending(true);
    try {
      // Determine conversation type based on partner role and context
      const partner = getConversationPartner();
      const conversationType = partner?.conversationType || 
        (selectedHouse && partner?.partnerRole === 'user' ? 'co-tenant' : 'tenant-agent');

      const newMessage = await sendMessage(
        selectedPartner,
        messageInput.trim(),
        selectedHouse || undefined,
        conversationType
      );
      
      // Add message immediately to UI (optimistic update)
      setMessagesSafely([newMessage], { merge: true });
      
      // Refresh conversations list to update last message
      refreshConversations();
      
      // Ensure sender sees their message immediately
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        userScrolledUpRef.current = false;
        setHasNewMessages(false);
      }, 30);
      
      // Don't immediately poll - let Pusher or the next poll interval handle it
      // This prevents unnecessary refreshes
      setMessageInput('');
      refreshConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations based on search
  // Deduplicate conversations (safety) and then filter by search
  const uniqueConversationsMap = new Map<string, any>();
  for (const c of conversations) {
    if (!uniqueConversationsMap.has(c.partnerId)) uniqueConversationsMap.set(c.partnerId, c);
  }
  const uniqueConversations = Array.from(uniqueConversationsMap.values());
  const filteredConversations = uniqueConversations.filter((conv) =>
    conv.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConversationPartner = () => {
    // Use the unique conversations map used for rendering so partner info matches list
    return uniqueConversations.find((c) => c.partnerId === selectedPartner);
  };

  const partner = getConversationPartner();

  // Helper function to get badge info based on conversation context
  const getBadgeInfo = (conversation: any) => {
    // If it's explicitly a co-tenant conversation
    if (conversation.conversationType === 'co-tenant') {
      return {
        icon: Users,
        label: 'Co-tenant',
        variant: 'outline' as const,
      };
    }

    // Otherwise, show badge based on partner's role
    if (conversation.partnerRole === 'agent' || conversation.partnerRole === 'landlord') {
      return {
        icon: Building2,
        label: conversation.partnerRole === 'landlord' ? 'Landlord' : 'Agent',
        variant: 'secondary' as const,
      };
    }

    // Default for regular users
    return {
      icon: User,
      label: 'User',
      variant: 'default' as const,
    };
  };

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

        <div className={"grid grid-cols-1 md:grid-cols-3 gap-6 " + (expanded ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-200px)]')}>
          {/* Conversations List */}
          {!expanded && (
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
                <ScrollArea ref={conversationsScrollRef} className="h-[calc(100vh-380px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{searchQuery ? 'No matching conversations' : 'No conversations yet'}</p>
                      <p className="text-sm">Start chatting with agents or co-tenants</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const badgeInfo = getBadgeInfo(conversation);
                      const BadgeIcon = badgeInfo.icon;

                      return (
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
                                <Badge variant={badgeInfo.variant} className="text-xs">
                                  <BadgeIcon className="h-3 w-3 mr-1" />
                                  {badgeInfo.label}
                                </Badge>
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
                      );
                    })
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Chat Area */}
          <Card className={`${expanded ? 'col-span-1 md:col-span-3' : 'md:col-span-2'} flex flex-col overflow-hidden`}>
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
                      {partner && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {partner.partnerRole === 'agent' && 'Agent'}
                          {partner.partnerRole === 'landlord' && 'Landlord'}
                          {partner.partnerRole === 'user' && partner.conversationType === 'co-tenant' && 'Co-tenant'}
                          {partner.partnerRole === 'user' && partner.conversationType !== 'co-tenant' && 'User'}
                        </Badge>
                      )}
                    </div>
                    <div className="ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const newExpanded = !expanded;
                          setExpanded(newExpanded);
                          if (!selectedPartner) return;
                          try {
                            setLoadingMessages(true);
                            // When expanded, fetch the full conversation across houses (no houseId filter)
                            // When collapsed, restore filtered conversation for the selected house
                            const msgs = await getMessages(
                              selectedPartner,
                              newExpanded ? undefined : (selectedHouse || undefined)
                            );
                            // dedupe
                            // Use safe setter to dedupe and only update when changed
                            setMessagesSafely(msgs, { merge: false });
                            // Ensure the view scrolls to bottom after expanding so user sees latest messages
                            setTimeout(() => {
                              // Prefer messagesEndRef, fallback to scrolling the viewport directly
                              if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
                                try {
                                  messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                  return;
                                } catch (e) {
                                  // ignore and fallback
                                }
                              }

                              const vp = messagesScrollRef.current?.querySelector?.('[data-radix-scroll-area-viewport]') as HTMLElement | null;
                              if (vp) {
                                vp.scrollTop = vp.scrollHeight;
                              }
                            }, 50);
                            // mark as read when collapsing back to filtered view
                            if (!newExpanded) {
                              await markAsRead(selectedPartner);
                            }
                          } catch (err) {
                            console.error('Failed to load conversation on expand toggle', err);
                          } finally {
                            setLoadingMessages(false);
                          }
                        }}
                        aria-label={expanded ? 'Collapse chat' : 'Expand chat'}
                      >
                        {expanded ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea
                    ref={messagesScrollRef}
                    className={expanded ? 'h-[calc(100vh-120px)] p-4' : 'h-[calc(100vh-420px)] p-4'}
                  >
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
                          // Prefer server-provided flag when available to avoid id/format mismatches
                          const isOwn = typeof message.isOwn === 'boolean' ? message.isOwn : message.senderId === user.id;
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
                <div className="border-t p-4 bg-background/95 backdrop-blur relative">
                  {hasNewMessages && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-10">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          userScrolledUpRef.current = false;
                          setHasNewMessages(false);
                        }}
                      >
                        New messages
                      </Button>
                    </div>
                  )}
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