import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/contextHooks';

function ProtectedRoute({ children, allowedRoles }) {
  const { demoMode, user, authLoading } = useAppContext();

  if (authLoading) {
    return <div className="page-shell customer-shell"><main className="container center-page"><div className="empty-state">Checking your session…</div></main></div>;
  }

  if (!demoMode && !user) return <Navigate to="/login" replace />;
  if (!demoMode && allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/account" replace />;

  return children;
}

export default ProtectedRoute;
