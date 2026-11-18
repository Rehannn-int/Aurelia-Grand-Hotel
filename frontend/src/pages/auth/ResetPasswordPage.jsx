import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authService from '../../services/authService';

function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await authService.resetPassword({ token: searchParams.get('token'), password });
      toast.success(response.message || 'Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Password could not be reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell compact-auth">
      <div className="auth-panel single-panel">
        <div className="auth-header">
          <span className="brand-mark auth-brand">AG</span>
          <h1>Create a new password</h1>
          <p>Choose a new password for your account.</p>
        </div>

        <form className="styled-form auth-form" onSubmit={handleSubmit}>
          <div className="field-group icon-field">
            <label htmlFor="new-password">New password</label>
            <span className="field-icon"><LockKeyhole size={16} /></span>
            <input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((state) => !state)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className="btn btn-primary full" disabled={loading}>{loading ? 'Saving…' : 'Save new password'}</button>
        </form>

        <p className="auth-switcher">
          <Link to="/login">Return to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
