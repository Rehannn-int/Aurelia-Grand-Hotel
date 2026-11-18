import { useEffect, useMemo, useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BookingSearch from '../../components/booking/BookingSearch';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import RoomCard from '../../components/room/RoomCard';
import { roomService } from '../../services/roomService';
import { useAppContext } from '../../context/contextHooks';

function RoomsPage() {
  const [searchParams] = useSearchParams();
  const { demoMode } = useAppContext();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceMax, setPriceMax] = useState(20000);
  const [guestCapacity, setGuestCapacity] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  useEffect(() => {
    let active = true;
    roomService.getRooms()
      .then((result) => { if (active) setRooms(result); })
      .catch((error) => { if (active) setLoadError(error.message || 'Room categories could not be loaded.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = ['All', ...new Set(rooms.map((room) => room.category))];
  const amenityOptions = ['Garden view', 'Pool access', 'Private balcony', 'Workspace', 'Priority check-in'];

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => selectedCategory === 'All' || room.category === selectedCategory)
      .filter((room) => room.price <= priceMax)
      .filter((room) => guestCapacity === 0 || room.occupancy >= guestCapacity)
      .filter((room) => {
        if (selectedAmenities.length === 0) return true;
        return selectedAmenities.every((amenity) => room.amenities.includes(amenity));
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'capacity') return b.occupancy - a.occupancy;
        return a.price - b.price;
      });
  }, [guestCapacity, priceMax, rooms, selectedAmenities, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setPriceMax(20000);
    setGuestCapacity(0);
    setSelectedAmenities([]);
    setSortBy('recommended');
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
    );
  };

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container rooms-page-layout">
        <aside className="filter-panel">
          <div className="panel-header">
            <Filter size={18} />
            <span>Filters</span>
          </div>

          <div className="filter-block">
            <label>Room category</label>
            <div className="chip-group">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={selectedCategory === category ? 'chip active' : 'chip'}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <label htmlFor="priceMax">Price range</label>
            <input id="priceMax" type="range" min="2000" max="25000" step="500" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} />
            <div className="range-values">
              <span>₹2,000</span>
              <strong>₹{priceMax.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="filter-block">
            <label htmlFor="capacity">Guest capacity</label>
            <select id="capacity" value={guestCapacity} onChange={(e) => setGuestCapacity(Number(e.target.value))}>
              <option value={0}>Any</option>
              <option value={2}>2 guests</option>
              <option value={3}>3 guests</option>
              <option value={4}>4 guests</option>
              <option value={5}>5 guests</option>
            </select>
          </div>

          <div className="filter-block">
            <label>Amenities</label>
            <div className="checklist">
              {amenityOptions.map((amenity) => (
                <label key={amenity} className="check-item">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="btn btn-secondary full" onClick={clearFilters}>Clear filters</button>
        </aside>

        <section className="room-results">
          <div className="results-header">
            <div>
              <span className="eyebrow">Stay discovery</span>
              <h1>Rooms & Suites</h1>
            </div>
            <div className="sort-box">
              <SlidersHorizontal size={16} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="capacity">Guest capacity</option>
              </select>
            </div>
          </div>

          <div className="search-summary-panel">
            <BookingSearch
              initialValues={{
                checkin: searchParams.get('checkin') || '',
                checkout: searchParams.get('checkout') || '',
                adults: Number(searchParams.get('adults') || 2),
                children: Number(searchParams.get('children') || 0),
                rooms: Number(searchParams.get('rooms') || 1),
              }}
            />
          </div>

          <div className="results-meta">
            <p>
              {filteredRooms.length} room categor{filteredRooms.length === 1 ? 'y' : 'ies'} found
              {searchParams.get('checkin') && ` · Check-in ${searchParams.get('checkin')}`}
              {searchParams.get('checkout') && ` · Check-out ${searchParams.get('checkout')}`}
            </p>
          </div>

          {isLoading ? (
            <div className="empty-state">Loading available rooms…</div>
          ) : loadError ? (
            <div className="empty-state" role="alert">
              <h3>Room categories could not be loaded.</h3>
              <p>{demoMode ? loadError : `${loadError} Please try again when the hotel service is available.`}</p>
            </div>
          ) : filteredRooms.length ? (
            <div className="room-grid compact-grid">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No rooms match your current filters.</h3>
              <p>Adjust your dates, guest count, or price range to explore more options.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default RoomsPage;
