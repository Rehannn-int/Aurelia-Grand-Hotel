import { useMemo, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authService from '../../services/authService';
import { useAppContext } from '../../context/contextHooks';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });

  const pageSubtitle = useMemo(
    () => (import.meta.env.VITE_DEMO_MODE === 'true'
      ? 'Continue to your guest account and manage your stay.'
      : 'Sign in to access your reservations, profile, and stay details.'),
    [],
  );

  const validateForm = () => {
    const nextErrors = {
      email: !form.email.trim() ? 'Please enter your email address.' : '',
      password: !form.password ? 'Please enter your password.' : '',
    };

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(form);
      setUser(response.user);
      toast.success(response.message || 'Signed in successfully.');
      navigate(location.state?.from || '/account', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual" aria-hidden="true" />

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand-row">
            <span className="brand-mark auth-brand">AG</span>
            <span className="brand-text">
              <strong>AURELIA GRAND</strong>
              <small>Hotel Management</small>
            </span>
          </div>

          <header className="auth-header">
            <span className="eyebrow text-forest">Guest access</span>
            <h1>Welcome back</h1>
            <p>{pageSubtitle}</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group icon-field">
              <label htmlFor="email">Email address</label>
              <span className="field-icon" aria-hidden="true"><Mail size={16} /></span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value });
                  if (errors.email) setErrors((current) => ({ ...current, email: '' }));
                }}
                aria-invalid={Boolean(errors.email)}
                required
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field-group icon-field">
              <label htmlFor="password">Password</label>
              <span className="field-icon" aria-hidden="true"><LockKeyhole size={16} /></span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  if (errors.password) setErrors((current) => ({ ...current, password: '' }));
                }}
                aria-invalid={Boolean(errors.password)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((state) => !state)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="auth-row">
              <Link to="/forgot-password" className="text-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary full auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="auth-switcher">
            Don’t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
