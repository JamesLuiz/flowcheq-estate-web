import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const PromotionCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const transactionId = searchParams.get('transaction_id') || searchParams.get('tx_ref');

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const pendingPromotion = sessionStorage.getItem('pendingPromotion');
      if (!pendingPromotion || !transactionId) {
        throw new Error('Missing promotion data');
      }

      const { propertyId, days, bannerImage } = JSON.parse(pendingPromotion);
      
      return api.promotions.verifyPayment({
        transactionId,
        houseId: propertyId,
        days,
        startDate: new Date().toISOString(),
        bannerImage,
      });
    },
    onSuccess: () => {
      setStatus('success');
      sessionStorage.removeItem('pendingPromotion');
      toast({
        title: 'Promotion activated!',
        description: 'Your property is now featured on the homepage.',
      });
    },
    onError: (error: Error) => {
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (transactionId) {
      verifyMutation.mutate();
    } else {
      setStatus('error');
    }
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                <CardTitle>Verifying Payment</CardTitle>
                <CardDescription>Please wait while we confirm your payment...</CardDescription>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-primary">Payment Successful!</CardTitle>
                <CardDescription>
                  Your property promotion is now active on the homepage.
                </CardDescription>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <CardTitle className="text-destructive">Payment Failed</CardTitle>
                <CardDescription>
                  There was an issue verifying your payment. Please try again or contact support.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <Button
              className="w-full"
              onClick={() => navigate('/dashboard')}
              disabled={status === 'loading'}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromotionCallback;
