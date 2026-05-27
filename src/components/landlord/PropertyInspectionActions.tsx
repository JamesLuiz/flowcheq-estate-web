import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { INSPECTION_FEE_NGN } from '@/lib/listing-requirements';
import { formatPriceNgn } from '@/lib/format';
import type { House } from '@/types';

interface PropertyInspectionActionsProps {
  house: House;
  onUpdated?: () => void;
}

export function PropertyInspectionActions({ house, onUpdated }: PropertyInspectionActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['property-verification', house.id],
    queryFn: () => api.propertyVerification.getPropertyVerificationStatus(house.id),
    enabled: Boolean(house.id),
    staleTime: 30_000,
  });

  const inspectionFeePaid =
    house.inspectionFeePaid ?? statusQuery.data?.inspectionFeePaid ?? false;
  const verificationStatus =
    (house as House & { verificationStatus?: string }).verificationStatus ??
    statusQuery.data?.status;

  const payMutation = useMutation({
    mutationFn: () => api.propertyVerification.payInspection(house.id),
    onSuccess: (data) => {
      if (data.alreadyPaid || data.paymentLink == null) {
        toast({
          title: 'Inspection fee paid',
          description: 'You can request field verification for this listing.',
        });
        queryClient.invalidateQueries({ queryKey: ['agent-houses'] });
        queryClient.invalidateQueries({ queryKey: ['property-verification', house.id] });
        onUpdated?.();
        return;
      }
      window.location.href = data.paymentLink;
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: error.message,
      });
    },
  });

  const requestMutation = useMutation({
    mutationFn: () => api.propertyVerification.requestFieldVerification(house.id),
    onSuccess: () => {
      toast({
        title: 'Inspection requested',
        description: 'A field verifier will be assigned after admin review.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-houses'] });
      queryClient.invalidateQueries({ queryKey: ['property-verification', house.id] });
      onUpdated?.();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Could not submit request',
        description: error.message,
      });
    },
  });

  if (verificationStatus === 'verified') {
    return (
      <Badge variant="default" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        Field verified
      </Badge>
    );
  }

  if (verificationStatus === 'pending_verification') {
    return (
      <Badge variant="secondary" className="gap-1">
        <MapPin className="h-3 w-3" />
        Inspection pending
      </Badge>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        Pay {formatPriceNgn(INSPECTION_FEE_NGN)} for on-site field inspection before your listing can go live.
      </p>
      {!inspectionFeePaid ? (
        <Button
          size="sm"
          className="w-full"
          onClick={() => payMutation.mutate()}
          disabled={payMutation.isPending}
        >
          {payMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening payment…
            </>
          ) : (
            `Pay inspection fee (${formatPriceNgn(INSPECTION_FEE_NGN)})`
          )}
        </Button>
      ) : (
        <>
          <Alert className="py-2">
            <AlertDescription className="text-xs">
              Inspection fee received. Submit for field verification.
            </AlertDescription>
          </Alert>
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending}
          >
            {requestMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Request field verification'
            )}
          </Button>
        </>
      )}
    </div>
  );
}
