import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AuthGuard() {
  const { user, loading, profileLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return <div className="table-state" style={{ margin: 'auto' }}>Validando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/401" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
