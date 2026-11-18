import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Topbar from '../components/Topbar/Topbar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-workspace">
        <Topbar />
        <main className="admin-content">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
