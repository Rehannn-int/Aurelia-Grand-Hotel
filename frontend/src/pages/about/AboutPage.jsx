import { Link } from 'react-router-dom';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import SectionHeading from '../../components/common/SectionHeading';
import hotelLobby from '../../assets/images/hotel/lobby-grand.jpg';

function AboutPage() {
  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container simple-page">
        <SectionHeading
          eyebrow="Our philosophy"
          title="A slower kind of luxury."
          description="AURELIA GRAND was shaped around the idea that restorative hospitality should feel effortless, warm, and deeply considered."
        />

        <div className="split-layout story-layout">
          <div className="story-image-wrap">
            <img src={hotelLobby} alt="Boutique hotel lobby" />
          </div>
          <div className="text-panel">
            <p>
              We believe luxury is not loud. It is the quiet confidence of thoughtful design, beautifully layered spaces,
              informed service, and a sense of ease from arrival to departure.
            </p>
            <p>
              Our team curates every detail—from architecture and amenities to dining and guest experience—with the intention of
              helping each traveller feel at home while discovering something extraordinary.
            </p>
            <Link to="/contact" className="btn btn-primary">Plan Your Visit</Link>
          </div>
        </div>

        <div className="feature-columns">
          <div className="feature-box">
            <h3>Hospitality approach</h3>
            <p>Warm, proactive, and quietly precise service that anticipates needs without imposing.</p>
          </div>
          <div className="feature-box">
            <h3>Property highlights</h3>
            <p>Curated suites, wellness rituals, elevated dining, and a hotel design inspired by coastal calm.</p>
          </div>
          <div className="feature-box">
            <h3>Guest experience</h3>
            <p>Thoughtful itineraries, intimate gatherings, and bespoke moments that feel effortlessly personal.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AboutPage;
