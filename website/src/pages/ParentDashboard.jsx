import React, { useState, useEffect } from 'react';
import { auth } from '@/supabase/auth';
import { supabase } from '@/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Megaphone, FileText, User, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    auth.me().then(async (u) => {
      setUser(u);
      if (u) {
        // Load events
        const { data: evts } = await supabase.from('school_events')
          .select('*').gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true }).limit(10);
        if (evts) setEvents(evts);

        // Load announcements
        const { data: anns } = await supabase.from('staff_announcements')
          .select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5);
        if (anns) setAnnouncements(anns);

        // Load user's contracts
        const { data: conts } = await supabase.from('parent_contracts')
          .select('*').eq('parent1_email', u.email).order('created_at', { ascending: false });
        if (conts) setContracts(conts);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>;
  }

  if (!user || user.role !== 'parent') {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Parent Access Only</h2>
        <p className="text-slate-500">This area is for registered parents. <Link to="/Login" className="text-teal-600 hover:underline">Login here</Link></p>
      </div>
    );
  }

  const statusBadge = (status) => {
    const colors = { application: 'bg-blue-100 text-blue-700', signed: 'bg-green-100 text-green-700', approved: 'bg-teal-100 text-teal-700' };
    return colors[status] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Parent Portal</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {user.full_name} 👋</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {events.map(e => (
                  <div key={e.id} className="flex items-start gap-3 border-b border-slate-100 pb-2 last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-teal-700 leading-tight">
                        {format(parseISO(e.start_date), 'dd')}
                      </span>
                      <span className="text-[9px] text-teal-500 leading-tight">
                        {format(parseISO(e.start_date), 'MMM')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{e.title}</p>
                      <p className="text-xs text-slate-400">{e.event_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-base">Updates & Notices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-400">No recent updates.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className="border-b border-slate-100 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">{a.title}</p>
                      {a.priority === 'High' && <Badge className="text-[10px] bg-red-100 text-red-700">{a.priority}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Applications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <CardTitle className="text-base">My Applications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 mb-3">You haven't submitted any applications yet.</p>
              <Link to="/" className="text-sm text-teal-600 hover:underline">Apply to a school →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map(c => (
                <div key={c.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.student_first_name} {c.student_last_name}</p>
                    <p className="text-xs text-slate-400">{c.school_location} · {format(parseISO(c.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <Badge className={`text-xs ${statusBadge(c.status)}`}>{c.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
