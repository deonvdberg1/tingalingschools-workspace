import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api, API_BASE, getToken } from '@/lib/api';
import PortalShell from '@/components/PortalShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Eye, CalendarDays, Zap, MousePointerClick, Target, TrendingUp,
  Download, Activity, Globe, MonitorSmartphone, KeyRound, Users, Layers,
} from 'lucide-react';

const COLORS = ['#0d9488', '#06b6d4', '#3b82f6', '#7c3aed', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#84cc16', '#e11d48'];
const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: 0 },
];
const ACTION_LABELS = {
  signin: '✅ Portal sign-in',
  signin_failed: '❌ Failed sign-in',
  signup: '🆕 Account sign-up',
};
const SECTION_LABELS = {
  'pre-primary': 'Pre-Primary School',
  'special-needs': 'Special Needs School',
  main: 'Main Site / Home',
  apply: 'Applications (general)',
};
const fmt = (n) => (n || 0).toLocaleString('en-ZA');

function Stat({ label, value, icon: Icon, sub, color = 'bg-teal-500', target, onJump }) {
  return (
    <button
      type="button"
      onClick={target ? () => onJump(target) : undefined}
      title={target ? `Jump to ${label}` : undefined}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 text-left transition-shadow ${
        target ? 'cursor-pointer hover:shadow-md hover:border-teal-300' : ''
      }`}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
        {target && <div className="text-[10px] text-teal-600 mt-0.5">View details →</div>}
      </div>
    </button>
  );
}

const Card = ({ title, icon: Icon, children, right, className = '', id }) => (
  <div id={id} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-shadow ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-teal-600" />} {title}
      </h2>
      {right}
    </div>
    {children}
  </div>
);

function Bars({ data, color = '#0d9488' }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <div className="w-32 truncate text-slate-600 shrink-0">{d.name}</div>
          <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: `${Math.max(2, (d.count / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
          <div className="w-12 text-right text-slate-500 font-medium shrink-0">{fmt(d.count)}</div>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
    </div>
  );
}

export default function PortalAnalytics() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [range, setRange] = useState(RANGES[1]); // 30 days default
  const [includeInternal, setIncludeInternal] = useState(false);
  const [markedInternal, setMarkedInternal] = useState(() => {
    try { return localStorage.getItem('ae_internal') === '1'; } catch { return false; }
  });
  const [flash, setFlash] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setFlash(id);
    setTimeout(() => setFlash(''), 2200);
  };

  const markBrowser = () => {
    try { localStorage.setItem('ae_internal', '1'); setMarkedInternal(true); } catch {}
  };
  const unmarkBrowser = () => {
    try { localStorage.removeItem('ae_internal'); setMarkedInternal(false); } catch {}
  };

  const isAdmin = user?.role === 'client_admin' || user?.role === 'overlord';

  const rangeParams = useCallback(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = range.days
      ? new Date(Date.now() - (range.days - 1) * 864e5).toISOString().slice(0, 10)
      : '2000-01-01';
    return { from, to, internal: includeInternal ? '1' : '0' };
  }, [range, includeInternal]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams(rangeParams()).toString();
      const [overview, pages, referrers, locations, devices, logins, health, sections] = await Promise.all([
        api(`/site-analytics/overview?${q}`),
        api(`/site-analytics/pages?${q}`),
        api(`/site-analytics/referrers?${q}`),
        api(`/site-analytics/locations?${q}`),
        api(`/site-analytics/devices?${q}`),
        api(`/site-analytics/logins?${q}`),
        api('/site-analytics/health'),
        api(`/site-analytics/sections?${q}`),
      ]);
      setData({ overview, pages, referrers, locations, devices, logins: logins.logins || [], health, sections: sections.sections || [] });
    } catch (e) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const q = new URLSearchParams(rangeParams()).toString();
      const res = await fetch(`${API_BASE}/site-analytics/export?${q}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tingaling-site-analytics-${rangeParams().from}-to-${rangeParams().to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/portal" replace />;

  const o = data?.overview;
  const hourly = (o?.hourly || []).map((c, h) => ({ hour: `${String(h).padStart(2, '0')}:00`, count: c }));
  const daily = (o?.daily || []).map((d) => ({ day: d.day.slice(5), visits: d.daily }));
  const hourlyActive = hourly.filter((h) => h.count > 0);

  return (
    <PortalShell user={user} logout={logout} active="analytics">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Site Analytics</h1>
          <p className="text-sm text-slate-500">tingalingschools.com · traffic &amp; engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  range.label === r.label ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

      {data && o && o.split && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
          <div className="min-w-[220px]">
            <div className="text-sm font-semibold text-slate-700">Customer vs Your visits</div>
            <div className="text-xs text-slate-500">
              {fmt(o.split.external)} customer visits · {fmt(o.split.internal)} from you
              {o.split.external + o.split.internal > 0 && (
                <> — {Math.round((o.split.internal / (o.split.external + o.split.internal)) * 100)}% of traffic is your own</>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-[140px] h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${((o.split.external / (o.split.external + o.split.internal || 1)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <Button
              variant={includeInternal ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIncludeInternal((v) => !v)}
            >
              {includeInternal ? 'Showing all visits' : 'Customers only'}
            </Button>
            {markedInternal ? (
              <Button variant="outline" size="sm" onClick={unmarkBrowser} title="This browser is marked as yours — its visits are excluded from customer numbers">
                ✓ This browser = me
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={markBrowser} title="Mark this browser/device as yours so its visits don't count as customers">
                Mark this browser as me
              </Button>
            )}
          </div>
          <p className="w-full text-[11px] text-slate-400">
            {markedInternal
              ? 'This browser/device is marked as yours — its visits are excluded from customer numbers (applies from now on).'
              : 'Tip: click “Mark this browser as me” on each device you use (laptop, phone) so your own browsing doesn’t count as customers.'}
          </p>
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      {loading && !data && <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}

      {data && o && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Stat label="Page Views" value={fmt(o.totals.visits)} icon={Eye} color="bg-teal-500" sub={`${fmt(o.totals.avg_per_day)} / day avg`} target="sec-trend" onJump={jump} />
            <Stat label="Events" value={fmt(o.totals.events)} icon={Zap} color="bg-cyan-500" sub="clicks &amp; actions" target="sec-events" onJump={jump} />
            <Stat label="Pages" value={fmt(o.totals.pages)} icon={Activity} color="bg-blue-500" sub="unique paths" target="sec-pages" onJump={jump} />
            <Stat label="Apply Views" value={fmt(o.funnel.apply_views)} icon={MousePointerClick} color="bg-indigo-500" sub="enrolment page" target="sec-sections" onJump={jump} />
            <Stat label="Apply Submits" value={fmt(o.funnel.apply_submits)} icon={Target} color="bg-amber-500" sub="forms sent" target="sec-sections" onJump={jump} />
            <Stat label="Conversion" value={`${o.funnel.conversion_rate}%`} icon={TrendingUp} color="bg-rose-500" sub="view → submit" target="sec-sections" onJump={jump} />
          </div>

          {/* Sections */}
          {data.sections && data.sections.length > 0 && (
            <Card id="sec-sections" title="Traffic by School Section" icon={Layers} className={flash === 'sec-sections' ? 'ring-2 ring-teal-400' : ''}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      <th className="py-2 pr-4">Section</th>
                      <th className="py-2 pr-4">Views</th>
                      <th className="py-2 pr-4">Apply views</th>
                      <th className="py-2 pr-4">Submits</th>
                      <th className="py-2">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sections.map((s) => (
                      <tr key={s.section} className="border-b border-slate-50">
                        <td className="py-2 pr-4 font-medium text-slate-700">{SECTION_LABELS[s.section] || s.section}</td>
                        <td className="py-2 pr-4 text-slate-600">{fmt(s.views)}</td>
                        <td className="py-2 pr-4 text-slate-600">{fmt(s.apply_views)}</td>
                        <td className="py-2 pr-4 text-slate-600">{fmt(s.apply_submits)}</td>
                        <td className="py-2">
                          <span className="font-semibold text-teal-600">{s.conversion_rate}%</span>
                          <span className="w-20 h-1.5 bg-slate-100 rounded-full ml-2 align-middle inline-block">
                            <span className="block h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, s.conversion_rate)}%` }} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Where parents reach you — pre-primary and special-needs rows include their application pages (apply?school=…).
              </p>
            </Card>
          )}

          {/* Trend + hourly */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card id="sec-trend" title="Visits per Day" icon={CalendarDays} className={flash === 'sec-trend' ? 'ring-2 ring-teal-400' : ''} right={<span className="text-xs text-slate-400">{o.range.from} → {o.range.to}</span>} >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="visits" stroke="#0d9488" strokeWidth={2} fill="url(#gTeal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Busiest Hours" icon={Activity} >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {hourlyActive.length > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  Peak: <span className="font-semibold text-slate-600">{hourlyActive.reduce((a, b) => (b.count > a.count ? b : a)).hour}</span> · Quietest: <span className="font-semibold text-slate-600">{hourlyActive.reduce((a, b) => (b.count < a.count ? b : a)).hour}</span>
                </p>
              )}
            </Card>

            <Card title="Referrers" icon={Globe} >
              <div className="max-h-56 overflow-y-auto pr-1">
                <Bars data={data.referrers.refs.slice(0, 10)} color="#3b82f6" />
              </div>
            </Card>
          </div>

          {/* Pages + events */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card id="sec-pages" title="Top Pages" icon={Eye} className={flash === 'sec-pages' ? 'ring-2 ring-teal-400' : ''}>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {data.pages.pages.slice(0, 15).map((p) => (
                  <div key={p.path} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 text-sm">
                    <div className="truncate">
                      <span className="text-slate-700 font-medium">{p.path === '/' ? 'Home' : p.path}</span>
                      {p.title && <span className="text-slate-400 text-xs ml-2 hidden sm:inline">{p.title}</span>}
                    </div>
                    <Badge variant="secondary" className="shrink-0">{fmt(p.visitors)}</Badge>
                  </div>
                ))}
                {data.pages.pages.length === 0 && <p className="text-sm text-slate-400">No page views yet.</p>}
              </div>
            </Card>

            <Card id="sec-events" title="Events &amp; Actions" icon={Zap} className={flash === 'sec-events' ? 'ring-2 ring-teal-400' : ''}>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {data.pages.events.map((e) => (
                  <div key={e.path_id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 text-sm">
                    <div className="truncate text-slate-700">{e.title || e.path}</div>
                    <Badge variant="secondary" className="shrink-0">{fmt(e.visitors)}</Badge>
                  </div>
                ))}
                {data.pages.events.length === 0 && <p className="text-sm text-slate-400">No tracked events yet.</p>}
              </div>
            </Card>
          </div>

          {/* Devices + locations */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card title="Browsers" icon={MonitorSmartphone}>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.devices.browsers} dataKey="count" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {data.devices.browsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Operating Systems" icon={MonitorSmartphone}>
              <div className="max-h-56 overflow-y-auto pr-1"><Bars data={data.devices.systems} color="#7c3aed" /></div>
            </Card>

            <Card title="Screen Sizes &amp; Locations" icon={Globe}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {data.devices.sizes.map((s, i) => (
                    <div key={s.name} className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-slate-800">{fmt(s.count)}</div>
                      <div className="text-[11px] text-slate-500">{s.name}</div>
                    </div>
                  ))}
                </div>
                <Bars data={data.locations.locations.slice(0, 6)} color="#0d9488" />
              </div>
            </Card>
          </div>

          {/* Logins + health */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card title="Portal Sign-ins" icon={KeyRound} className="lg:col-span-2">
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {data.logins.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 text-sm">
                    <div className="truncate">
                      <span className="text-slate-700">{ACTION_LABELS[l.action] || l.action}</span>
                      <span className="text-slate-400 text-xs ml-2">{l.email}</span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{l.created_at}</span>
                  </div>
                ))}
                {data.logins.length === 0 && <p className="text-sm text-slate-400">No portal sign-ins in this range.</p>}
              </div>
            </Card>

            <Card title="Tracking Health" icon={Activity}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Beacon script</span>
                  {data.health.script_present
                    ? <Badge>✅ Present</Badge>
                    : <Badge variant="destructive">Missing</Badge>}
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Hits today</span>
                  <span className="font-semibold text-slate-800">{fmt(data.health.today_hits)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Last checked</span>
                  <span className="text-slate-600">{new Date(data.health.checked_at).toLocaleString('en-ZA')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Last updated</span>
                  <span className="text-slate-600">{new Date(o.last_updated).toLocaleString('en-ZA')}</span></div>
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Privacy-friendly: no cookies, no personal data. Aggregated counts only.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
    </PortalShell>
  );
}
