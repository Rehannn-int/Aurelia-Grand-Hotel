import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function BookingSearch({ initialValues = {} }) {
  const navigate = useNavigate();

  const values = useMemo(() => ({
    checkin: initialValues.checkin || '',
    checkout: initialValues.checkout || '',
    adults: initialValues.adults || 2,
    children: initialValues.children || 0,
    rooms: initialValues.rooms || 1,
  }), [initialValues]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set('checkin', form.get('checkin'));
    params.set('checkout', form.get('checkout'));
    params.set('adults', form.get('adults'));
    params.set('children', form.get('children'));
    params.set('rooms', form.get('rooms'));

    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <form className="booking-search" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="checkin">Check-in</label>
        <input type="date" id="checkin" name="checkin" defaultValue={values.checkin} required />
      </div>
      <div className="field-group">
        <label htmlFor="checkout">Check-out</label>
        <input type="date" id="checkout" name="checkout" defaultValue={values.checkout} required />
      </div>
      <div className="field-group">
        <label htmlFor="adults">Adults</label>
        <select id="adults" name="adults" defaultValue={values.adults}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="children">Children</label>
        <select id="children" name="children" defaultValue={values.children}>
          <option value={0}>0</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="rooms">Rooms</label>
        <select id="rooms" name="rooms" defaultValue={values.rooms}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary search-button">
        <Search size={18} /> Search Availability
      </button>
    </form>
  );
}

export default BookingSearch;
