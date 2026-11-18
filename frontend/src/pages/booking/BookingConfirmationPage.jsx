import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';

function BookingConfirmationPage() {
  const { reference } = useParams();

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container simple-page confirmation-page">
        <div className="success-box large-success">
          <h1>Payment status pending</h1>
          <p>Reference: {reference}</p>
          <p>Your reservation is confirmed only after the payment provider webhook verifies the transaction. If payment was not completed, return to the booking flow and contact the hotel team for assistance.</p>
          <div className="confirmation-actions">
            <Link to="/account" className="btn btn-primary">View account</Link>
            <Link to="/rooms" className="btn btn-secondary">Browse rooms</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BookingConfirmationPage;
