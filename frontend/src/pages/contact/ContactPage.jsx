import { Mail, MapPin, Phone } from 'lucide-react';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import SectionHeading from '../../components/common/SectionHeading';

function ContactPage() {
  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container simple-page contact-page">
        <SectionHeading
          eyebrow="Contact"
          title="We’d love to welcome you."
          description="A place to begin planning your stay, organise a special occasion, or learn more about our experiences."
        />

        <div className="contact-grid">
          <div className="contact-card">
            <MapPin size={20} />
            <h3>Visit</h3>
            <p>18 Harbor Lane, Coastal District</p>
          </div>
          <div className="contact-card">
            <Phone size={20} />
            <h3>Call</h3>
            <p>+1 (555) 204-7400</p>
          </div>
          <div className="contact-card">
            <Mail size={20} />
            <h3>Email</h3>
            <p>hello@aureliagrand.com</p>
          </div>
        </div>

        <div className="contact-form-wrap">
          <form className="styled-form">
            <div className="field-grid two-up">
              <div className="field-group">
                <label htmlFor="name">Name</label>
                <input id="name" type="text" placeholder="Your name" />
              </div>
              <div className="field-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" placeholder="you@example.com" />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="5" placeholder="Tell us about your stay or enquiry" />
            </div>
            <button type="button" className="btn btn-primary">Send enquiry</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ContactPage;
