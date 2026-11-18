import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

const emptyForm = { email: '', password: '' };

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const emailError = !form.email.trim()
    ? 'Enter your administrator email address.'
    : !/^\S+@\S+\.\S+$/.test(form.email.trim())
      ? 'Use a valid email address.'
      : '';

  const passwordError = !form.password
    ? 'Enter your password.'
    : form.password.length < 8
      ? 'Password must contain at least 8 characters.'
      : '';

  async function handleSubmit(event) {
    event.preventDefault();

    const nextTouched = { email: true, password: true };
    setTouched(nextTouched);

    if (emailError || passwordError) {
      setError('Please correct the highlighted fields and try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      navigate(location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Administrator sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-screen">
      <section className="admin-login-visual">
        <div className="admin-login-brand">
          <span className="admin-login-mark">AG</span>
          <span>
            <strong>AURELIA GRAND</strong>
            <small>HOTEL MANAGEMENT</small>
          </span>
        </div>

        <div className="admin-login-copy">
          <span className="login-kicker">PRIVATE ADMINISTRATION</span>
          <h1>Run every detail of the hotel with clarity.</h1>
          <p>
            A focused operations workspace for reservations, rooms, finances, and guest service standards.
          </p>
        </div>

        <span className="admin-login-footer">AURELIA GRAND · EST. 2024</span>
      </section>

      <section className="admin-login-panel">
        <form className="admin-login-card" onSubmit={handleSubmit} noValidate>
          <div className="admin-login-icon">
            <LockKeyhole size={18} />
          </div>

          <span className="login-kicker login-kicker-dark">WELCOME BACK</span>
          <h2>Admin login</h2>
          <p>Use your Aurelia Grand staff credentials to continue to the operations dashboard.</p>

          {error && (
            <div role="alert" className="admin-login-error">
              {error}
            </div>
          )}

          <label className="admin-form-field">
            <span>Email address</span>
            <input
              className={`field-control ${touched.email && emailError ? 'field-control-error' : ''}`}
              type="email"
              name="email"
              autoComplete="username"
              maxLength={254}
              value={form.email}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                if (error) setError('');
              }}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            />
            {touched.email && emailError && <small>{emailError}</small>}
          </label>

          <label className="admin-form-field">
            <span>Password</span>
            <div className="admin-password-wrap">
              <input
                className={`field-control ${touched.password && passwordError ? 'field-control-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                maxLength={128}
                value={form.password}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  if (error) setError('');
                }}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              />
              <button
                type="button"
                className="admin-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {touched.password && passwordError && <small>{passwordError}</small>}
          </label>

          <button type="submit" className="btn btn-primary admin-login-submit" disabled={loading}>
            {loading ? 'Signing in…' : <>Sign in <ArrowRight size={15} /></>}
          </button>

          <small className="admin-login-security">
            Protected access · administrator accounts are provisioned by hotel leadership.
          </small>
        </form>
      </section>
    </main>
  );
}