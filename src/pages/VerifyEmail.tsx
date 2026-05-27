import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    api.auth
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader>
            <CardTitle>Email verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying your email…
              </div>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <p>{message}</p>
                <Button asChild>
                  <Link to="/landlord/dashboard">Go to dashboard</Link>
                </Button>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-10 w-10 text-destructive" />
                <p>{message}</p>
                <Button variant="outline" asChild>
                  <Link to="/auth">Back to login</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
