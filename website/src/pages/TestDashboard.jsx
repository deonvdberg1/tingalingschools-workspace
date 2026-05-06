import React, { useState, useEffect } from 'react';
import { auth } from '@/supabase/auth';

export default function TestDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Auth failed');
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{padding:40,textAlign:'center'}}><div className="animate-spin">⏳</div><p>Loading...</p></div>;
  if (error) return <div style={{padding:40,textAlign:'center',color:'red'}}><h2>Error</h2><p>{error}</p></div>;
  if (!user) return <div style={{padding:40,textAlign:'center'}}><h2>Not logged in</h2><a href="/Login">Login</a></div>;

  return (
    <div style={{padding:40}}>
      <h1>Dashboard Test</h1>
      <p><strong>User:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Name:</strong> {user.full_name}</p>
      <hr style={{margin:'20px 0'}} />
      <p><a href="/AdminDashboard">Go to Full Dashboard</a></p>
    </div>
  );
}
