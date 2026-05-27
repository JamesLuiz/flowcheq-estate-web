import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDashboardPathForRole } from '@/lib/roles';

/**
 * Legacy `/dashboard` — redirects to the correct role dashboard.
 */
const Dashboard = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
};

export default Dashboard;
