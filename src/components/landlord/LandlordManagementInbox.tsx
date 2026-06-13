import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function LandlordManagementInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['management-requests-incoming'],
    queryFn: () => api.propertyManagement.listIncomingRequests(),
  });

  const pending = requests.filter((r: any) => r.status === 'pending');

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'accepted' | 'rejected';
    }) => api.propertyManagement.updateManagementRequest(id, { status }),
    onSuccess: (_, vars) => {
      toast({
        title: vars.status === 'accepted' ? 'Agent approved' : 'Request declined',
      });
      queryClient.invalidateQueries({ queryKey: ['management-requests-incoming'] });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (pending.length === 0) return null;

  return (
    <Card className="mb-8 border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-lg">Agent management requests</CardTitle>
        <CardDescription>
          Agents asking to manage your listings ({pending.length} pending)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pending.map((req: any) => {
          const property = req.propertyId;
          const agent = req.agentId;
          const propertyTitle =
            typeof property === 'object' ? property?.title : 'Property';
          const agentName = typeof agent === 'object' ? agent?.name : 'Agent';
          const agentObj = typeof agent === 'object' ? agent : null;
          return (
            <div
              key={req._id}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-lg border bg-muted/30"
            >
              <div className="flex gap-3">
                <img
                  src={
                    agentObj?.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(agentName)}`
                  }
                  alt={agentName}
                  className="h-12 w-12 rounded-full object-cover shrink-0"
                />
                <div>
                  <p className="font-medium">{propertyTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{agentName}</span>
                    {agentObj?.verified && (
                      <span className="ml-1 text-xs text-primary">(verified)</span>
                    )}{' '}
                    wants to manage this listing
                  </p>
                  {agentObj?.email && (
                    <p className="text-xs text-muted-foreground">{agentObj.email}</p>
                  )}
                  {agentObj?.phone && (
                    <p className="text-xs text-muted-foreground">{agentObj.phone}</p>
                  )}
                  {req.bio && (
                    <p className="text-sm mt-2 p-2 rounded bg-background border">
                      <span className="text-xs font-medium text-muted-foreground">Bio: </span>
                      {req.bio}
                    </p>
                  )}
                  {req.message && (
                    <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{req.message}&rdquo;</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() =>
                    updateMutation.mutate({ id: req._id, status: 'accepted' })
                  }
                  disabled={updateMutation.isPending}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateMutation.mutate({ id: req._id, status: 'rejected' })
                  }
                  disabled={updateMutation.isPending}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
