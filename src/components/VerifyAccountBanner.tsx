import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { isYouverifyVerified, requiresYouverifyAccount } from '@/lib/roles';

/** Shown on dashboards when the user still needs /verify-account */
export function VerifyAccountBanner() {
  const { user } = useAuth();

  if (!user || !requiresYouverifyAccount(user.role) || isYouverifyVerified(user)) {
    return null;
  }

  return (
    <Alert className="border-amber-500/40 bg-amber-500/5">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Account verification required</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span>Pay the verification fee and complete YouVerify to unlock the app.</span>
        <Button asChild size="sm" className="w-fit shrink-0">
          <Link to="/verify-account">Verify now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
