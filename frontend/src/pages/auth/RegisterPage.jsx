import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authService from '../../services/authService';

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await authService.register(form);
      toast.success(response.message || 'Demo registration complete');
    } catch (error) {
      toast.error(error.message || 'Registration could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual" />
      <div className="auth-panel">
        <div className="auth-header">
          <span className="brand-mark auth-brand">AG</span>
          <h1>Create your account</h1>
          <p>{import.meta.env.VITE_DEMO_MODE === 'true' ? 'Frontend demonstration only. No real credentials are stored.' : 'Create a guest account to manage your stay.'}</p>
        </div>

        <form className="styled-form auth-form" onSubmit={handleSubmit}>
          <div className="field-group icon-field">
            <label htmlFor="name">Full name</label>
            <span className="field-icon"><UserRound size={16} /></span>
            <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field-group icon-field">
            <label htmlFor="register-email">Email</label>
            <span className="field-icon"><Mail size={16} /></span>
            <input id="register-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field-group icon-field">
            <label htmlFor="register-password">Password</label>
            <span className="field-icon"><LockKeyhole size={16} /></span>
            <input id="register-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((state) => !state)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className="btn btn-primary full" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>

        <p className="auth-switcher">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
