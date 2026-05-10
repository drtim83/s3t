import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { PageLoader } from '../ui/Spinner';

export function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user)     return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (user)      return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
