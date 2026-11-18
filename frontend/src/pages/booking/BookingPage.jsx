import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import { bookingService } from '../../services/bookingService';
import { roomService } from '../../services/roomService';
import { findRoomByCategorySlug } from '../../utils/roomSlug';

const stepTitles = ['Dates & guests', 'Review room', 'Guest details', 'Payment choice', 'Confirmation'];

function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState('');
  const [booking, setBooking] = useState({
    checkin: searchParams.get('checkin') || '2026-11-02',
    checkout: searchParams.get('checkout') || '2026-11-05',
    adults: Number(searchParams.get('adults') || 2),
    children: Number(searchParams.get('children') || 0),
    rooms: Number(searchParams.get('rooms') || 1),
    categorySlug: searchParams.get('category') || '',
    guestName: '',
    email: '',
    phone: '',
    notes: '',
    paymentMethod: 'credit-card',
    termsAccepted: false,
  });

  useEffect(() => {
    let active = true;
    roomService.getRooms()
      .then((result) => {
        if (!active) return;
        setAllRooms(result);
        setRoomsError('');
        if (!booking.categorySlug && result[0]) {
          setBooking((current) => ({
            ...current,
            categorySlug: result[0].slug || result[0].id,
          }));
        }
      })
      .catch((error) => {
        if (active) setRoomsError(error.message || 'Room details could not be loaded.');
      })
      .finally(() => {
        if (active) setRoomsLoading(false);
      });
    return () => { active = false; };
  }, [booking.categorySlug]);

  const nights = useMemo(() => {
    const start = new Date(booking.checkin);
    const end = new Date(booking.checkout);
    const difference = end - start;
    return difference > 0 ? Math.ceil(difference / (1000 * 60 * 60 * 24)) : 3;
  }, [booking.checkin, booking.checkout]);

  const selectedRoom = findRoomByCategorySlug(allRooms, booking.categorySlug) || allRooms.find((room) => room.slug === booking.categorySlug || room.id === booking.categorySlug) || null;
  const subtotal = (selectedRoom?.price || 0) * nights * booking.rooms;
  const quoteKey = JSON.stringify([
    booking.checkin,
    booking.checkout,
    booking.adults,
    booking.children,
    booking.rooms,
    booking.categorySlug,
  ]);
  const quote = quoteResult?.key === quoteKey ? quoteResult.data : null;
  const currentQuoteError = quoteError?.key === quoteKey ? quoteError.message : '';
  const quoteLoading = step === 4 && !quote && !currentQuoteError;

  useEffect(() => {
    if (step !== 4) return undefined;
    let active = true;
    bookingService.getQuote({
      checkin: booking.checkin,
      checkout: booking.checkout,
      adults: booking.adults,
      children: booking.children,
      rooms: booking.rooms,
      categorySlug: booking.categorySlug,
      nights,
      subtotal,
    })
      .then((result) => { if (active) setQuoteResult({ key: quoteKey, data: result }); })
      .catch((error) => { if (active) setQuoteError({ key: quoteKey, message: error.message || 'Price and availability could not be verified.' }); });
    return () => { active = false; };
  }, [step, booking.checkin, booking.checkout, booking.adults, booking.children, booking.rooms, booking.categorySlug, nights, subtotal, quoteKey]);

  const updateField = (field, value) => setBooking((current) => ({ ...current, [field]: value }));

  const nextStep = () => {
    if (step === 1 && (!booking.checkin || !booking.checkout || booking.checkout <= booking.checkin)) {
      toast.error('Please select valid check-in and check-out dates.');
      return;
    }

    if (!selectedRoom) {
      toast.error('Please choose a valid room before continuing.');
      return;
    }

    if (step === 2 && !booking.termsAccepted) {
      toast.error('Please accept the terms before continuing.');
      return;
    }

    if (step === 3 && (!booking.guestName || !booking.email)) {
      toast.error('Guest name and email are required.');
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const previousStep = () => setStep((current) => Math.max(current - 1, 1));

  const submitBooking = async () => {
    if (!selectedRoom) {
      toast.error('A valid room is required before submitting the booking.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await bookingService.createBooking({ ...booking, categorySlug: selectedRoom.slug || selectedRoom.id, subtotal }, idempotencyKey);
      navigate(`/booking/payment?reference=${encodeURIComponent(response.reference)}`);
    } catch (error) {
      toast.error(error.message || 'Booking could not be created in demo mode.');
    } finally {
      setSubmitting(false);
    }
  };

  if (roomsLoading) {
    return (
      <div className="page-shell customer-shell">
        <Navbar />
        <main className="container center-page">
          <div className="empty-state">Loading room selection…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (roomsError || !selectedRoom) {
    return (
      <div className="page-shell customer-shell">
        <Navbar />
        <main className="container center-page">
          <div className="empty-state large-empty">
            <h1>Room unavailable</h1>
            <p>{roomsError || 'The selected room could not be loaded from the current hotel inventory.'}</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/rooms')}>Browse rooms</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container booking-page">
        <div className="booking-progress">
          {stepTitles.map((title, index) => (
            <div key={title} className={index + 1 === step ? 'progress-step active' : 'progress-step'}>
              <span>{index + 1}</span>
              <small>{title}</small>
            </div>
          ))}
        </div>

        <div className="booking-layout">
          <section className="booking-form-card">
            {step === 1 && (
              <div>
                <h2>Dates & guests</h2>
                <div className="field-grid two-up">
                  <div className="field-group">
                    <label htmlFor="checkin">Check-in date</label>
                    <input type="date" id="checkin" value={booking.checkin} onChange={(e) => updateField('checkin', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="checkout">Check-out date</label>
                    <input type="date" id="checkout" value={booking.checkout} onChange={(e) => updateField('checkout', e.target.value)} />
                  </div>
                </div>
                <div className="field-grid two-up">
                  <div className="field-group">
                    <label htmlFor="adults">Adults</label>
                    <select id="adults" value={booking.adults} onChange={(e) => updateField('adults', Number(e.target.value))}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="rooms">Rooms</label>
                    <select id="rooms" value={booking.rooms} onChange={(e) => updateField('rooms', Number(e.target.value))}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2>Review room selection</h2>
                <div className="summary-box">
                  <h3>{selectedRoom?.name || 'Selected room'}</h3>
                  <p>{selectedRoom?.category || 'Room'} · {booking.adults + booking.children} guests · {booking.rooms} room(s)</p>
                  <p>Nightly rate: ₹{selectedRoom?.price?.toLocaleString('en-IN') || '—'} · {nights} nights</p>
                </div>
                <label className="check-item">
                  <input type="checkbox" checked={booking.termsAccepted} onChange={(e) => updateField('termsAccepted', e.target.checked)} />
                  <span>I accept the sample cancellation terms and booking policy placeholder.</span>
                </label>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2>Guest information</h2>
                <div className="field-grid two-up">
                  <div className="field-group">
                    <label htmlFor="guestName">Guest name</label>
                    <input id="guestName" value={booking.guestName} onChange={(e) => updateField('guestName', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" value={booking.email} onChange={(e) => updateField('email', e.target.value)} />
                  </div>
                </div>
                <div className="field-grid two-up">
                  <div className="field-group">
                    <label htmlFor="phone">Phone</label>
                    <input id="phone" value={booking.phone} onChange={(e) => updateField('phone', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="paymentMethod">Payment option</label>
                    <select id="paymentMethod" value={booking.paymentMethod} onChange={(e) => updateField('paymentMethod', e.target.value)}>
                      <option value="credit-card">Credit card</option>
                      <option value="virtual-wallet">Virtual wallet</option>
                      <option value="bank-transfer">Bank transfer</option>
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="notes">Special requests</label>
                  <textarea id="notes" rows="4" value={booking.notes} onChange={(e) => updateField('notes', e.target.value)} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2>Review booking summary</h2>
                <div className="summary-box">
                  <p>Arrival: {booking.checkin}</p>
                  <p>Departure: {booking.checkout}</p>
                  <p>Guests: {booking.adults} adults · {booking.children} children</p>
                  <p>Payment: {booking.paymentMethod}</p>
                  {quote?.pricing && <p>Server quote: {quote.currency} {quote.pricing.total.toLocaleString()}</p>}
                  {!quote && <p>Estimated total: ₹{subtotal.toLocaleString('en-IN')}</p>}
                  {quoteLoading && <p role="status">Checking current price and availability…</p>}
                  {currentQuoteError && <p role="alert" className="muted-note">{currentQuoteError}</p>}
                  {quote && !quote.available && <p role="alert" className="muted-note">The selected room is not available for these dates.</p>}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2>Confirmation</h2>
                <div className="success-box">
                  <Check size={20} />
                  <p>Your booking request has been created. It remains pending until payment is verified.</p>
                </div>
              </div>
            )}

            <div className="booking-actions">
              {step > 1 && step < 5 && (
                <button type="button" className="btn btn-secondary" onClick={previousStep}>Back</button>
              )}
              {step < 4 && (
                <button type="button" className="btn btn-primary" onClick={nextStep}>Continue</button>
              )}
              {step === 4 && (
                <button type="button" className="btn btn-primary" onClick={submitBooking} disabled={submitting || quoteLoading || Boolean(currentQuoteError) || Boolean(quote && !quote.available)}>
                  {submitting ? 'Creating booking…' : 'Submit booking'}
                </button>
              )}
            </div>
          </section>

          <aside className="booking-summary-card">
            <h3>Booking summary</h3>
            <div className="summary-row">
              <span>Check-in</span>
              <strong>{booking.checkin}</strong>
            </div>
            <div className="summary-row">
              <span>Check-out</span>
              <strong>{booking.checkout}</strong>
            </div>
            <div className="summary-row">
              <span>Stay</span>
              <strong>{nights} nights</strong>
            </div>
            <div className="summary-row">
              <span>Room</span>
              <strong>{selectedRoom?.name || 'Selected room'}</strong>
            </div>
            <div className="summary-total">
              <span>Estimated total</span>
              <strong>{quote?.pricing ? `${quote.currency} ${quote.pricing.total.toLocaleString()}` : `₹${subtotal.toLocaleString('en-IN')}`}</strong>
            </div>
            <p className="muted-note">This is an estimate. The server recalculates the price and checks inventory before creating the booking.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BookingPage;
