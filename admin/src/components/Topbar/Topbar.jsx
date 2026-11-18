import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../../services/api';
import './Topbar.css';

const routeNames = {
  '/': 'Overview',
  '/reservations': 'Reservations',
  '/rooms': 'Rooms & inventory',
  '/guests': 'Guest directory',
  '/staff': 'Staff',
  '/services': 'Hotel services',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    adminApi.health()
      .then((response) => { if (active) setApiStatus(response.data?.database === 'connected' ? 'connected' : 'unavailable'); })
      .catch(() => { if (active) setApiStatus('unavailable'); });
    return () => { active = false; };
  }, []);

  return (
    <header className="admin-topbar">
      <div className="topbar-title"><span className="topbar-eyebrow">AURELIA GRAND / ADMINISTRATION</span><h1>{routeNames[pathname] || 'Administration'}</h1></div>
      <div className="topbar-tools">
        <span className={`system-status ${apiStatus}`}><i />{apiStatus === 'checking' ? 'CHECKING API' : apiStatus === 'connected' ? 'API CONNECTED' : 'API UNAVAILABLE'}</span>
        <Search size={17} className="topbar-search-icon" />
        <span className="topbar-date">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
    </header>
  );
}
