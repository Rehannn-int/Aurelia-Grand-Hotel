import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Button from '../common/Button';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Rooms & Suites', to: '/rooms' },
  { label: 'Experiences', to: '/#experiences' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'My Bookings', to: '/account' },
  { label: 'Sign In', to: '/login' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isCurrent = (to) => {
    if (to === '/#experiences') {
      return location.pathname === '/' && location.hash === '#experiences';
    }
    return location.pathname === to;
  };

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link to="/" className="brand" aria-label="AURELIA GRAND home">
          <span className="brand-mark">AG</span>
          <span>
            <strong>AURELIA GRAND</strong>
          </span>
        </Link>

        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => {
            if (item.to.startsWith('/#')) {
              return (
                <a key={item.label} href={item.to} className={isCurrent(item.to) ? 'active' : ''} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              );
            }

            return (
              <NavLink key={item.label} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="nav-actions">
          <Button to="/booking" className="nav-cta">Book Your Stay</Button>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
