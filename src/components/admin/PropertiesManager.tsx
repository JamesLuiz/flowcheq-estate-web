import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, Flag, Trash2, Eye, Loader2, AlertTriangle, CheckCircle, FileText, CheckCircle2, XCircle } from 'lucide-react';
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
import { House } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

export const PropertiesManager = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    property: House | null;
    action: 'flag' | 'unflag' | 'delete' | null;
  }>({ open: false, property: null, action: null });
  const [verificationDialog, setVerificationDialog] = useState<{ open: boolean; property: House | null }>({ open: false, property: null });

  const verifyAddressMutation = useMutation({
    mutationFn: (propertyId: string) => api.admin.verifyPropertyAddress(propertyId),
    onSuccess: () => {
      toast({ title: 'Address verified', description: 'Property address has been marked as verified.' });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setVerificationDialog({ open: false, property: null });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to verify address', description: error.message });
    },
  });
  const [reason, setReason] = useState('');

  const propertiesQuery = useQuery({
    queryKey: ['admin-properties', filter],
    queryFn: () => api.admin.getAllProperties(filter === 'flagged' ? true : undefined),
  });

  const flagMutation = useMutation({
    mutationFn: ({ propertyId, reason }: { propertyId: string; reason?: string }) =>
      api.admin.flagProperty(propertyId, reason),
    onSuccess: () => {
      toast({
        title: 'Property flagged',
        description: 'Property has been flagged and hidden from users.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setActionDialog({ open: false, property: null, action: null });
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to flag property',
        description: error.message,
      });
    },
  });

  const unflagMutation = useMutation({
    mutationFn: (propertyId: string) => api.admin.unflagProperty(propertyId),
    onSuccess: () => {
      toast({
        title: 'Property unflagged',
        description: 'Property has been unflagged and is now visible.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setActionDialog({ open: false, property: null, action: null });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to unflag property',
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (propertyId: string) => api.admin.deleteProperty(propertyId),
    onSuccess: () => {
      toast({
        title: 'Property deleted',
        description: 'Property has been permanently deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setActionDialog({ open: false, property: null, action: null });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete property',
        description: error.message,
      });
    },
  });

  const properties = propertiesQuery.data?.data || [];

  const handleAction = (property: House, action: 'flag' | 'unflag' | 'delete') => {
    setActionDialog({ open: true, property, action });
  };

  const confirmAction = () => {
    if (!actionDialog.property || !actionDialog.action) return;

    const { property, action } = actionDialog;

    if (action === 'flag') {
      flagMutation.mutate({ propertyId: property.id, reason: reason || undefined });
    } else if (action === 'unflag') {
      unflagMutation.mutate(property.id);
    } else if (action === 'delete') {
      deleteMutation.mutate(property.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Properties Management
          </CardTitle>
          <CardDescription>
            Manage all properties, flag inappropriate listings, or delete them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'flagged')} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All Properties</TabsTrigger>
              <TabsTrigger value="flagged">Flagged</TabsTrigger>
            </TabsList>
          </Tabs>

          {propertiesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No properties found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Address Verification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property: House) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {property.images?.[0] && (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{property.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {property.type} • {property.bedrooms} bed • {property.bathrooms} bath
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{property.agent?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{property.agent?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(property.price)}</TableCell>
                      <TableCell className="text-sm">{property.location}</TableCell>
                      <TableCell>
                        {(property as any).flagged ? (
                          <Badge variant="destructive">Flagged</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVerificationDialog({ open: true, property })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {property.addressVerified && (
                            <Badge className="bg-green-600 text-white flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Verified
                            </Badge>
                          )}
                          {(property as any).flagged ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(property, 'unflag')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Unflag
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(property, 'flag')}
                            >
                              <Flag className="h-4 w-4 mr-1" />
                              Flag
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(property, 'delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, property: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'flag' && 'Flag Property'}
              {actionDialog.action === 'unflag' && 'Unflag Property'}
              {actionDialog.action === 'delete' && 'Delete Property'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'flag' && `Flag ${actionDialog.property?.title}? It will be hidden from users.`}
              {actionDialog.action === 'unflag' && `Unflag ${actionDialog.property?.title}? It will be visible again.`}
              {actionDialog.action === 'delete' && `Permanently delete ${actionDialog.property?.title}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          {actionDialog.action === 'flag' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flagReason">Reason for Flagging (Optional)</Label>
                <Textarea
                  id="flagReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for flagging this property..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, property: null, action: null })}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={
                flagMutation.isPending ||
                unflagMutation.isPending ||
                deleteMutation.isPending
              }
            >
              {flagMutation.isPending || unflagMutation.isPending || deleteMutation.isPending ? (
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

      <Dialog
        open={verificationDialog.open}
        onOpenChange={(open) => !open && setVerificationDialog({ open: false, property: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proof of Address</DialogTitle>
            <DialogDescription>
              View the proof of address uploaded by the agent for this property.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {verificationDialog.property?.proofOfAddress ? (
              <div className="w-full flex flex-col items-center">
                <img
                  src={verificationDialog.property.proofOfAddress}
                  alt="Proof of address"
                  className="max-h-[60vh] w-auto rounded shadow-md object-contain"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(verificationDialog.property?.proofOfAddress, '_blank')}
                  >
                    Open in new tab
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className={!verificationDialog.property?.addressVerified ? 'bg-green-600 text-white' : ''}
                    onClick={() => verificationDialog.property && verifyAddressMutation.mutate(verificationDialog.property.id)}
                    disabled={verifyAddressMutation.isPending || verificationDialog.property?.addressVerified}
                  >
                    {verificationDialog.property?.addressVerified ? 'Already Verified' : 'Mark Address Verified'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No proof of address uploaded for this property.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialog({ open: false, property: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

