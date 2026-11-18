import { ArrowRight, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">AG</span>
            <span>
              <strong>AURELIA GRAND</strong>
            </span>
          </div>
          <p className="muted">
            Thoughtful stays, sculpted experiences, and quietly luxurious hospitality for modern travellers.
          </p>
        </div>

        <div>
          <h4>Quick links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/rooms">Rooms & Suites</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul className="footer-links compact">
            <li><MapPin size={16} /> 18 Harbor Lane, Coastal District</li>
            <li><Phone size={16} /> +1 (555) 204-7400</li>
            <li><Mail size={16} /> hello@aureliagrand.com</li>
          </ul>
        </div>

        <div>
          <h4>Stay connected</h4>
          <div className="newsletter">
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <button type="button" aria-label="Subscribe to news">
              <Send size={16} />
            </button>
          </div>
          <div className="social-row">
            <a href="https://instagram.com" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="https://facebook.com" aria-label="Facebook"><ArrowRight size={18} /></a>
          </div>
        </div>
      </div>

      <div className="container footer-meta">
        <span>Privacy Policy</span>
        <span>Terms and Conditions</span>
        <span>© 2026 AURELIA GRAND</span>
      </div>
    </footer>
  );
}

export default Footer;
