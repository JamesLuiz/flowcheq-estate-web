import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardPathForRole } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Allowed roles; omit to allow any authenticated user */
  roles?: readonly string[];
  redirectTo?: string;
}

export type { ProtectedRouteProps };

export function ProtectedRoute({
  children,
  roles,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (roles?.length && user?.role && !roles.includes(user.role)) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
