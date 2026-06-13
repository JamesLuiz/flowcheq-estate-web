import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle,
  ExternalLink,
  FileText,
  Loader2,
  Scale,
  XCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type PendingListing = {
  id: string;
  title: string;
  location: string;
  listingType?: string;
  verificationStatus?: string;
  lawyerReview?: { status: string; rejectionReason?: string };
  ownershipDocuments?: Array<{ type: string; url: string }>;
  owner?: { name?: string; email?: string; phone?: string };
  createdAt?: string;
};

const LawyerDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PendingListing | null>(null);
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const [cofo, setCofo] = useState({
    certificateNumber: '',
    ownerName: '',
    plotNumber: '',
    surveyNumber: '',
    location: '',
    issueDate: '',
    lga: '',
    state: '',
    notes: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [certCheck, setCertCheck] = useState<{ duplicate: boolean } | null>(null);

  const pendingQuery = useQuery({
    queryKey: ['legal-review-pending'],
    queryFn: () => api.legalReview.listPending(),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.legalReview.approve(selected!.id, cofo),
    onSuccess: () => {
      toast({ title: 'Listing approved', description: 'Property is now verified and can go live.' });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['legal-review-pending'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Approval failed', description: e.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.legalReview.reject(selected!.id, { rejectionReason }),
    onSuccess: () => {
      toast({ title: 'Listing rejected' });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['legal-review-pending'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Rejection failed', description: e.message }),
  });

  const checkCert = async (cert: string) => {
    if (!cert.trim()) return;
    const result = await api.legalReview.checkCertificate(cert, selected?.id);
    setCertCheck(result);
    if (result.duplicate) {
      toast({
        variant: 'destructive',
        title: 'Duplicate certificate',
        description: 'This C of O is already linked to a verified listing.',
      });
    }
  };

  const closeDialog = () => {
    setSelected(null);
    setMode(null);
    setCertCheck(null);
    setRejectionReason('');
  };

  const listings = (pendingQuery.data ?? []) as PendingListing[];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Scale className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Legal review panel</h1>
            <p className="text-muted-foreground text-sm">
              Review C of O and ownership documents. Only lawyer-approved listings go live.
            </p>
          </div>
        </div>

        {pendingQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No listings awaiting legal review
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{listing.title}</CardTitle>
                      <CardDescription>{listing.location}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {listing.lawyerReview?.status ?? 'pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.owner && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Owner: </span>
                      {listing.owner.name} · {listing.owner.email}
                    </p>
                  )}
                  {listing.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Submitted {format(new Date(listing.createdAt), 'PPP')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {listing.ownershipDocuments?.map((doc, i) => (
                      <Button key={i} variant="outline" size="sm" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          {doc.type.replace(/_/g, ' ')}
                          <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
                        </a>
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelected(listing);
                        setMode('approve');
                        setCofo((c) => ({
                          ...c,
                          ownerName: listing.owner?.name ?? '',
                          location: listing.location,
                        }));
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve & enter C of O
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelected(listing);
                        setMode('reject');
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selected && mode === 'approve'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve — {selected?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter C of O details manually (OCR assist can be added later). Used to detect duplicate
            listings.
          </p>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Certificate number *</Label>
              <Input
                value={cofo.certificateNumber}
                onChange={(e) => setCofo((c) => ({ ...c, certificateNumber: e.target.value }))}
                onBlur={(e) => checkCert(e.target.value)}
              />
              {certCheck?.duplicate && (
                <p className="text-xs text-destructive">Duplicate certificate on another listing</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Registered owner name *</Label>
              <Input
                value={cofo.ownerName}
                onChange={(e) => setCofo((c) => ({ ...c, ownerName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Plot number</Label>
                <Input
                  value={cofo.plotNumber}
                  onChange={(e) => setCofo((c) => ({ ...c, plotNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Survey number</Label>
                <Input
                  value={cofo.surveyNumber}
                  onChange={(e) => setCofo((c) => ({ ...c, surveyNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Location on certificate</Label>
              <Input
                value={cofo.location}
                onChange={(e) => setCofo((c) => ({ ...c, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Issue date</Label>
                <Input
                  type="date"
                  value={cofo.issueDate}
                  onChange={(e) => setCofo((c) => ({ ...c, issueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input
                  value={cofo.state}
                  onChange={(e) => setCofo((c) => ({ ...c, state: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={cofo.notes}
                onChange={(e) => setCofo((c) => ({ ...c, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={
                approveMutation.isPending ||
                !cofo.certificateNumber ||
                !cofo.ownerName ||
                certCheck?.duplicate
              }
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Approve listing'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected && mode === 'reject'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject — {selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Document mismatch, invalid C of O, etc."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || rejectionReason.length < 5}
            >
              Reject listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LawyerDashboard;
