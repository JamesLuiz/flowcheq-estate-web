import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  ClipboardList,
  Loader2,
  MapPin,
  MessageCircle,
  User,
  Wallet,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PhotoLocationVerificationPanel } from '@/components/verification/PhotoLocationVerificationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { VerifyAccountBanner } from '@/components/VerifyAccountBanner';
import { format } from 'date-fns';

const LEAD_STATUSES = ['new', 'contacted', 'interested', 'closed'] as const;

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verifyPropertyId, setVerifyPropertyId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [gpsVerifyPropertyId, setGpsVerifyPropertyId] = useState<string | null>(null);

  const managedQuery = useQuery({
    queryKey: ['agent-managed-properties'],
    queryFn: () => api.propertyManagement.listManagedProperties(),
  });

  const outgoingQuery = useQuery({
    queryKey: ['management-requests-outgoing'],
    queryFn: () => api.propertyManagement.listOutgoingRequests(),
  });

  const leadsQuery = useQuery({
    queryKey: ['agent-leads'],
    queryFn: () => api.propertyManagement.listAgentLeads(),
  });

  const verifyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported in this browser'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      return api.propertyManagement.verifyLocation(propertyId, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        notes: verifyNotes || undefined,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Location verified',
        description: `On-site check passed (${Math.round(data.distanceMeters)}m from listing).`,
      });
      setVerifyPropertyId(null);
      setVerifyNotes('');
      queryClient.invalidateQueries({ queryKey: ['agent-managed-properties'] });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Verification failed', description: e.message });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: (typeof LEAD_STATUSES)[number] }) =>
      api.propertyManagement.updateLead(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-leads'] });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not update lead', description: e.message });
    },
  });

  const managed = managedQuery.data ?? [];
  const outgoing = outgoingQuery.data ?? [];
  const leads = leadsQuery.data ?? [];
  const pendingOutgoing = outgoing.filter((r: any) => r.status === 'pending');

  const propertyTitle = (p: any) =>
    typeof p === 'object' && p?.title ? p.title : 'Property';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agent Dashboard</h1>
            <p className="text-muted-foreground">
              {user?.name} — manage properties, follow up leads, verify on-site
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/profile/edit')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="outline" onClick={() => navigate('/agent/wallet')}>
              <Wallet className="mr-2 h-4 w-4" />
              Wallet
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <VerifyAccountBanner />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Managed listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managed.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOutgoing.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lead inbox</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="managed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="managed" className="gap-2">
              <Building2 className="h-4 w-4" />
              Managed
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="managed">
            {gpsVerifyPropertyId && (
              <div className="mb-6">
                <PhotoLocationVerificationPanel
                  propertyId={gpsVerifyPropertyId}
                  title="Field inspection — GPS photo verification"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setGpsVerifyPropertyId(null)}
                >
                  Close
                </Button>
              </div>
            )}
            {managedQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : managed.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>No managed properties yet.</p>
                  <p className="text-sm mt-2">
                    Open a listing and send a management request to the landlord.
                  </p>
                  <Button className="mt-4" variant="secondary" asChild>
                    <Link to="/">Browse properties</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {managed.map((row: any) => {
                  const property = row.property;
                  const id =
                    typeof property === 'object'
                      ? property?._id ?? property?.id
                      : property;
                  const title = propertyTitle(property);
                  const verified = property?.agentLocationVerification?.verified;
                  return (
                    <Card key={row.managementRequestId}>
                      <CardHeader>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{property?.location}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {verified ? (
                          <Badge variant="default">On-site verified</Badge>
                        ) : (
                          <Badge variant="secondary">Location not verified</Badge>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" asChild>
                            <Link to={`/house/${id}`}>View listing</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVerifyPropertyId(String(id))}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            On-site GPS
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setGpsVerifyPropertyId(String(id))}
                          >
                            Verify photo EXIF
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/promotions/setup" state={{ propertyId: id, propertyTitle: title }}>
                              Promote
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {outgoingQuery.isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : outgoing.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No management requests yet.</p>
            ) : (
              <div className="space-y-3">
                {outgoing.map((req: any) => (
                  <Card key={req._id}>
                    <CardContent className="pt-6 flex justify-between items-start gap-4">
                      <div>
                        <p className="font-medium">{propertyTitle(req.propertyId)}</p>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {req.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {req.createdAt && format(new Date(req.createdAt), 'PP')}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads">
            {leadsQuery.isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : leads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Leads appear when house hunters view managed listings.
              </p>
            ) : (
              <div className="space-y-3">
                {leads.map((lead: any) => {
                  const property = lead.propertyId;
                  const viewer = lead.viewerId;
                  return (
                    <Card key={lead._id}>
                      <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{propertyTitle(property)}</p>
                          <p className="text-sm text-muted-foreground">
                            {lead.viewerName ||
                              (typeof viewer === 'object' ? viewer?.name : null) ||
                              'Anonymous viewer'}{' '}
                            · {lead.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.createdAt && format(new Date(lead.createdAt), 'PPp')}
                          </p>
                        </div>
                        <Select
                          value={lead.status}
                          onValueChange={(v) =>
                            updateLeadMutation.mutate({
                              id: lead._id,
                              status: v as (typeof LEAD_STATUSES)[number],
                            })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(verifyPropertyId)} onOpenChange={() => setVerifyPropertyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify on-site location</DialogTitle>
            <DialogDescription>
              You must be within 30m of the listing. Uses your device GPS (Flowcheq Capture on mobile for photos).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyPropertyId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => verifyPropertyId && verifyMutation.mutate(verifyPropertyId)}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Submit GPS check'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDashboard;
