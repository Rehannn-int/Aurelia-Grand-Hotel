import {
  BedDouble, BriefcaseBusiness, ChartNoAxesCombined, ClipboardList, ConciergeBell,
  LayoutDashboard, LogOut, Settings, Users, WalletCards,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const items = [
  { label: 'Overview', to: '/', icon: LayoutDashboard, roles: ['super_admin', 'hotel_manager', 'receptionist'] },
  { label: 'Reservations', to: '/reservations', icon: ClipboardList, roles: ['super_admin', 'hotel_manager', 'receptionist'] },
  { label: 'Rooms', to: '/rooms', icon: BedDouble, roles: ['super_admin', 'hotel_manager'] },
  { label: 'Guests', to: '/guests', icon: Users, roles: ['super_admin', 'hotel_manager', 'receptionist'] },
  { label: 'Staff', to: '/staff', icon: BriefcaseBusiness, roles: ['super_admin'] },
  { label: 'Hotel services', to: '/services', icon: ConciergeBell, roles: ['super_admin', 'hotel_manager'] },
  { label: 'Payments', to: '/payments', icon: WalletCards, roles: ['super_admin', 'hotel_manager'] },
  { label: 'Reports', to: '/reports', icon: ChartNoAxesCombined, roles: ['super_admin', 'hotel_manager'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['super_admin', 'hotel_manager'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const visibleItems = items.filter((item) => item.roles.includes(user?.role));
  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      window.alert(error.message || 'The server could not confirm sign out. Your local session was cleared.');
    }
  }
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="brand-monogram">AG</span>
        <span><strong>AURELIA</strong><small>GRAND · MANAGEMENT</small></span>
      </div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Administration">
        {visibleItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} end={to === '/'} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || 'A'}</span>
          <span><strong>{user?.name}</strong><small>{user?.role?.replaceAll('_', ' ')}</small></span>
        </div>
        <button type="button" className="sidebar-logout" onClick={() => void handleLogout()}>
          <LogOut size={17} /><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
