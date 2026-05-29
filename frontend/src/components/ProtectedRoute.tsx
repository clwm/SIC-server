import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  isAdminRoute?: boolean;
}

const ProtectedRoute = ({ isAdminRoute = false }: ProtectedRouteProps) => {
  const { isAdminAuthenticated, isUserAuthenticated } = useAuth();

  if (isAdminRoute && !isAdminAuthenticated) {
    return <Navigate to="/403" replace />;
  }

  if (!isAdminRoute && !isUserAuthenticated) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;