import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.auth.forgotPassword({ email });
      setSubmitted(true);
      toast({
        title: 'Check your email',
        description:
          'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-hero rounded-full">
                <Home className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a reset link
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                {submitted
                  ? 'Check your email for the reset link'
                  : 'Enter your email to receive a password reset link'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    If an account with that email exists, we've sent you a password reset link.
                    Please check your email and click the link to reset your password.
                  </p>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSubmitted(false);
                        setEmail('');
                      }}
                    >
                      Send another email
                    </Button>
                    <Link to="/auth">
                      <Button type="button" variant="ghost" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                  <Link to="/auth">
                    <Button type="button" variant="ghost" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

