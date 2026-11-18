import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import SectionHeading from '../../components/common/SectionHeading';
import { bookingService } from '../../services/bookingService';
import { useAppContext } from '../../context/contextHooks';

const demoBookings = [
  { id: 'AG-1048', status: 'Upcoming', date: '27 Oct 2026', room: 'Sierra Suite', amount: '₹12,600' },
  { id: 'AG-1039', status: 'Past stay', date: '14 Aug 2026', room: 'Harbor Deluxe', amount: '₹7,200' },
];

function formatStay(booking) {
  const checkIn = new Date(booking.checkIn).toLocaleDateString();
  const checkOut = new Date(booking.checkOut).toLocaleDateString();
  return `${checkIn} – ${checkOut}`;
}

function AccountPage() {
  const { user, demoMode } = useAppContext();
  const [bookings, setBookings] = useState(demoMode ? demoBookings : []);
  const [error, setError] = useState('');

  useEffect(() => {
    if (demoMode) return;
    bookingService.getMyBookings()
      .then((result) => setBookings(result.map((booking) => ({
        id: booking.reference,
        status: booking.status.replaceAll('_', ' '),
        date: formatStay(booking),
        room: booking.category?.name || 'Room',
        amount: `${booking.currency} ${booking.pricing.total.toLocaleString()}`,
      }))))
      .catch((requestError) => setError(requestError.message || 'Bookings could not be loaded.'));
  }, [demoMode]);

  const initials = user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'AG';

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container simple-page account-page">
        <SectionHeading eyebrow="My account" title="Guest profile" description={demoMode ? 'Sample account data for the visual frontend only.' : 'Your profile and reservations.'} />

        <div className="account-grid">
          <section className="account-card profile-card">
            <div className="account-avatar">{demoMode ? 'JG' : initials}</div>
            <h3>{demoMode ? 'Jamie Green' : user?.name}</h3>
            <p>{demoMode ? 'Member since 2024' : 'Guest account'}</p>
            <ul>
              <li><Mail size={16} /> {demoMode ? 'jamie.green@example.com' : user?.email}</li>
              <li><Phone size={16} /> {demoMode ? '+1 (415) 267-9401' : user?.phone || 'Phone not provided'}</li>
              {demoMode && <li><MapPin size={16} /> Austin, Texas</li>}
            </ul>
          </section>

          {demoMode && (
            <section className="account-card">
              <h3>Preferences</h3>
              <div className="preferences-list">
                <span>King bed preferred</span>
                <span>High floor</span>
                <span>Late checkout</span>
              </div>
            </section>
          )}
        </div>

        <section className="account-card table-card">
          <div className="table-header">
            <h3>Reservations</h3>
            {demoMode && <span className="status-badge status-success">Sample bookings</span>}
          </div>
          {error && <p role="alert" className="muted-note">{error}</p>}
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Stay</th>
                <th>Room</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.date}</td>
                  <td>{booking.room}</td>
                  <td><span className="status-badge status-neutral">{booking.status}</span></td>
                  <td>{booking.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!demoMode && bookings.length === 0 && !error && <p className="empty-state">You do not have any reservations yet.</p>}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default AccountPage;
