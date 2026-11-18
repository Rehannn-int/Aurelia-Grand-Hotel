import { useEffect, useMemo, useState } from 'react';
import { Check, ShieldCheck, Users } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import { roomService } from '../../services/roomService';
import { useAppContext } from '../../context/contextHooks';
import { normalizeCategorySlug } from '../../utils/roomSlug';

function RoomDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { demoMode } = useAppContext();
  const [roomResult, setRoomResult] = useState({ id: null, room: null, error: '' });
  const loading = roomResult.id !== id;
  const room = loading ? null : roomResult.room;
  const loadError = loading ? '' : roomResult.error;
  const [selectedRooms, setSelectedRooms] = useState(Number(searchParams.get('rooms') || 1));

  const checkin = searchParams.get('checkin') || '2026-11-02';
  const checkout = searchParams.get('checkout') || '2026-11-05';

  useEffect(() => {
    let active = true;
    roomService.getRoomById(id)
      .then((result) => { if (active) setRoomResult({ id, room: result, error: '' }); })
      .catch((error) => { if (active) setRoomResult({ id, room: null, error: error.message || 'Room details could not be loaded.' }); });
    return () => { active = false; };
  }, [id]);

  const nights = useMemo(() => {
    const start = new Date(checkin);
    const end = new Date(checkout);
    const diff = end - start;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 3;
  }, [checkin, checkout]);

  if (loading) {
    return <div className="page-shell customer-shell"><Navbar /><main className="container center-page"><div className="empty-state">Loading room details…</div></main><Footer /></div>;
  }

  if (!room) {
    return (
      <div className="page-shell customer-shell">
        <Navbar />
        <main className="container center-page">
          <div className="empty-state large-empty">
            <h1>Room not found</h1>
            <p>{loadError || 'The selected room category could not be found.'}</p>
            <Link to="/rooms" className="btn btn-primary">Browse rooms</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const estimate = room.price * nights * selectedRooms;

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container room-details-page">
        <div className="details-gallery">
          {room.gallery.map((image, index) => (
            <img key={`${room.id}-${index}`} src={image} alt={`${room.name} view ${index + 1}`} />
          ))}
        </div>

        <div className="details-layout">
          <div className="details-main">
            <div className="details-header-row">
              <div>
                <span className="eyebrow">{room.category}</span>
                <h1>{room.name}</h1>
              </div>
              <div className="price-pill">From ₹{room.price}/night</div>
            </div>

            <p className="details-description">{room.description}</p>

            <div className="info-grid">
              <div><span>Bed</span><strong>{room.bed}</strong></div>
              <div><span>Occupancy</span><strong>{room.occupancy} guests</strong></div>
              <div><span>Room size</span><strong>{room.size}</strong></div>
              <div><span>Check-in</span><strong>3:00 PM</strong></div>
            </div>

            <div className="amenity-panel">
              <h3>Amenities</h3>
              <div className="room-amenities inline-list">
                {room.amenities.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="policy-panel">
              <h3>House policies</h3>
              <ul>
                <li><Check size={16} /> Flexible cancellation window with a sample placeholder policy.</li>
                <li><ShieldCheck size={16} /> Early check-in available subject to availability.</li>
                <li><Users size={16} /> Maximum occupancy includes adults and children.</li>
              </ul>
            </div>
          </div>

          <aside className="booking-summary-card">
            <h3>Estimated stay</h3>
            <div className="summary-row">
              <span>{room.name}</span>
              <strong>₹{room.price}/night</strong>
            </div>
            <div className="summary-row">
              <span>Dates</span>
              <strong>{checkin} to {checkout}</strong>
            </div>
            <div className="summary-row">
              <span>Nights</span>
              <strong>{nights}</strong>
            </div>
            <div className="summary-row">
              <label htmlFor="room-count">Rooms</label>
              <input id="room-count" type="number" min="1" max="3" value={selectedRooms} onChange={(e) => setSelectedRooms(Number(e.target.value) || 1)} />
            </div>
            <div className="summary-total">
              <span>Estimated subtotal</span>
              <strong>₹{estimate}</strong>
            </div>
            <p className="muted-note">{demoMode ? 'Sample estimate only.' : 'Estimated only. Final pricing and availability are checked by the server when the booking is submitted.'}</p>
            <Link
              to={`/booking?category=${encodeURIComponent(room.slug || normalizeCategorySlug(room.category))}&checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&rooms=${selectedRooms}`}
              className="btn btn-primary full"
            >
              Reserve Room
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default RoomDetailsPage;
