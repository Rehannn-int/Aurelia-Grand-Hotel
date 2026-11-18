import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ReservationsPage from './pages/Reservations/ReservationsPage';
import RoomsPage from './pages/Rooms/RoomsPage';
import GuestsPage from './pages/Guests/GuestsPage';
import StaffPage from './pages/Staff/StaffPage';
import ServicesPage from './pages/Services/ServicesPage';
import PaymentsPage from './pages/Payments/PaymentsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';

const managerRoles = ['super_admin', 'hotel_manager'];
const bookingRoles = [...managerRoles, 'receptionist'];

function RoleRoute({ roles, children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) return <div className="page-shell"><main className="container center-page"><div className="empty-state">Checking your session…</div></main></div>;
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="reservations" element={<RoleRoute roles={bookingRoles}><ReservationsPage /></RoleRoute>} />
          <Route path="rooms" element={<RoleRoute roles={managerRoles}><RoomsPage /></RoleRoute>} />
          <Route path="guests" element={<RoleRoute roles={bookingRoles}><GuestsPage /></RoleRoute>} />
          <Route path="staff" element={<RoleRoute roles={['super_admin']}><StaffPage /></RoleRoute>} />
          <Route path="services" element={<RoleRoute roles={managerRoles}><ServicesPage /></RoleRoute>} />
          <Route path="payments" element={<RoleRoute roles={managerRoles}><PaymentsPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute roles={managerRoles}><ReportsPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute roles={managerRoles}><SettingsPage /></RoleRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
