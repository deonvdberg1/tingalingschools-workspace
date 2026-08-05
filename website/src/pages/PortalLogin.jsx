import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function PortalLogin() {
  const { user, isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return <Navigate to="/portal" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="Ting-A-Ling Schools" className="w-16 h-16 rounded-full mb-3" />
            <h1 className="text-2xl font-bold text-slate-800">Staff &amp; Parent Portal</h1>
            <p className="text-sm text-slate-500">Ting-A-Ling Schools · Meerensee</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tingalingschools.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <LogIn className="w-4 h-4" />
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-2">
            <p>
              <Link to="/register" className="text-teal-600 hover:underline font-medium">
                Are you a parent? Register here →
              </Link>
            </p>
            <p>
              <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to website
              </Link>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Forgot your password? Contact the school office at 061 527 4429
        </p>
      </div>
    </div>
  );
}
