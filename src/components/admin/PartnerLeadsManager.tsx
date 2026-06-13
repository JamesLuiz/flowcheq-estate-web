import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, Loader2, Mail, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PartnerLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  city?: string;
  state?: string;
  status: string;
  adminNotes?: string;
  whatsappUrl?: string;
  createdAt: string;
};

export function PartnerLeadsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contactLead, setContactLead] = useState<PartnerLead | null>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Flowcheq Estate — landlord onboarding');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');

  const leadsQuery = useQuery({
    queryKey: ['partner-leads', statusFilter],
    queryFn: () =>
      api.partners.listLeads(statusFilter === 'all' ? undefined : statusFilter),
  });

  const contactMutation = useMutation({
    mutationFn: () =>
      api.partners.contactLead(contactLead!.id, {
        channel,
        message,
        subject: channel === 'email' ? subject : undefined,
      }),
    onSuccess: (data) => {
      if (channel === 'whatsapp' && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
      toast({ title: channel === 'email' ? 'Email sent' : 'WhatsApp opened' });
      setContactLead(null);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['partner-leads'] });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    },
  });

  const leads = (leadsQuery.data ?? []) as PartnerLead[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="not_interested">Not interested</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => leadsQuery.refetch()}>
          Refresh
        </Button>
      </div>

      {leadsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No partner leads yet
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.email}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone}</div>
                    </TableCell>
                    <TableCell>
                      {[lead.city, lead.state].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setContactLead(lead);
                            setMessage(
                              `Hello ${lead.name}, thank you for registering with Flowcheq Estate. We'd like to discuss listing your property.`,
                            );
                          }}
                        >
                          <Mail className="h-4 w-4 mr-1" /> Contact
                        </Button>
                        {lead.whatsappUrl && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={lead.whatsappUrl} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!contactLead} onOpenChange={(o) => !o && setContactLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {contactLead?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as 'email' | 'whatsapp')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email (via SMTP)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp (opens wa.me)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {channel === 'email' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactLead(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => contactMutation.mutate()}
              disabled={!message.trim() || contactMutation.isPending}
            >
              {contactMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : channel === 'email' ? (
                <>
                  <Mail className="h-4 w-4 mr-2" /> Send email
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" /> Open WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
