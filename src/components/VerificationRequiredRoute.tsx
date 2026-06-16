import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  requiresYouverifyAccount,
  isYouverifyVerified,
  isAdminRole,
} from '@/lib/roles';
import { ProtectedRoute, type ProtectedRouteProps } from './ProtectedRoute';

const VERIFICATION_EXEMPT_PATHS = [
  '/verify-account',
  '/wallet',
  '/agent/wallet',
  '/landlord/wallet',
];

export function VerificationRequiredRoute(props: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  const exempt = VERIFICATION_EXEMPT_PATHS.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
  );

  if (
    !loading &&
    isAuthenticated &&
    user &&
    !isAdminRole(user.role) &&
    requiresYouverifyAccount(user.role) &&
    !isYouverifyVerified(user) &&
    !exempt
  ) {
    return <Navigate to="/verify-account" replace state={{ from: location.pathname }} />;
  }

  return <ProtectedRoute {...props} />;
}
