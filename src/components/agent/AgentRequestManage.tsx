import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Handshake, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AgentRequestManageProps {
  propertyId: string;
  propertyTitle?: string;
}

export function AgentRequestManage({ propertyId, propertyTitle }: AgentRequestManageProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.propertyManagement.createManagementRequest(propertyId, message || undefined),
    onSuccess: () => {
      toast({
        title: 'Request sent',
        description: 'The landlord will review your management request.',
      });
      setOpen(false);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['management-requests-outgoing'] });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Request failed', description: e.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full gap-2">
          <Handshake className="h-4 w-4" />
          Request to manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request property management</DialogTitle>
          <DialogDescription>
            Ask the landlord to let you manage {propertyTitle ?? 'this listing'}. You cannot create listings as an agent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Message to landlord (optional)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Brief intro and how you will help market this property…"
          />
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
