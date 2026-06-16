import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getDashboardPathForRole, getWalletPathForRole, isYouverifyVerified } from '@/lib/roles';
import { embedYouverifySdkInHost, getYouverifySdkAppearance } from '@/lib/youverify-theme';
import '@/styles/youverify-sdk.css';

function formatNgn(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

type VFormModule = {
  initialize: () => void;
  start: () => void;
  setShowModal?: (show: boolean) => void;
};

export function YouverifySdkVerification() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const sdkHostRef = useRef<HTMLDivElement>(null);
  const cleanupEmbedRef = useRef<(() => void) | null>(null);
  const vFormRef = useRef<VFormModule | null>(null);
  const [sdkOpen, setSdkOpen] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);

  const closeSdk = useCallback(() => {
    vFormRef.current?.setShowModal?.(false);
    vFormRef.current = null;
    setSdkOpen(false);
    cleanupEmbedRef.current?.();
    cleanupEmbedRef.current = null;
  }, []);

  const statusQuery = useQuery({
    queryKey: ['youverify-account-status'],
    queryFn: () => api.youverify.getAccountStatus(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    const fee = searchParams.get('fee');
    if (fee === 'success') {
      toast({
        title: 'Payment received',
        description: 'You can now complete identity verification with YouVerify.',
      });
      queryClient.invalidateQueries({ queryKey: ['youverify-account-status'] });
      setSearchParams({}, { replace: true });
    } else if (fee === 'failed') {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: 'Verification fee was not completed. Please try again.',
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, queryClient]);

  useEffect(() => {
    return () => {
      vFormRef.current?.setShowModal?.(false);
      vFormRef.current = null;
      cleanupEmbedRef.current?.();
      cleanupEmbedRef.current = null;
      document.body.classList.remove('youverify-sdk-embedded');
    };
  }, []);

  const payFeeMutation = useMutation({
    mutationFn: () => api.youverify.payVerificationFee(),
    onSuccess: (data) => {
      if (data.alreadyPaid) {
        queryClient.invalidateQueries({ queryKey: ['youverify-account-status'] });
        return;
      }
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Checkout failed', description: e.message });
    },
  });

  const sdkCompleteMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.youverify.completeSdkVerification(payload),
    onSuccess: async () => {
      closeSdk();
      toast({ title: 'Verified', description: 'Your identity has been verified.' });
      await refresh();
      navigate(getDashboardPathForRole(user?.role));
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Verification failed', description: e.message });
    },
  });

  const data = statusQuery.data;
  const feePaid = data?.feePaid ?? false;
  const sdkConfig = data?.sdkConfig;
  const verificationFee = data?.verificationFee ?? 1500;
  const walletPath = getWalletPathForRole(user?.role);

  const launchSdk = useCallback(async () => {
    if (!sdkConfig?.vFormId || !sdkConfig.publicMerchantKey || !sdkHostRef.current) {
      toast({
        variant: 'destructive',
        title: 'Verification unavailable',
        description: 'YouVerify is not configured on the server yet.',
      });
      return;
    }

    if (isYouverifyVerified(user)) return;

    setSdkLoading(true);
    setSdkOpen(true);

    try {
      cleanupEmbedRef.current?.();
      const mod = await import('youverify-web-sdk');
      const YouverifySDK = mod.default as {
        vForm: new (opts: Record<string, unknown>) => VFormModule;
      };

      const appearance = getYouverifySdkAppearance({
        greeting:
          'Complete your NIN and liveness check below. This verification runs inside Flowcheq.',
        actionText: 'Continue with YouVerify',
      });

      const vFormModule = new YouverifySDK.vForm({
        vFormId: sdkConfig.vFormId,
        publicMerchantKey: sdkConfig.publicMerchantKey,
        sandboxEnvironment: sdkConfig.sandboxEnvironment ?? false,
        personalInformation: {
          firstName: user?.name?.split(' ')[0] ?? '',
          lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
          email: user?.email ?? '',
        },
        metadata: {
          ...(sdkConfig.metadata ?? {}),
          userId: user?.id,
        },
        appearance,
        onSuccess: (result: Record<string, unknown>) => {
          sdkCompleteMutation.mutate(result ?? {});
        },
        onFailure: (error: unknown) => {
          closeSdk();
          toast({
            variant: 'destructive',
            title: 'Verification did not pass',
            description: error instanceof Error ? error.message : 'Please try again.',
          });
        },
        onClose: () => {
          closeSdk();
        },
      });

      vFormRef.current = vFormModule;
      cleanupEmbedRef.current = embedYouverifySdkInHost(sdkHostRef.current);
      vFormModule.initialize();
      vFormModule.start();
    } catch (e) {
      closeSdk();
      toast({
        variant: 'destructive',
        title: 'Could not load YouVerify',
        description: e instanceof Error ? e.message : 'SDK load failed',
      });
    } finally {
      setSdkLoading(false);
    }
  }, [sdkConfig, user, toast, sdkCompleteMutation, closeSdk]);

  if (statusQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" />
            Your virtual wallet
          </CardTitle>
          <CardDescription>
            Every account has a Flutterwave virtual wallet for paying agents, landlords, lawyers, and
            platform fees. Fund it anytime — separate from the one-time verification fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-xl font-semibold">{formatNgn(data?.walletBalance ?? 0)}</p>
            {data?.virtualAccount?.accountNumber && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.virtualAccount.bankName} · {data.virtualAccount.accountNumber}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate(walletPath)}>
            Manage wallet
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Identity verification
            </CardTitle>
            <Badge variant="secondary">{data?.paymentStatus?.replace(/_/g, ' ') ?? 'pending'}</Badge>
          </div>
          <CardDescription>
            Step 1: Pay the verification fee ({formatNgn(verificationFee)}). Step 2: Complete
            YouVerify in the panel below (NIN + liveness).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!feePaid ? (
            <Button
              className="w-full"
              disabled={payFeeMutation.isPending}
              onClick={() => payFeeMutation.mutate()}
            >
              {payFeeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pay {formatNgn(verificationFee)} &amp; continue
            </Button>
          ) : (
            <>
              <div
                ref={sdkHostRef}
                className={`youverify-sdk-host ${sdkOpen ? 'youverify-sdk-host--active' : 'youverify-sdk-host--idle'}`}
                aria-live="polite"
                aria-label="YouVerify identity verification"
              >
                {!sdkOpen && (
                  <>
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Fee paid. Start verification to open the YouVerify flow inside this page — no
                      pop-out window.
                    </p>
                    <Button
                      disabled={sdkLoading || sdkCompleteMutation.isPending}
                      onClick={() => void launchSdk()}
                    >
                      {sdkLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                      )}
                      Start verification
                    </Button>
                  </>
                )}
                {sdkOpen && sdkLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {sdkOpen && !sdkLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={closeSdk}
                >
                  Close verification panel
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
