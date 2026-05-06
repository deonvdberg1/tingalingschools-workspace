import React, { useState } from 'react';
import { auth } from '@/supabase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signIn({ email, password });
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Ting-A-Ling Schools" className="h-20 w-20 mx-auto mb-4 rounded-full" />
          <h1 className="text-2xl font-bold text-slate-800">Staff Login</h1>
          <p className="text-sm text-slate-500 mt-1">Ting-A-Ling Schools Parent Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@school.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          <a href="https://tingalingschools.com" className="hover:text-teal-600">← Back to website</a>
        </p>
      </Card>
    </div>
  );
}
