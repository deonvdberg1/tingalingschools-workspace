import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function PortalRegister() {
  const { user, isAuthenticated, registerParent } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', child_name: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return <Navigate to="/portal" replace />;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await registerParent(form);
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
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
            <h1 className="text-2xl font-bold text-slate-800">Parent Portal Registration</h1>
            <p className="text-sm text-slate-500">Ting-A-Ling Schools · Meerensee</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
              <Input value={form.name} onChange={set('name')} placeholder="e.g. Thandi Mthembu" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <Input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Child's name (optional)</label>
              <Input value={form.child_name} onChange={set('child_name')} placeholder="e.g. Nandi" />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Creating account…' : 'Create Parent Account'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-2">
            <p>
              <Link to="/login" className="text-teal-600 hover:underline font-medium">
                Already registered? Sign in →
              </Link>
            </p>
            <p>
              <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
