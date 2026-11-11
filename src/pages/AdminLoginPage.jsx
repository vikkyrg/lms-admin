import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials or unauthorized role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full bg-surface border border-line rounded-lg p-7 space-y-6 shadow-card">
        <div className="text-center space-y-3">
          <div className="inline-flex bg-white border border-line px-4 py-2 rounded-md mx-auto">
            <img
              src={logoImg}
              alt="AutoOps School"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-navy">AutoOps School Admin</h1>
          <p className="text-xs text-ink-soft">Sign in to administer courses, students, and submissions</p>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-danger-soft border border-danger/20 text-danger text-xs rounded-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label" htmlFor="admin-email">Administrative Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Administrative email"
                className="admin-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="admin-label" htmlFor="admin-password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="admin-input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy hover:bg-navy-deep text-white font-semibold rounded-md shadow-sm transition flex items-center justify-center gap-2 text-[13px] disabled:opacity-50"
          >
            {loading ? 'Validating…' : 'Access Dashboard'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLoginPage;
