import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const ViewingPaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [viewingDetails, setViewingDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get('tx_ref');
      const transactionId = searchParams.get('transaction_id');
      const paymentStatus = searchParams.get('status');

      if (!txRef) {
        setStatus('error');
        setMessage('No transaction reference found');
        return;
      }

      // Check if Flutterwave reported a cancelled payment
      if (paymentStatus === 'cancelled') {
        setStatus('error');
        setMessage('Payment was cancelled');
        return;
      }

      try {
        const result = await api.viewings.verifyPayment(txRef);
        if (result && result.paymentStatus === 'paid') {
          setStatus('success');
          setMessage('Your viewing fee has been paid successfully!');
          setViewingDetails(result);
        } else {
          setStatus('error');
          setMessage('Payment verification failed. Please try again.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              {status === 'loading' && (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <CardTitle>Verifying Payment</CardTitle>
                  <CardDescription>Please wait while we verify your payment...</CardDescription>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                  <CardDescription>{message}</CardDescription>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <CardTitle className="text-destructive">Payment Failed</CardTitle>
                  <CardDescription>{message}</CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {status === 'success' && viewingDetails && (
                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p><strong>Property:</strong> {viewingDetails.houseId?.title || 'N/A'}</p>
                  <p><strong>Date:</strong> {viewingDetails.scheduledDate}</p>
                  <p><strong>Time:</strong> {viewingDetails.scheduledTime}</p>
                  <p><strong>Amount Paid:</strong> ₦{viewingDetails.amountPaid?.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs mt-2">
                    The agent has been notified and will confirm your viewing shortly.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                {status === 'success' && (
                  <Button onClick={() => navigate('/user-dashboard')} className="w-full">
                    View My Viewings
                  </Button>
                )}
                <Button 
                  variant={status === 'success' ? 'outline' : 'default'} 
                  onClick={() => navigate('/')} 
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewingPaymentCallback;
