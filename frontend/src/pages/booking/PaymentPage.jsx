import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/navigation/Navbar';
import Footer from '../../components/navigation/Footer';
import { paymentService } from '../../services/paymentService';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

function PaymentForm({ reference }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/booking/confirmation/${encodeURIComponent(reference)}` },
        redirect: 'if_required',
      });
      if (result.error) throw new Error(result.error.message || 'Payment could not be completed.');
      if (result.paymentIntent?.status === 'succeeded') {
        toast.success('Payment received. Reservation confirmation is being verified.');
        navigate(`/booking/confirmation/${encodeURIComponent(reference)}`);
      }
    } catch (error) {
      toast.error(error.message || 'Payment could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="styled-form" onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" className="btn btn-primary full" disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : 'Pay securely'}
      </button>
    </form>
  );
}

function PaymentPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const loading = !demoMode && Boolean(reference && stripePromise) && !clientSecret && !error;
  const paymentError = error
    || (!demoMode && !reference ? 'A booking reference is required to start payment.' : '')
    || (!demoMode && !stripePromise ? 'Stripe checkout is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY to enable card payment.' : '');

  useEffect(() => {
    if (demoMode || !reference || !stripePromise) return undefined;
    let active = true;
    paymentService.processPayment(reference)
      .then((result) => {
        if (active) setClientSecret(result.clientSecret);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Payment could not be initialized.');
      });
    return () => { active = false; };
  }, [reference]);

  const handleDemoPayment = async () => {
    const response = await paymentService.processPayment();
    toast(response.message);
  };

  return (
    <div className="page-shell customer-shell">
      <Navbar />
      <main className="container simple-page payment-page">
        <h1>Payment</h1>
        {demoMode ? (
          <p className="muted">Demo payment only. No charge or reservation confirmation is created.</p>
        ) : (
          <p className="muted">Your reservation is confirmed only after the payment provider verifies the payment.</p>
        )}
        <div className="booking-summary-card payment-card">
          <h3>Booking payment</h3>
          {reference && <div className="summary-row"><span>Reference</span><strong>{reference}</strong></div>}
          {demoMode ? (
            <button type="button" className="btn btn-primary full" onClick={handleDemoPayment}>Try demo payment</button>
          ) : loading ? (
            <p role="status">Preparing secure payment…</p>
          ) : paymentError ? (
            <p role="alert" className="muted-note">{paymentError}</p>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm reference={reference} />
            </Elements>
          ) : null}
          <Link to="/booking" className="btn btn-secondary full">Back to booking</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default PaymentPage;
