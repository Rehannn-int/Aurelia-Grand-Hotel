import { useEffect, useState } from 'react';
import { ChevronRight, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookingSearch from '../../components/booking/BookingSearch';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import RoomCard from '../../components/room/RoomCard';
import SectionHeading from '../../components/common/SectionHeading';
import { experiences, gallery, offers, testimonials } from '../../data/sampleData';
import { roomService } from '../../services/roomService';
import { useAppContext } from '../../context/contextHooks';
import suiteView from '../../assets/images/rooms/signature-suite.jpg';

function HomePage() {
  const { demoMode } = useAppContext();
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [roomError, setRoomError] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  useEffect(() => {
    let active = true;
    roomService.getRooms()
      .then((result) => {
        const featured = result.filter((room) => room.featured);
        if (active) setFeaturedRooms((featured.length ? featured : result).slice(0, 3));
      })
      .catch((error) => {
        if (active) setRoomError(error.message || 'Room categories could not be loaded.');
      })
      .finally(() => { if (active) setIsLoadingRooms(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main>
        <section className="hero-section">
          <div className="hero-overlay" />
          <div className="container hero-content">
            <div className="hero-copy">
              <span className="eyebrow light">Boutique hospitality, reimagined</span>
              <h1>Where Every Stay Becomes a Story.</h1>
              <p>
                Discover thoughtful hospitality, beautifully designed spaces, and experiences crafted around you.
              </p>
              <div className="hero-actions">
                <Link to="/rooms" className="btn btn-primary">Explore Rooms</Link>
                <Link to="/about" className="btn btn-secondary light">Discover Our Hotel</Link>
              </div>
              <div className="hero-meta">
                <span><Star size={16} /> 4.9 guest rating</span>
                <span><ShieldCheck size={16} /> Curated luxury experiences</span>
              </div>
            </div>
            <div className="hero-booking">
              <div className="booking-card">
                <div className="booking-card-header">
                  <Sparkles size={16} /> <span>Plan your stay</span>
                </div>
                <BookingSearch />
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionHeading
              eyebrow="Featured rooms"
              title="Signature spaces, composed for exceptional stays."
              description="A collection of serene suites and elevated rooms designed for slow mornings, elegant evenings, and memorable arrivals."
            />
            <div className="room-grid">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
            {roomError && <p role="alert" className="muted-note">{demoMode ? roomError : 'Room categories are temporarily unavailable.'}</p>}
            {!isLoadingRooms && !roomError && !featuredRooms.length && <p className="empty-state">No room categories are available yet.</p>}
          </div>
        </section>

        <section id="experiences" className="section muted-section">
          <div className="container">
            <SectionHeading
              eyebrow="Experiences"
              title="Every journey at AURELIA GRAND is designed to feel personal."
              description="From sunrise rituals to private dinners, our spaces create moments that linger long after checkout."
            />
            <div className="experience-grid">
              {experiences.map((experience) => (
                <article key={experience.title} className="experience-card">
                  <img src={experience.image} alt={experience.title} />
                  <div>
                    <h3>{experience.title}</h3>
                    <p>{experience.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section about-highlight">
          <div className="container split-layout">
            <div className="image-panel">
              <img src={suiteView} alt="Luxury suite" />
            </div>
            <div className="text-panel">
              <SectionHeading
                eyebrow="Our story"
                title="Hospitality shaped by thoughtful detail."
                description="AURELIA GRAND blends contemporary comfort with warm, familiar service—crafted to make each stay feel seamless, personal, and quietly memorable."
              />
              <ul className="feature-list">
                <li>Intentionally layered interiors inspired by coastal calm.</li>
                <li>Wellness-led amenities designed for effortless restoration.</li>
                <li>Concierge-led service that anticipates your needs before you ask.</li>
              </ul>
              <Link to="/about" className="btn btn-primary">Discover Our Story</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionHeading
              eyebrow="Gallery"
              title="A place that feels both cinematic and deeply welcoming."
              description="Explore the atmosphere, details, and spaces that make the property distinct."
            />
            <div className="gallery-grid">
              {gallery.slice(0, 6).map((item) => (
                <img key={item.alt} src={item.src} alt={item.alt} />
              ))}
            </div>
          </div>
        </section>

        <section className="section muted-section">
          <div className="container">
            <SectionHeading
              eyebrow="Guest praise"
              title="Thoughtful stays, reflected in warm words."
            />
            <div className="testimonial-grid">
              {testimonials.map((item) => (
                <article key={item.name} className="testimonial-card">
                  <div className="stars">★★★★★</div>
                  <p>“{item.quote}”</p>
                  <strong>{item.name}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section offers-section">
          <div className="container">
            <SectionHeading
              eyebrow="Sample offers"
              title="Curated moments for your next escape."
              description="These promotional ideas are demonstration-only and intended to showcase the frontend’s offer presentation layer."
            />
            <div className="offer-grid">
              {offers.map((offer) => (
                <article key={offer.title} className="offer-card">
                  <span className="offer-tag">{offer.tag}</span>
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                  <Link to="/rooms" className="inline-link">Explore offers <ChevronRight size={16} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section location-section">
          <div className="container location-box">
            <div>
              <SectionHeading
                eyebrow="Location"
                title="A serene stay near the city and the coast."
                description="Address placeholder for demonstration purposes only."
              />
              <ul className="location-details">
                <li>18 Harbor Lane, Coastal District</li>
                <li>hello@aureliagrand.com</li>
                <li>+1 (555) 204-7400</li>
              </ul>
              <Link to="/contact" className="btn btn-primary">Directions</Link>
            </div>
            <div className="map-placeholder">
              <span>Map placeholder</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
