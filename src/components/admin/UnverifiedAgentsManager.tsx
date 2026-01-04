import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Loader2, Users, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Agent } from '@/types';

export const UnverifiedAgentsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [bulkEmailMessage, setBulkEmailMessage] = useState('');

  const unverifiedAgentsQuery = useQuery({
    queryKey: ['admin-unverified-agents'],
    queryFn: () => api.admin.getUnverifiedAgents(),
  });

  const sendBulkEmailMutation = useMutation({
    mutationFn: (message?: string) => api.admin.sendBulkEmailToUnverifiedAgents(message),
    onSuccess: (data) => {
      toast({
        title: 'Bulk email sent',
        description: `Successfully sent to ${data.successCount} agents. ${data.failCount} failed.`,
      });
      setIsBulkEmailOpen(false);
      setBulkEmailMessage('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send bulk email',
        description: error.message,
      });
    },
  });

  const unverifiedAgents = unverifiedAgentsQuery.data?.data || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unverified Agents
              </CardTitle>
              <CardDescription>
                Manage agents who haven't completed verification
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsBulkEmailOpen(true)}
              disabled={unverifiedAgents.length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Bulk Email
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {unverifiedAgentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : unverifiedAgents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No unverified agents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unverifiedAgents.map((agent: Agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>{agent.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {agent.verificationStatus || 'Not verified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await api.admin.sendVerificationReminder(agent.id);
                              toast({
                                title: 'Reminder sent',
                                description: `Verification reminder sent to ${agent.email}`,
                              });
                            } catch (error: any) {
                              toast({
                                variant: 'destructive',
                                title: 'Failed to send reminder',
                                description: error.message,
                              });
                            }
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isBulkEmailOpen} onOpenChange={setIsBulkEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Email to Unverified Agents</DialogTitle>
            <DialogDescription>
              Send a verification reminder email to all {unverifiedAgents.length} unverified agents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkMessage">Custom Message (Optional)</Label>
              <Textarea
                id="bulkMessage"
                value={bulkEmailMessage}
                onChange={(e) => setBulkEmailMessage(e.target.value)}
                placeholder="Add a custom message to include in the email..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendBulkEmailMutation.mutate(bulkEmailMessage || undefined)}
              disabled={sendBulkEmailMutation.isPending}
            >
              {sendBulkEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

