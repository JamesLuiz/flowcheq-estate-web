import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle, XCircle, Loader2, ArrowLeft, Eye, FileText, 
  Image as ImageIcon, Megaphone, Users, TrendingUp, Ban, RefreshCw, CalendarCheck, Calendar, Mail, Phone, User, DollarSign, Percent, Settings, Image, Home
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { format } from 'date-fns';
import { UnverifiedAgentsManager } from '@/components/admin/UnverifiedAgentsManager';
import { AgentsManager } from '@/components/admin/AgentsManager';
import { PropertiesManager } from '@/components/admin/PropertiesManager';
import { Input } from '@/components/ui/input';

interface Verification {
  id: string;
  userId: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    verified?: boolean;
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

interface Promotion {
  id: string;
  houseId: {
    id: string;
    title: string;
    price: number;
    location: string;
    images: string[];
  };
  userId: {
    id: string;
    name: string;
    email: string;
  };
  bannerImage: string;
  startDate: string;
  endDate: string;
  days: number;
  amount: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  clicks: number;
  createdAt: string;
}

interface Viewing {
  id: string;
  houseId: {
    id: string;
    title: string;
    location: string;
  };
  userId: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  agentId: {
    id: string;
    name: string;
    email: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  viewingFee?: number;
  paymentStatus?: string;
  receiptUrl?: string;
  amountPaid?: number;
  platformFee?: number;
  agentAmount?: number;
}

const Admin = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Main tab state
  const [activeTab, setActiveTab] = useState<'verifications' | 'promotions' | 'viewings' | 'agents' | 'properties'>('verifications');
  const [platformFeeInput, setPlatformFeeInput] = useState<string>('');
  
  // Verification states
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>('pending');
  
  // Promotion states
  const [promotionStatusFilter, setPromotionStatusFilter] = useState<string>('');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  // Verification queries
  const verificationsQuery = useQuery({
    queryKey: ['admin-verifications', verificationStatusFilter],
    queryFn: () => api.admin.getAllVerifications(verificationStatusFilter),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'verifications',
  });

  // Promotions query
  const promotionsQuery = useQuery({
    queryKey: ['admin-promotions', promotionStatusFilter],
    queryFn: () => api.admin.getAllPromotions(promotionStatusFilter),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'promotions',
  });

  // Viewings query
  const viewingsQuery = useQuery({
    queryKey: ['admin-viewings'],
    queryFn: () => api.admin.getAllViewingFees(),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'viewings',
  });

  // Platform fee percentage query
  const platformFeeQuery = useQuery({
    queryKey: ['platform-fee-percentage'],
    queryFn: () => api.admin.getPlatformFeePercentage(),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'viewings',
    onSuccess: (data) => {
      setPlatformFeeInput(String(data.platformFeePercentage || 10));
    },
  });

