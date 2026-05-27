import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getWalletPathForRole } from '@/lib/roles';

/** Legacy `/wallet` → role-specific wallet route */
const WalletRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getWalletPathForRole(user?.role)} replace />;
};

export default WalletRedirect;
