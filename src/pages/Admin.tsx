import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle, XCircle, User, Loader2, ArrowLeft, Eye, FileText, Image as ImageIcon, UserCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Verification {
  id: string;
  userId: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
  documentType: 'nin' | 'driver_license';
  documentUrl: string;
  selfieUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminMessage?: string;
  nameMatches?: boolean;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
}

const Admin = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const verificationsQuery = useQuery({
    queryKey: ['admin-verifications', statusFilter],
    queryFn: () => api.admin.getAllVerifications(statusFilter),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason, message }: { id: string; status: 'approved' | 'rejected'; reason?: string; message?: string }) =>
      api.admin.reviewVerification(id, { status, rejectionReason: reason, adminMessage: message }),
    onSuccess: () => {
      toast({
        title: 'Verification Updated',
        description: 'Verification status updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['verification'] });
      setSelectedVerification(null);
      setActionType(null);
      setRejectionReason('');
      setAdminMessage('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteVerification(id),
    onSuccess: () => {
      toast({
        title: 'Verification Deleted',
        description: 'Verification document deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message,
      });
    },
  });

  const verifications = (verificationsQuery.data as Verification[]) || [];

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

  const handleAction = (verification: Verification, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setActionType(action);
    setRejectionReason(verification.rejectionReason || '');
    setAdminMessage(verification.adminMessage || '');
  };

  const confirmAction = () => {
    if (!selectedVerification || !actionType) return;
    
    reviewMutation.mutate({
      id: selectedVerification.id,
      status: actionType,
      reason: actionType === 'reject' ? rejectionReason : undefined,
      message: adminMessage || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
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
            Manage verification requests and review documents
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="">All</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle>Verification Requests</CardTitle>
                <CardDescription>
                  Review and approve or reject verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : verifications.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No verifications found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifications.map((verification) => (
                          <TableRow key={verification.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-semibold">{verification.userId.name}</p>
                                  <p className="text-sm text-muted-foreground">{verification.userId.email}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{verification.userId.role}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {verification.documentType === 'nin' ? 'NIN' : "Driver's License"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(verification.status)}
                            </TableCell>
                            <TableCell>
                              {new Date(verification.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVerification(verification);
                                    setActionType(null);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {verification.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleAction(verification, 'approve')}
                                      disabled={reviewMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleAction(verification, 'reject')}
                                      disabled={reviewMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {verification.status === 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(verification.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Document Dialog */}
      <Dialog open={selectedVerification !== null && actionType === null} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Document</DialogTitle>
            <DialogDescription>
              Review verification document for {selectedVerification?.userId.name}
            </DialogDescription>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User Name</Label>
                  <p className="font-semibold">{selectedVerification.userId.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{selectedVerification.userId.email}</p>
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedVerification.documentType === 'nin' ? 'NIN' : "Driver's License"}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  {getStatusBadge(selectedVerification.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Document (NIN/Driver's License)</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                    {selectedVerification.documentUrl.endsWith('.pdf') ? (
                      <iframe
                        src={selectedVerification.documentUrl}
                        className="w-full h-96 rounded"
                        title="Verification Document"
                      />
                    ) : (
                      <img
                        src={selectedVerification.documentUrl}
                        alt="Verification Document"
                        className="w-full h-auto rounded max-h-96 object-contain mx-auto"
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedVerification.documentUrl, '_blank')}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Open Document
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Selfie/Passport Photo</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                    <img
                      src={selectedVerification.selfieUrl}
                      alt="Selfie/Passport Photo"
                      className="w-full h-auto rounded max-h-96 object-contain mx-auto"
                    />
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedVerification.selfieUrl, '_blank')}
                      className="w-full"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Open Selfie
                    </Button>
                  </div>
                </div>
              </div>

              {selectedVerification.rejectionReason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <p className="text-sm text-muted-foreground">{selectedVerification.rejectionReason}</p>
                </div>
              )}

              {selectedVerification.adminMessage && (
                <div>
                  <Label>Admin Message</Label>
                  <p className="text-sm text-muted-foreground">{selectedVerification.adminMessage}</p>
                </div>
              )}

              {selectedVerification.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="default"
                    onClick={() => {
                      setActionType('approve');
                      setAdminMessage('Your verification has been approved. You can now upload properties.');
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setActionType('reject')}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVerification(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionType !== null} onOpenChange={() => {
        setActionType(null);
        setRejectionReason('');
        setAdminMessage('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Verification
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Approve verification for ${selectedVerification?.userId.name}?`
                : `Reject verification for ${selectedVerification?.userId.name}? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminMessage">Message to User</Label>
              <Textarea
                id="adminMessage"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder={actionType === 'approve' 
                  ? 'Your verification has been approved. You can now upload properties.'
                  : 'Please provide a message explaining why the verification was rejected.'}
                rows={3}
              />
            </div>
            {actionType === 'reject' && (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Input
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Document is unclear, Name doesn't match, Document expired"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionType(null);
              setRejectionReason('');
              setAdminMessage('');
            }}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={reviewMutation.isPending || (actionType === 'reject' && !rejectionReason)}
            >
              {reviewMutation.isPending ? (
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
