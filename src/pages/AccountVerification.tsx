import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { YouverifySdkVerification } from '@/components/YouverifySdkVerification';
import { useAuth } from '@/context/AuthContext';
import {
  getDashboardPathForRole,
  isYouverifyVerified,
  requiresYouverifyAccount,
} from '@/lib/roles';

export default function AccountVerification() {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!requiresYouverifyAccount(user.role)) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  if (isYouverifyVerified(user)) {
    return <Navigate to={from ?? getDashboardPathForRole(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Complete account verification</h1>
          <p className="text-muted-foreground mt-1">
            Pay the verification fee, then complete YouVerify (NIN + liveness). Your virtual wallet
            stays available for payments on the platform.
          </p>
        </div>
        <YouverifySdkVerification />
      </main>
      <Footer />
    </div>
  );
}
