import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authService from '../../services/authService';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await authService.requestPasswordReset({ email });
      toast.success(response.message || 'Demo reset request accepted');
    } catch (error) {
      toast.error(error.message || 'Unable to send a reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell compact-auth">
      <div className="auth-panel single-panel">
        <div className="auth-header">
          <span className="brand-mark auth-brand">AG</span>
          <h1>Reset your password</h1>
          <p>Enter your account email and we’ll send a reset link if mail delivery is configured.</p>
        </div>

        <form className="styled-form auth-form" onSubmit={handleSubmit}>
          <div className="field-group icon-field">
            <label htmlFor="forgot-email">Email</label>
            <span className="field-icon"><Mail size={16} /></span>
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
        </form>

        <p className="auth-switcher">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
