import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const VERIFY_ROLES = ['landlord', 'agent', 'company', 'real_estate_company'];

export function YouverifyAccountCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user || !VERIFY_ROLES.includes(user.role ?? '')) return null;

  const status = (user as { youverifyStatus?: string }).youverifyStatus ?? 'not_started';
  const verified = status === 'verified' || user.verified;

  const mutation = useMutation({
    mutationFn: () => api.youverify.initiateAccountVerification(),
    onSuccess: (data) => {
      if (data.alreadyVerified) {
        toast({ title: 'Already verified' });
        return;
      }
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
        toast({
          title: 'Complete verification on Youverify',
          description: 'Pay and finish identity verification in the new tab.',
        });
      } else {
        toast({
          title: 'Verification session started',
          description: data.message ?? 'Configure YOVERIFY_API_KEY for live checkout.',
        });
      }
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not start verification', description: e.message });
    },
  });

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Account verification (Youverify)
          </CardTitle>
          <Badge variant={verified ? 'default' : 'secondary'}>
            {verified ? 'Verified' : status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <CardDescription>
          Verify your identity to create listings. This is separate from property document review by
          lawyers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!verified && (
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Verify with Youverify (paid)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
