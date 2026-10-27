import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from './Layout.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/ingresar" replace />;
  }
  if (roles && !roles.includes(user.rol)) {
    return <Navigate to={dashboardPath(user.rol)} replace />;
  }
  return children;
}
