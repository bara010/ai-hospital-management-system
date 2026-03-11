import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../hooks/useAuth';

function routeByRole(role) {
  if (role === 'PATIENT') return '/patient/dashboard';
  if (role === 'DOCTOR') return '/doctor/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(form);
      navigate(routeByRole(response.user.role));
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Check credentials and TOTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md">
        <form onSubmit={onSubmit} className="panel space-y-5">
          <div className="text-center">
            <BrandLogo to="/" />
            <p className="mt-2 text-sm text-slate-500">Secure sign in with TOTP</p>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">TOTP Verification Code</label>
            <input
              type="text"
              className="input"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
