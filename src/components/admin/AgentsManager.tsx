import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Ban, Trash2, ShieldCheck, AlertTriangle, Loader2, MoreVertical } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Agent } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AgentsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    agent: Agent | null;
    action: 'suspend' | 'ban' | 'activate' | 'delete' | 'delist' | null;
  }>({ open: false, agent: null, action: null });
  const [reason, setReason] = useState('');
  const [suspendedUntil, setSuspendedUntil] = useState('');

  const agentsQuery = useQuery({
    queryKey: ['admin-agents', statusFilter],
    queryFn: () => api.admin.getAllAgents(statusFilter === 'all' ? undefined : statusFilter),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ agentId, reason, suspendedUntil }: { agentId: string; reason?: string; suspendedUntil?: string }) =>
      api.admin.suspendAgent(agentId, reason, suspendedUntil),
    onSuccess: () => {
      toast({
        title: 'Agent suspended',
        description: 'Agent has been suspended and email notification sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      setActionDialog({ open: false, agent: null, action: null });
      setReason('');
      setSuspendedUntil('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to suspend agent',
        description: error.message,
      });
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason?: string }) =>
      api.admin.banAgent(agentId, reason),
    onSuccess: () => {
      toast({
        title: 'Agent banned',
        description: 'Agent has been banned, properties delisted, and email notification sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      setActionDialog({ open: false, agent: null, action: null });
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to ban agent',
        description: error.message,
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason?: string }) =>
      api.admin.activateAgent(agentId, reason),
    onSuccess: () => {
      toast({
        title: 'Agent activated',
        description: 'Agent account has been reactivated and email notification sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      setActionDialog({ open: false, agent: null, action: null });
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to activate agent',
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason?: string }) =>
      api.admin.deleteAgent(agentId, reason),
    onSuccess: () => {
      toast({
        title: 'Agent deleted',
        description: 'Agent account and all properties have been deleted. Email notification sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      setActionDialog({ open: false, agent: null, action: null });
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete agent',
        description: error.message,
      });
    },
  });

  const delistPropertiesMutation = useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason?: string }) =>
      api.admin.delistAgentProperties(agentId, reason),
    onSuccess: () => {
      toast({
        title: 'Properties delisted',
        description: 'All agent properties have been delisted and email notification sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      setActionDialog({ open: false, agent: null, action: null });
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delist properties',
        description: error.message,
      });
    },
  });

  const agents = agentsQuery.data?.data || [];

  const handleAction = (agent: Agent, action: 'suspend' | 'ban' | 'activate' | 'delete' | 'delist') => {
    setActionDialog({ open: true, agent, action });
    setReason('');
    setSuspendedUntil('');
  };

  const confirmAction = () => {
    if (!actionDialog.agent || !actionDialog.action) return;

    const { agent, action } = actionDialog;

    if (action === 'suspend') {
      suspendMutation.mutate({
        agentId: agent.id,
        reason: reason || undefined,
        suspendedUntil: suspendedUntil || undefined,
      });
    } else if (action === 'ban') {
      banMutation.mutate({ agentId: agent.id, reason: reason || undefined });
    } else if (action === 'activate') {
      activateMutation.mutate({ agentId: agent.id, reason: reason || undefined });
    } else if (action === 'delete') {
      deleteMutation.mutate({ agentId: agent.id, reason: reason || undefined });
    } else if (action === 'delist') {
      delistPropertiesMutation.mutate({ agentId: agent.id, reason: reason || undefined });
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'active') {
      return <Badge variant="default">Active</Badge>;
    }
    if (status === 'suspended') {
      return <Badge variant="secondary">Suspended</Badge>;
    }
    if (status === 'banned') {
      return <Badge variant="destructive">Banned</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agents Management
          </CardTitle>
          <CardDescription>
            Manage all agents, suspend, ban, or delete accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
              <TabsTrigger value="banned">Banned</TabsTrigger>
            </TabsList>
          </Tabs>

          {agentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No agents found</p>
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
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent: Agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>{agent.phone || '-'}</TableCell>
                      <TableCell>{getStatusBadge((agent as any).accountStatus)}</TableCell>
                      <TableCell>
                        {agent.verified ? (
                          <Badge variant="default">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Not Verified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(agent as any).accountStatus !== 'active' && (
                              <DropdownMenuItem onClick={() => handleAction(agent, 'activate')}>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {(agent as any).accountStatus !== 'suspended' && (
                              <DropdownMenuItem onClick={() => handleAction(agent, 'suspend')}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {(agent as any).accountStatus !== 'banned' && (
                              <DropdownMenuItem onClick={() => handleAction(agent, 'ban')}>
                                <Ban className="h-4 w-4 mr-2" />
                                Ban
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleAction(agent, 'delist')}
                              className="text-orange-600"
                            >
                              Delist Properties
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(agent, 'delete')}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, agent: null, action: null });
            setReason('');
            setSuspendedUntil('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'suspend' && 'Suspend Agent'}
              {actionDialog.action === 'ban' && 'Ban Agent'}
              {actionDialog.action === 'activate' && 'Activate Agent'}
              {actionDialog.action === 'delete' && 'Delete Agent'}
              {actionDialog.action === 'delist' && 'Delist Properties'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'suspend' && `Suspend ${actionDialog.agent?.name}? Their properties will be hidden. An email will be sent with your reason.`}
              {actionDialog.action === 'ban' && `Permanently ban ${actionDialog.agent?.name}? All properties will be delisted. An email will be sent with your reason.`}
              {actionDialog.action === 'activate' && `Reactivate ${actionDialog.agent?.name}'s account? An email will be sent.`}
              {actionDialog.action === 'delete' && `Permanently delete ${actionDialog.agent?.name}'s account and all properties? An email will be sent with your reason.`}
              {actionDialog.action === 'delist' && `Delist all properties of ${actionDialog.agent?.name}? An email will be sent with your reason.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(actionDialog.action === 'suspend' || actionDialog.action === 'ban' || actionDialog.action === 'activate' || actionDialog.action === 'delete' || actionDialog.action === 'delist') && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason {actionDialog.action === 'activate' ? '(Optional)' : '(Recommended)'}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    actionDialog.action === 'suspend' ? 'Enter reason for suspension...'
                    : actionDialog.action === 'ban' ? 'Enter reason for ban...'
                    : actionDialog.action === 'activate' ? 'Enter optional message for reactivation...'
                    : actionDialog.action === 'delete' ? 'Enter reason for deletion...'
                    : 'Enter reason for delisting properties...'
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be included in the email notification sent to the agent.
                </p>
              </div>
            )}
            {actionDialog.action === 'suspend' && (
              <div className="space-y-2">
                <Label htmlFor="suspendedUntil">Suspended Until (Optional)</Label>
                <Input
                  id="suspendedUntil"
                  type="datetime-local"
                  value={suspendedUntil}
                  onChange={(e) => setSuspendedUntil(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for indefinite suspension.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, agent: null, action: null });
                setReason('');
                setSuspendedUntil('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'delete' || actionDialog.action === 'ban' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={
                suspendMutation.isPending ||
                banMutation.isPending ||
                activateMutation.isPending ||
                deleteMutation.isPending ||
                delistPropertiesMutation.isPending
              }
            >
              {suspendMutation.isPending || banMutation.isPending || activateMutation.isPending || deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

