import React, { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Megaphone, CalendarDays, Users, LogOut, ArrowLeft,
  Plane, UserPlus, RefreshCw, Phone, Clock,
} from 'lucide-react';

const fmtDate = (d) => (d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const Card = ({ title, children, action }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  </div>
);

// ─────────────────────────── ADMIN PANEL ───────────────────────────
function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [leave, setLeave] = useState([]);
  const [staff, setStaff] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [reload, setReload] = useState(0);

  // announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annAudience, setAnnAudience] = useState('all');
  // event form
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evDesc, setEvDesc] = useState('');
  // staff form
  const [stName, setStName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stPass, setStPass] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, a, e, l, st, r] = await Promise.all([
        api('/portal/stats'), api('/portal/announcements'), api('/portal/events'),
        api('/portal/leave'), api('/portal/staff'), api('/portal/registrations'),
      ]);
      setStats(s); setAnnouncements(a); setEvents(e); setLeave(l); setStaff(st); setRegistrations(r);
    } catch (err) { setMsg(err.message); }
  }, []);
  useEffect(() => { load(); }, [load, reload]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const createAnnouncement = async () => {
    if (!annTitle || !annBody) return;
    await api('/portal/announcements', { method: 'POST', body: { title: annTitle, body: annBody, audience: annAudience } });
    setAnnTitle(''); setAnnBody(''); setAnnAudience('all');
    flash('Announcement published ✅'); setReload(r => r + 1);
  };
  const deleteAnnouncement = async (id) => {
    await api(`/portal/announcements/${id}`, { method: 'DELETE' });
    setReload(r => r + 1);
  };
  const createEvent = async () => {
    if (!evTitle) return;
    await api('/portal/events', { method: 'POST', body: { title: evTitle, event_date: evDate, description: evDesc } });
    setEvTitle(''); setEvDate(''); setEvDesc('');
    flash('Event added ✅'); setReload(r => r + 1);
  };
  const deleteEvent = async (id) => {
    await api(`/portal/events/${id}`, { method: 'DELETE' });
    setReload(r => r + 1);
  };
  const setLeaveStatus = async (id, status) => {
    await api(`/portal/leave/${id}/status`, { method: 'PUT', body: { status } });
    setReload(r => r + 1);
  };
  const createStaff = async () => {
    if (!stName || !stEmail || !stPass) return;
    await api('/portal/staff', { method: 'POST', body: { name: stName, email: stEmail, password: stPass } });
    setStName(''); setStEmail(''); setStPass('');
    flash('Staff login created ✅'); setReload(r => r + 1);
  };
  const deleteStaff = async (id) => {
    await api(`/portal/staff/${id}`, { method: 'DELETE' });
    setReload(r => r + 1);
  };

  return (
    <div className="space-y-6">
      {msg && <div className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">{msg}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Announcements" value={stats.announcements} icon={Megaphone} color="bg-teal-500" />
          <StatCard label="Events" value={stats.events} icon={CalendarDays} color="bg-cyan-500" />
          <StatCard label="Staff" value={stats.staff} icon={Users} color="bg-blue-500" />
          <StatCard label="Parents" value={stats.parents} icon={UserPlus} color="bg-indigo-500" />
          <StatCard label="Leave pending" value={stats.pendingLeave} icon={Plane} color="bg-amber-500" />
          <StatCard label="Registrations" value={stats.registrations} icon={RefreshCw} color="bg-rose-500" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Publish Announcement" action={<Button variant="ghost" size="sm" onClick={() => setReload(r => r + 1)}><RefreshCw className="w-3.5 h-3.5" /></Button>}>
          <div className="space-y-3">
            <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Title, e.g. School closes early Friday" />
            <Textarea value={annBody} onChange={e => setAnnBody(e.target.value)} placeholder="Message body…" rows={3} />
            <div className="flex items-center gap-3">
              <select
                value={annAudience}
                onChange={e => setAnnAudience(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                <option value="all">Everyone</option>
                <option value="staff">Staff only</option>
                <option value="parents">Parents only</option>
              </select>
              <Button onClick={createAnnouncement} className="gap-2"><Megaphone className="w-4 h-4" /> Publish</Button>
            </div>
          </div>
          <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
            {announcements.map(a => (
              <div key={a.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-800">{a.title}
                    <Badge variant="secondary" className="ml-2 text-[10px]">{a.audience}</Badge>
                  </div>
                  <div className="text-slate-500 line-clamp-2">{a.body}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{fmtDate(a.created_at)} · {a.created_by}</div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteAnnouncement(a.id)}>✕</Button>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-slate-400">No announcements yet.</p>}
          </div>
        </Card>

        <Card title="Add Event">
          <div className="space-y-3">
            <Input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Event name, e.g. Sports Day" />
            <Input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} />
            <Textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Description (optional)" rows={2} />
            <Button onClick={createEvent} className="gap-2"><CalendarDays className="w-4 h-4" /> Add Event</Button>
          </div>
          <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-800">{ev.title}</div>
                  <div className="text-slate-500">{fmtDate(ev.event_date)}</div>
                  {ev.description && <div className="text-slate-400 text-xs mt-1">{ev.description}</div>}
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteEvent(ev.id)}>✕</Button>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-slate-400">No events yet.</p>}
          </div>
        </Card>

        <Card title="Leave Requests">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leave.map(l => (
              <div key={l.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-800">{l.user_name}</div>
                  <div className="text-slate-500">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</div>
                  {l.reason && <div className="text-slate-400 text-xs">{l.reason}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={l.status === 'approved' ? 'default' : l.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {l.status}
                  </Badge>
                  {l.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="text-teal-600" onClick={() => setLeaveStatus(l.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => setLeaveStatus(l.id, 'rejected')}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {leave.length === 0 && <p className="text-sm text-slate-400">No leave requests.</p>}
          </div>
        </Card>

        <Card title="Staff Logins" action={<span className="text-xs text-slate-400">{staff.length} staff</span>}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={stName} onChange={e => setStName(e.target.value)} placeholder="Staff name" />
              <Input type="email" value={stEmail} onChange={e => setStEmail(e.target.value)} placeholder="Email" />
            </div>
            <div className="flex gap-2">
              <Input value={stPass} onChange={e => setStPass(e.target.value)} placeholder="Temporary password" />
              <Button onClick={createStaff} className="gap-2 shrink-0"><UserPlus className="w-4 h-4" /> Add</Button>
            </div>
          </div>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {staff.map(s => (
              <div key={s.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">{s.name}</div>
                  <div className="text-slate-500 text-xs">{s.email}</div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteStaff(s.id)}>✕</Button>
              </div>
            ))}
            {staff.length === 0 && <p className="text-sm text-slate-400">No staff logins yet.</p>}
          </div>
        </Card>

        <Card title="Parent Registrations">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {registrations.map(r => (
              <div key={r.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                <div className="font-medium text-slate-800">{r.name}</div>
                <div className="text-slate-500 text-xs">{r.email}{r.child_name ? ` · Child: ${r.child_name}` : ''}</div>
              </div>
            ))}
            {registrations.length === 0 && <p className="text-sm text-slate-400">No parent registrations yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────── STAFF PANEL ───────────────────────────
function StaffPanel({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [leave, setLeave] = useState([]);
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [a, e, l] = await Promise.all([api('/portal/announcements'), api('/portal/events'), api('/portal/leave/mine')]);
    setAnnouncements(a); setEvents(e); setLeave(l);
  }, []);
  useEffect(() => { load().catch(err => setMsg(err.message)); }, [load]);

  const submitLeave = async () => {
    if (!form.start_date || !form.end_date) return;
    await api('/portal/leave', { method: 'POST', body: form });
    setForm({ start_date: '', end_date: '', reason: '' });
    setMsg('Leave request submitted ✅'); setTimeout(() => setMsg(''), 4000);
    load();
  };

  return (
    <div className="space-y-6">
      {msg && <div className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">{msg}</div>}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Welcome, {user?.name}</h2>
        <p className="text-sm text-slate-500">Here's what's happening at Ting-A-Ling.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Announcements">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {announcements.map(a => (
              <div key={a.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                <div className="font-medium text-slate-800">{a.title}
                  <Badge variant="secondary" className="ml-2 text-[10px]">{a.audience}</Badge>
                </div>
                <div className="text-slate-600 mt-1">{a.body}</div>
                <div className="text-[11px] text-slate-400 mt-1">{fmtDate(a.created_at)}</div>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-slate-400">No announcements yet.</p>}
          </div>
        </Card>

        <Card title="Upcoming Events">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-start gap-3">
                <div className="bg-teal-50 text-teal-700 rounded-lg px-3 py-2 text-center shrink-0 w-16">
                  <div className="text-lg font-bold leading-none">{ev.event_date ? new Date(ev.event_date + 'T00:00:00').getDate() : '—'}</div>
                  <div className="text-[10px] uppercase">{ev.event_date ? new Date(ev.event_date + 'T00:00:00').toLocaleString('en-ZA', { month: 'short' }) : ''}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-800">{ev.title}</div>
                  {ev.description && <div className="text-slate-500 text-xs">{ev.description}</div>}
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-slate-400">No events yet.</p>}
          </div>
        </Card>

        <Card title="My Leave Requests" action={<span className="text-xs text-slate-400">{leave.length} total</span>}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason (optional)" />
            <Button onClick={submitLeave} className="gap-2"><Plane className="w-4 h-4" /> Submit Request</Button>
          </div>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {leave.map(l => (
              <div key={l.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-700">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</span>
                  {l.reason && <span className="text-slate-400 text-xs block">{l.reason}</span>}
                </div>
                <Badge variant={l.status === 'approved' ? 'default' : l.status === 'rejected' ? 'destructive' : 'secondary'}>{l.status}</Badge>
              </div>
            ))}
            {leave.length === 0 && <p className="text-sm text-slate-400">No leave requests yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────── PARENT PANEL ───────────────────────────
function ParentPanel({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [absence, setAbsence] = useState({ child: '', date: '', reason: '' });

  const load = useCallback(async () => {
    const [a, e] = await Promise.all([api('/portal/announcements'), api('/portal/events')]);
    setAnnouncements(a); setEvents(e);
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const reportAbsence = () => {
    const msg = `Absence report%0AChild: ${encodeURIComponent(absence.child)}%0ADate: ${encodeURIComponent(absence.date)}%0AReason: ${encodeURIComponent(absence.reason)}%0AFrom: ${encodeURIComponent(user?.name || '')}`;
    window.open(`https://wa.me/27615274429?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Welcome, {user?.name}</h2>
        <p className="text-sm text-slate-500">Announcements, events and school updates — all in one place.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="School Announcements">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {announcements.map(a => (
              <div key={a.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                <div className="font-medium text-slate-800">{a.title}</div>
                <div className="text-slate-600 mt-1">{a.body}</div>
                <div className="text-[11px] text-slate-400 mt-1">{fmtDate(a.created_at)}</div>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-slate-400">No announcements yet.</p>}
          </div>
        </Card>

        <Card title="Upcoming Events">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-start gap-3">
                <div className="bg-cyan-50 text-cyan-700 rounded-lg px-3 py-2 text-center shrink-0 w-16">
                  <div className="text-lg font-bold leading-none">{ev.event_date ? new Date(ev.event_date + 'T00:00:00').getDate() : '—'}</div>
                  <div className="text-[10px] uppercase">{ev.event_date ? new Date(ev.event_date + 'T00:00:00').toLocaleString('en-ZA', { month: 'short' }) : ''}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-800">{ev.title}</div>
                  {ev.description && <div className="text-slate-500 text-xs">{ev.description}</div>}
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-slate-400">No events yet.</p>}
          </div>
        </Card>

        <Card title="Report an Absence" action={<Phone className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-3">
            <Input value={absence.child} onChange={e => setAbsence({ ...absence, child: e.target.value })} placeholder="Child's name" />
            <Input type="date" value={absence.date} onChange={e => setAbsence({ ...absence, date: e.target.value })} />
            <Input value={absence.reason} onChange={e => setAbsence({ ...absence, reason: e.target.value })} placeholder="Reason (optional)" />
            <Button onClick={reportAbsence} className="gap-2 w-full">
              <Clock className="w-4 h-4" /> Send Absence Report via WhatsApp
            </Button>
            <p className="text-xs text-slate-400 text-center">
              Opens WhatsApp with the details pre-filled, sent to the school office (061 527 4429).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────── SHELL + ROUTER ───────────────────────────
export default function PortalDashboard() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'client_admin' || user.role === 'overlord';
  const isStaff = user.role === 'staff';
  const isParent = user.role === 'parent';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Ting-A-Ling" className="w-10 h-10 rounded-full" />
            <div>
              <div className="font-bold text-slate-800 leading-tight">Ting-A-Ling Schools</div>
              <div className="text-[11px] text-slate-400">Portal</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg font-medium">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </div>
          <div className="px-3 py-2 text-slate-400 flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Announcements
          </div>
          <div className="px-3 py-2 text-slate-400 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Events
          </div>
          {isStaff && <div className="px-3 py-2 text-slate-400 flex items-center gap-2"><Plane className="w-4 h-4" /> Leave</div>}
          {isAdmin && <div className="px-3 py-2 text-slate-400 flex items-center gap-2"><Users className="w-4 h-4" /> Management</div>}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-1">
          <Badge variant="secondary" className="mb-2 capitalize">{user.role.replace('_', ' ')}</Badge>
          <Button variant="outline" size="sm" className="w-full gap-2 text-red-500" onClick={logout}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to website
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Ting-A-Ling" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-slate-800 text-sm">Ting-A-Ling Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{user.role.replace('_', ' ')}</Badge>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4 text-red-500" /></Button>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {isAdmin && <AdminPanel />}
          {isStaff && <StaffPanel user={user} />}
          {isParent && <ParentPanel user={user} />}
        </main>

        <footer className="p-4 text-center text-xs text-slate-400">
          Ting-A-Ling Schools · Meerensee, Richards Bay · 061 527 4429 · info@tingalingschools.com
        </footer>
      </div>
    </div>
  );
}
