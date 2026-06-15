import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';

type LawFirmPartner = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  lawFirmVerificationStatus?: 'pending' | 'approved' | 'rejected';
  lawFirmRejectionReason?: string;
  lawFirmDetails?: {
    firmName?: string;
    barRegistrationNumber?: string;
    businessEmail?: string;
    businessPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    website?: string;
    practicingCertificateUrl?: string;
  };
  createdAt?: string;
};

export const LawFirmsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [selected, setSelected] = useState<LawFirmPartner | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const firmsQuery = useQuery({
    queryKey: ['admin-law-firms', statusFilter],
    queryFn: () => api.admin.getLawFirms(statusFilter || undefined),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason: reason,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => api.admin.updateLawFirmStatus(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      toast({ title: 'Law firm status updated' });
      queryClient.invalidateQueries({ queryKey: ['admin-law-firms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelected(null);
      setAction(null);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    },
  });

  const firms = (firmsQuery.data?.data ?? []) as LawFirmPartner[];

  const statusBadge = (status?: string) => {
    if (status === 'approved') return <Badge className="bg-green-600">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Law Firm Partners
          </CardTitle>
          <CardDescription>
            Review and approve partner law firms for the legal review panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {firmsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : firms.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No law firm registrations found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firm</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bar ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firms.map((firm) => (
                    <TableRow key={firm.id}>
                      <TableCell>
                        <div className="font-medium">{firm.lawFirmDetails?.firmName ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{firm.lawFirmDetails?.state}</div>
                      </TableCell>
                      <TableCell>
                        <div>{firm.name}</div>
                        <div className="text-xs text-muted-foreground">{firm.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {firm.lawFirmDetails?.barRegistrationNumber ?? '—'}
                      </TableCell>
                      <TableCell>{statusBadge(firm.lawFirmVerificationStatus)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {firm.createdAt ? format(new Date(firm.createdAt), 'PP') : '—'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {firm.lawFirmDetails?.practicingCertificateUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={firm.lawFirmDetails.practicingCertificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {firm.lawFirmVerificationStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelected(firm);
                                setAction('approve');
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelected(firm);
                                setAction('reject');
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
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
        open={!!selected && action === 'approve'}
        onOpenChange={(open) => !open && (setSelected(null), setAction(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selected?.lawFirmDetails?.firmName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This partner will be able to sign in and access the legal review panel.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setSelected(null), setAction(null))}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                reviewMutation.mutate({ id: selected!.id, status: 'approved' })
              }
              disabled={reviewMutation.isPending}
            >
              Confirm approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selected && action === 'reject'}
        onOpenChange={(open) => !open && (setSelected(null), setAction(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selected?.lawFirmDetails?.firmName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Invalid certificate, unverifiable bar registration, etc."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setSelected(null), setAction(null))}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                reviewMutation.mutate({
                  id: selected!.id,
                  status: 'rejected',
                  rejectionReason,
                })
              }
              disabled={reviewMutation.isPending || rejectionReason.length < 5}
            >
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
