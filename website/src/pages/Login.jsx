import React, { useState } from 'react';
import { auth } from '@/supabase/auth';
import { supabase } from '@/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { UserPlus, LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signIn({ email, password });
      toast.success('Logged in successfully');
      navigate('/ParentDashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('create-auth-user', {
        body: { email, password, full_name: fullName, role: 'parent' }
      });
      if (fnError) throw fnError;
      if (!fnData.success) throw new Error(fnData.error || 'Account creation failed');

      // Auto-login after account created
      await supabase.auth.signInWithPassword({ email, password });
      toast.success('Account created! Welcome to the Parent Portal.');
      navigate('/ParentDashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Try again or contact us.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Ting-A-Ling Schools" className="h-20 w-20 mx-auto mb-4 rounded-full border-2 border-teal-100" />
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'signin' ? 'Parent Portal' : 'Create Account'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin'
              ? 'Sign in to view your applications and contracts'
              : 'Create an account to track your application'}
          </p>
        </div>

        {mode === 'signin' ? (
          <>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 gap-2">
                <LogIn className="w-4 h-4" /> {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-2">Don't have an account?</p>
              <Button variant="outline" className="w-full gap-2" onClick={() => { setMode('signup'); setPassword(''); setConfirm(''); }}>
                <UserPlus className="w-4 h-4" /> Create Account
              </Button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <Label>Full Name *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)}
                  required placeholder="Your name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@email.com" />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="Min 6 characters" minLength={6} />
              </div>
              <div>
                <Label>Confirm Password *</Label>
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required placeholder="Repeat password" minLength={6} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 gap-2">
                <UserPlus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-2">Already have an account?</p>
              <Button variant="outline" className="w-full gap-2" onClick={() => { setMode('signin'); setPassword(''); }}>
                <LogIn className="w-4 h-4" /> Sign In
              </Button>
            </div>
          </>
        )}

        <p className="text-xs text-slate-400 text-center mt-6">
          <Link to="/" className="hover:text-teal-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to website
          </Link>
        </p>
      </Card>
    </div>
  );
}
