import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

interface MessageButtonProps {
  receiverId: string;
  receiverName: string;
  houseId?: string;
  houseName?: string;
  conversationType?: 'tenant-agent' | 'co-tenant';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

const MessageButton = ({
  receiverId,
  receiverName,
  houseId,
  houseName,
  conversationType = 'tenant-agent',
  variant = 'outline',
  size = 'default',
  className,
  children,
}: MessageButtonProps) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: () =>
      api.messages.send({
        receiverId,
        content: message,
        houseId,
        conversationType,
      }),
    onSuccess: () => {
      toast({
        title: 'Message sent!',
        description: `Your message has been sent to ${receiverName}`,
      });
      setOpen(false);
      setMessage('');
      // Navigate to messages page
      navigate(`/messages?partner=${receiverId}${houseId ? `&house=${houseId}` : ''}`);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: error.message,
      });
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Login required',
        description: 'Please login to send messages',
      });
      navigate('/auth');
      return;
    }
    // Prevent opening message dialog when trying to message yourself
    if (user?.id === receiverId) {
      toast({
        variant: 'destructive',
        title: 'Cannot message yourself',
        description: 'You cannot send messages to your own account',
      });
      return;
    }
    setOpen(true);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} onClick={handleClick}>
          {children || (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message to {receiverName}</DialogTitle>
          <DialogDescription>
            {houseName
              ? `About: ${houseName}`
              : conversationType === 'co-tenant'
              ? 'Connect with your potential co-tenant'
              : 'Send a message to the agent/landlord'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                conversationType === 'co-tenant'
                  ? "Hi! I'm interested in sharing this property with you. Would you like to connect?"
                  : "Hi! I'm interested in this property. Could you provide more details?"
              }
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageButton;
