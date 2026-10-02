import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LogIn, UserPlus, ArrowLeft, GraduationCap, CheckCircle2, Clock, Eye, EyeOff, MapPin,
} from 'lucide-react';

/**
 * Teacher sign in + sign up page.
 *  · Sign in  → staff accounts (approved teachers) land on the school portal.
 *  · Sign up  → self-registration; the account is created as PENDING and the
 *               school office approves it before the teacher can sign in.
 */
export default function PortalTeacher() {
  const { user, isAuthenticated, login, registerTeacher } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState(params.get('signup') ? 'signup' : 'signin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', position: '', password: '', confirm: '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const switchTab = (next) => { setTab(next); setError(''); };

  if (isAuthenticated && user) {
    return <Navigate to="/portal" replace />;
  }

  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(form.email, form.password);
      navigate('/portal', { replace: true, state: { role: u?.role } });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const data = await registerTeacher({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        position: form.position,
      });
      setSubmitted(data?.message || 'Application received. The school office will review it shortly.');
    } catch (err) {
      setError(err.message || 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="Ting-A-Ling Schools" className="w-16 h-16 rounded-full mb-3" />
            <h1 className="text-2xl font-bold text-slate-800">Teacher Portal</h1>
            <p className="text-sm text-slate-500">Ting-A-Ling Schools · Meerensee</p>
          </div>
          {children}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Need help? Contact the school office at 061 527 4429
        </p>
      </div>
    </div>
  );

  // ── Signup success → pending approval confirmation ──
  if (submitted) {
    return shell(
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-teal-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Account submitted</h2>
        <p className="text-sm text-slate-600">{submitted}</p>
        <div className="flex items-start gap-2 text-left text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Your account is <strong>awaiting approval</strong>. Once the school office approves it, you can sign in here with your email and password.</span>
        </div>
        <Button className="w-full gap-2" onClick={() => { setSubmitted(''); switchTab('signin'); }}>
          <LogIn className="w-4 h-4" /> Go to sign in
        </Button>
        <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to website
        </Link>
      </div>
    );
  }

  return shell(
    <>
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => switchTab('signin')}
          className={`py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signin' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchTab('signup')}
          className={`py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signup' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Create account
        </button>
      </div>

      {tab === 'signin' ? (
        <form onSubmit={handleSignin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="you@tingalingschools.com" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••••" required className="pr-10" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            <LogIn className="w-4 h-4" /> {submitting ? 'Signing in…' : 'Sign In'}
          </Button>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-1 text-center">
            <MapPin className="w-3 h-3 shrink-0" /> Teacher sign-in is restricted to the school premises.
          </p>

          <p className="text-sm text-slate-600 text-center">
            New teacher?{' '}
            <button type="button" onClick={() => switchTab('signup')} className="text-teal-600 hover:underline font-medium">
              Create an account →
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Thandi Mthembu" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="082 123 4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position <span className="text-slate-400 font-normal">(optional)</span></label>
              <Input value={form.position} onChange={set('position')} placeholder="e.g. Grade R" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <Input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <Input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Re-enter your password" required />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            <UserPlus className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Create Teacher Account'}
          </Button>

          <p className="text-xs text-slate-400 text-center">
            New accounts are reviewed and approved by the school office before first sign in.
          </p>
          <p className="text-sm text-slate-600 text-center">
            Already registered?{' '}
            <button type="button" onClick={() => switchTab('signin')} className="text-teal-600 hover:underline font-medium">
              Sign in →
            </button>
          </p>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100 text-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to website
        </Link>
        <span className="text-slate-300 mx-2">·</span>
        <Link to="/login" className="text-slate-500 hover:text-slate-700">Staff &amp; parent sign in</Link>
      </div>
    </>
  );
}