  // Total agents query (for stats)
  const agentsQuery = useQuery({
    queryKey: ['admin-total-agents'],
    queryFn: () => api.agents.list(),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Verified agents query (for stats)
  const verifiedAgentsQuery = useQuery({
    queryKey: ['admin-verified-agents'],
    queryFn: () => api.agents.list({ verified: true }),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updatePlatformFeeMutation = useMutation({
    mutationFn: (percentage: number) => api.admin.updatePlatformFeePercentage(percentage),
    onSuccess: () => {
      toast({
        title: 'Platform fee updated',
        description: 'Platform fee percentage has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['platform-fee-percentage'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason, message }: { id: string; status: 'approved' | 'rejected'; reason?: string; message?: string }) =>
      api.admin.reviewVerification(id, { status, rejectionReason: reason, adminMessage: message }),
    onSuccess: () => {
      toast({
        title: 'Verification Updated',
        description: 'Verification status updated and email notification sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
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

  const deleteVerificationMutation = useMutation({
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

  const cancelPromotionMutation = useMutation({
    mutationFn: (id: string) => api.admin.cancelPromotion(id),
    onSuccess: () => {
      toast({
        title: 'Promotion Cancelled',
        description: 'The promotion has been cancelled.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      setSelectedPromotion(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Cancel Failed',
        description: error.message,
      });
    },
  });

  const activatePromotionMutation = useMutation({
    mutationFn: (id: string) => api.admin.activatePromotion(id),
    onSuccess: () => {
      toast({
        title: 'Promotion Activated',
        description: 'The promotion is now active.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      setSelectedPromotion(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: error.message,
      });
    },
  });

  const verifications = (verificationsQuery.data as Verification[]) || [];
  const promotions = (promotionsQuery.data as Promotion[]) || [];
  const viewings = (viewingsQuery.data as Viewing[]) || [];
  const pendingViewings = viewings.filter(v => v.status === 'pending').length;
  const totalAgents = agentsQuery.data?.data?.length || 0;
  const verifiedAgents = verifiedAgentsQuery.data?.data?.length || 0;

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <ShieldCheck className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl md:text-3xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleVerificationAction = (verification: Verification, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setActionType(action);
    setRejectionReason(verification.rejectionReason || '');
    setAdminMessage(verification.adminMessage || '');
  };

  const confirmVerificationAction = () => {
    if (!selectedVerification || !actionType) return;
    
    const statusMap: Record<'approve' | 'reject', 'approved' | 'rejected'> = {
      approve: 'approved',
      reject: 'rejected',
    };
    
    reviewMutation.mutate({
      id: selectedVerification.id,
      status: statusMap[actionType],
      reason: actionType === 'reject' ? rejectionReason : undefined,
      message: adminMessage || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      active: 'default',
      rejected: 'destructive',
      cancelled: 'destructive',
      expired: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  // Stats calculations
  const totalPromotionRevenue = promotions.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activePromotions = promotions.filter(p => p.status === 'active').length;
  const pendingVerifications = verifications.filter(v => v.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <Button variant="ghost" className="mb-4 md:mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage verifications, promotions, and platform settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span> Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingVerifications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Active Promotions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePromotions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Total</span> Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalPromotionRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Total Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentsQuery.isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{totalAgents}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Verified Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verifiedAgentsQuery.isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="text-2xl font-bold">{verifiedAgents}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl">
            <TabsTrigger value="verifications" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Verifications</span>
              <span className="sm:hidden">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Promotions</span>
              <span className="sm:hidden">Promo</span>
            </TabsTrigger>
            <TabsTrigger value="viewings" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Viewings</span>
              <span className="sm:hidden">Views</span>
              {pendingViewings > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingViewings}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Agents</span>
              <span className="sm:hidden">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
              <span className="sm:hidden">Props</span>
            </TabsTrigger>
          </TabsList>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            <Tabs value={verificationStatusFilter} onValueChange={setVerificationStatusFilter}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="">All</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Verification Requests</CardTitle>
                <CardDescription>
                  Review and approve or reject verification documents. Email notifications are sent automatically.
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
                          <TableHead className="hidden md:table-cell">Document</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden sm:table-cell">Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifications.map((verification) => (
                          <TableRow key={verification.id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-sm">{verification.userId.name}</p>
                                <p className="text-xs text-muted-foreground hidden sm:block">{verification.userId.email}</p>
                                <p className="text-xs text-muted-foreground capitalize">{verification.userId.role}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="capitalize text-xs">
                                {verification.documentType === 'nin' ? 'NIN' : "Driver's License"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(verification.status)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                              {new Date(verification.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVerification(verification);
                                    setActionType(null);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">View</span>
                                </Button>
                                {verification.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleVerificationAction(verification, 'approve')}
                                      disabled={reviewMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleVerificationAction(verification, 'reject')}
                                      disabled={reviewMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {!verification.userId?.verified && verification.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={async () => {
                                      try {
                                        await api.admin.sendVerificationReminder(verification.userId.id);
                                        toast({
                                          title: 'Reminder Sent',
                                          description: `Verification reminder sent to ${verification.userId.email}`,
                                        });
                                      } catch (error: any) {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Failed to send reminder',
                                          description: error.message,
                                        });
                                      }
                                    }}
                                    title="Send verification reminder email"
                                  >
                                    <Mail className="h-4 w-4" />
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

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-4">
            <Tabs value={promotionStatusFilter} onValueChange={setPromotionStatusFilter}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Promotions Management</CardTitle>
                <CardDescription>
                  View and manage property promotions and featured listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {promotionsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : promotions.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No promotions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className="hidden md:table-cell">Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden sm:table-cell">Amount</TableHead>
                          <TableHead className="hidden lg:table-cell">Clicks</TableHead>
                          <TableHead className="hidden md:table-cell">Duration</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promotions.map((promotion) => (
                          <TableRow key={promotion.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <img 
                                  src={promotion.bannerImage} 
                                  alt="Banner" 
                                  className="w-12 h-12 rounded object-cover hidden sm:block"
                                />
                                <div>
                                  <p className="font-semibold text-sm line-clamp-1">
                                    {promotion.houseId?.title || 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {promotion.houseId?.location || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <p className="text-sm">{promotion.userId?.name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{promotion.userId?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(promotion.status)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="font-semibold">₦{promotion.amount?.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {promotion.clicks}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              <div>
                                <p>{new Date(promotion.startDate).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  to {new Date(promotion.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPromotion(promotion)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {promotion.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => activatePromotionMutation.mutate(promotion.id)}
                                    disabled={activatePromotionMutation.isPending}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                                {(promotion.status === 'active' || promotion.status === 'pending') && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => cancelPromotionMutation.mutate(promotion.id)}
                                    disabled={cancelPromotionMutation.isPending}
                                  >
                                    <Ban className="h-4 w-4" />
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

          {/* Viewings Tab */}
          <TabsContent value="viewings" className="space-y-4">
            {/* Platform Fee Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Platform Fee Settings
                </CardTitle>
                <CardDescription>
                  Set the platform fee percentage deducted from viewing fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformFeeQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Current Platform Fee</p>
                        <p className="text-sm text-muted-foreground">
                          {platformFeeQuery.data?.platformFeePercentage || 10}% of viewing fee
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg">
                        {platformFeeQuery.data?.platformFeePercentage || 10}%
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor="platformFee">Platform Fee Percentage (%)</Label>
                          <Input
                            id="platformFee"
                            type="number"
                            min="0"
                            max="100"
                            value={platformFeeInput}
                            onChange={(e) => setPlatformFeeInput(e.target.value)}
                            placeholder="10"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            const percentage = parseFloat(platformFeeInput);
                            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                              toast({
                                variant: 'destructive',
                                title: 'Invalid percentage',
                                description: 'Please enter a number between 0 and 100',
                              });
                              return;
                            }
                            updatePlatformFeeMutation.mutate(percentage);
                          }}
                          disabled={updatePlatformFeeMutation.isPending}
                          className="mt-6"
                        >
                          {updatePlatformFeeMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update'
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Set the platform fee percentage deducted from viewing fees (0-100%).
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Viewing Fees List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Viewing Fees & Receipts
                </CardTitle>
                <CardDescription>
                  Manage all property viewing requests, fees, and payment receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {viewingsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : viewings.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No viewing requests yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className="hidden md:table-cell">User</TableHead>
                          <TableHead className="hidden md:table-cell">Agent</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewings.map((viewing) => (
                          <TableRow key={viewing.id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-sm line-clamp-1">{viewing.houseId?.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{viewing.houseId?.location}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="space-y-1">
                                <p className="text-sm flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {viewing.userId?.name}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {viewing.userId?.email}
                                </p>
                                {viewing.userId?.phone && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {viewing.userId.phone}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <p className="text-sm">{viewing.agentId?.name}</p>
                                <p className="text-xs text-muted-foreground">{viewing.agentId?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(viewing.scheduledDate), 'PPP')}
                                </p>
                                <p className="text-xs text-muted-foreground">{viewing.scheduledTime}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {viewing.viewingFee ? (
                                <div className="text-sm">
                                  <p className="font-semibold">₦{viewing.viewingFee.toLocaleString()}</p>
                                  {viewing.platformFee && viewing.agentAmount !== undefined && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <p>Platform: ₦{((viewing.viewingFee * viewing.platformFee) / 100).toFixed(2)}</p>
                                      <p>Agent: ₦{viewing.agentAmount.toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No fee</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {viewing.paymentStatus ? (
                                <Badge variant={viewing.paymentStatus === 'paid' ? 'default' : viewing.paymentStatus === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                                  {viewing.paymentStatus}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(viewing.status)}
                            </TableCell>
                            <TableCell>
                              {viewing.receiptUrl ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(viewing.receiptUrl, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No receipt</span>
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
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <UnverifiedAgentsManager />
            <AgentsManager />
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <PropertiesManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* View Verification Document Dialog */}
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
                    {selectedVerification.documentUrl?.endsWith('.pdf') ? (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedVerification.documentUrl, '_blank')}
                    className="w-full mt-2"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Open Document
                  </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedVerification.selfieUrl, '_blank')}
                    className="w-full mt-2"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Open Selfie
                  </Button>
                </div>
              </div>

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

      {/* Approve/Reject Verification Dialog */}
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
                ? `Approve verification for ${selectedVerification?.userId.name}? An email notification will be sent.`
                : `Reject verification for ${selectedVerification?.userId.name}? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Document is unclear, name doesn't match..."
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="adminMessage">Message to User (Email)</Label>
              <Textarea
                id="adminMessage"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder={actionType === 'approve' 
                  ? 'Congratulations! Your account has been verified...'
                  : 'Please resubmit with a clearer document...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmVerificationAction}
              disabled={reviewMutation.isPending || (actionType === 'reject' && !rejectionReason)}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : actionType === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {actionType === 'approve' ? 'Approve & Send Email' : 'Reject & Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Promotion Dialog */}
      <Dialog open={selectedPromotion !== null} onOpenChange={() => setSelectedPromotion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Promotion Details</DialogTitle>
            <DialogDescription>
              Viewing promotion for {selectedPromotion?.houseId?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedPromotion && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden border">
                <img 
                  src={selectedPromotion.bannerImage} 
                  alt="Promotion Banner" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Property</Label>
                  <p className="font-semibold">{selectedPromotion.houseId?.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedPromotion.houseId?.location}</p>
                </div>
                <div>
                  <Label>Agent</Label>
                  <p className="font-semibold">{selectedPromotion.userId?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPromotion.userId?.email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPromotion.status)}</div>
                </div>
                <div>
                  <Label>Amount Paid</Label>
                  <p className="font-semibold text-lg">₦{selectedPromotion.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p>{selectedPromotion.days} days</p>
                </div>
                <div>
                  <Label>Total Clicks</Label>
                  <p className="font-semibold">{selectedPromotion.clicks}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p>{new Date(selectedPromotion.startDate).toLocaleString()}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p>{new Date(selectedPromotion.endDate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedPromotion?.status === 'pending' && (
              <Button
                variant="default"
                onClick={() => activatePromotionMutation.mutate(selectedPromotion.id)}
                disabled={activatePromotionMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Activate Promotion
              </Button>
            )}
            {(selectedPromotion?.status === 'active' || selectedPromotion?.status === 'pending') && (
              <Button
                variant="destructive"
                onClick={() => cancelPromotionMutation.mutate(selectedPromotion!.id)}
                disabled={cancelPromotionMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancel Promotion
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedPromotion(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
