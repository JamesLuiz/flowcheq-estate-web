import { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const HUNTER_ROLES = ['user', 'tenant', 'house_hunter'];

/**
 * Prompts house hunters to verify their email before they can message agents
 * or schedule inspections. Hidden once verified or for non-hunter roles.
 */
export const AccountVerificationBanner = ({ className }: { className?: string }) => {
  const { user, isAuthenticated } = useAuth();
  const [sending, setSending] = useState(false);

  if (!isAuthenticated || !user) return null;
  const role = user.role ?? 'user';
  if (!HUNTER_ROLES.includes(role) || user.emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.auth.resendEmailVerification();
      toast.success('Verification email sent. Check your inbox.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not send verification email.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert className={className}>
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Verify your account to continue</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="flex-1">
          You can browse listings, but you must verify your email before messaging agents or
          scheduling inspections.
        </span>
        <Button size="sm" onClick={handleResend} disabled={sending}>
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Resend verification email
        </Button>
      </AlertDescription>
    </Alert>
  );
};
