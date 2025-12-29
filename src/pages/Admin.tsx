import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle, XCircle, User, Loader2, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Agent } from '@/types';

const Admin = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const verificationsQuery = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: () => api.admin.getPendingVerifications(),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateVerificationMutation = useMutation({
    mutationFn: ({ agentId, status }: { agentId: string; status: 'approved' | 'rejected' }) =>
      api.admin.updateVerificationStatus(agentId, status),
    onSuccess: (_, variables) => {
      toast({
        title: 'Verification Updated',
        description: `Verification ${variables.status} successfully.`,
      });
      verificationsQuery.refetch();
      setSelectedAgent(null);
      setActionType(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

  const pendingAgents = verificationsQuery.data?.data ?? [];

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <ShieldCheck className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleAction = (agent: Agent, action: 'approve' | 'reject') => {
    setSelectedAgent(agent);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedAgent || !actionType) return;
    updateVerificationMutation.mutate({
      agentId: selectedAgent.id,
      status: actionType === 'approve' ? 'approved' : 'rejected',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage agent verification requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
            <CardDescription>
              Review and approve or reject agent verification requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingAgents.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending verifications</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              agent.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name}`
                            }
                            alt={agent.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-semibold">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">{agent.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>{agent.phone || '-'}</TableCell>
                      <TableCell>{agent.listings || 0}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {agent.verificationStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAction(agent, 'approve')}
                            disabled={updateVerificationMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(agent, 'reject')}
                            disabled={updateVerificationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedAgent)} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Verification
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType} the verification request for{' '}
              <strong>{selectedAgent?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={updateVerificationMutation.isPending}
            >
              {updateVerificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
