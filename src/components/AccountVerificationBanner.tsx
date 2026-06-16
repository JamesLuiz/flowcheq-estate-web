import { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { isAdminRole } from '@/lib/roles';

/**
 * Prompts any non-admin user to verify email before sensitive actions
 * (messaging, inspections, wallet withdrawals on web).
 */
export const AccountVerificationBanner = ({ className }: { className?: string }) => {
  const { user, isAuthenticated } = useAuth();
  const [sending, setSending] = useState(false);

  if (!isAuthenticated || !user || isAdminRole(user.role) || user.emailVerified) return null;

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
      <AlertTitle>Verify your email to continue</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="flex-1">
          Confirm your email address to unlock wallet withdrawals, messaging, and other account
          features.
        </span>
        <Button size="sm" onClick={handleResend} disabled={sending}>
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Resend verification email
        </Button>
      </AlertDescription>
    </Alert>
  );
};
