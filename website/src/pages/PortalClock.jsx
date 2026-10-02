import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PortalShell from '@/components/PortalShell';
import { LogIn, LogOut, Clock, QrCode, CheckCircle2, RefreshCw } from 'lucide-react';

// UTC "YYYY-MM-DD HH:MM:SS" (server) → SAST display
const sast = (v) => (v ? new Date(String(v).replace(' ', 'T') + 'Z') : null);
const fmtTime = (v) => { const d = sast(v); return d ? d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' }) : '—'; };
const fmtDate = (v) => { const d = sast(v); return d ? d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' }) : '—'; };
const fmtDur = (min) => { const m = Math.max(0, Math.round(min || 0)); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; };

export default function PortalClock() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [params] = useSearchParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const scanned = !!params.get('s');

  const load = useCallback(async () => {
    try { setData(await api('/portal/clock/me')); setErr(''); }
    catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { if (isAuthenticated) load().catch(() => {}); }, [isAuthenticated, load]);

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/teacher?next=%2Fclock" replace />;
  }
  if (user.role !== 'staff') {
    return <Navigate to="/portal" replace />;
  }

  const onShift = !!data?.onShift;
  const doClock = async () => {
    setBusy(true); setMsg(''); setErr('');
    try {
      const r = await api('/portal/clock', { method: 'POST', body: { method: scanned ? 'qr' : 'portal' } });
      if (r.action === 'in') setMsg('Clocked in ✅ Have a great day!');
      else setMsg(`Clocked out ✅ Shift: ${fmtDur(r.minutes)}`);
      await load();
      setTimeout(() => setMsg(''), 6000);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <PortalShell user={user} logout={logout} active="clock">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Clock in / out</h1>
          <p className="text-sm text-slate-500">Hello {data?.name || user.name} — tap the button when you arrive or leave.</p>
        </div>

        {scanned && (
          <div className="flex items-center justify-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            <QrCode className="w-4 h-4" /> Scanned at the school entrance
          </div>
        )}

        <div className={`rounded-2xl border shadow-sm p-6 text-center ${onShift ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${onShift ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-sm font-medium text-slate-600">{onShift ? 'On shift now' : 'Not clocked in'}</span>
          </div>
          <div className="text-3xl font-bold text-slate-800 mt-2">
            {onShift ? `Since ${fmtTime(data.since)}` : 'Ready to start'}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Today: <strong>{fmtDur(data?.todayMinutes)}</strong>
          </div>

          <Button
            onClick={doClock}
            disabled={busy}
            className={`mt-5 w-full h-14 text-base gap-2 ${onShift ? 'bg-slate-700 hover:bg-slate-800' : ''}`}
          >
            {onShift ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {busy ? 'Please wait…' : onShift ? 'Clock out' : 'Clock in'}
          </Button>

          {msg && <div className="mt-3 flex items-center justify-center gap-2 text-sm text-teal-700"><CheckCircle2 className="w-4 h-4" /> {msg}</div>}
          {err && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent shifts</h2>
            <Button variant="ghost" size="sm" onClick={load} className="gap-1 text-slate-500"><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(data?.recent || []).map((r) => (
              <div key={r.id} className="border border-slate-100 rounded-lg p-3 text-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="font-medium text-slate-800">{fmtDate(r.clock_in)}</div>
                    <div className="text-xs text-slate-500">
                      {fmtTime(r.clock_in)} → {r.open ? <span className="text-teal-600">on shift</span> : fmtTime(r.clock_out)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-700">{r.open ? fmtDur(Math.max(0, (Date.now() - sast(r.clock_in).getTime()) / 60000)) : fmtDur(r.minutes)}</div>
                  {r.method === 'qr' && <Badge variant="secondary" className="text-[10px] mt-1">QR</Badge>}
                </div>
              </div>
            ))}
            {(!data?.recent || data.recent.length === 0) && <p className="text-sm text-slate-400">No shifts recorded yet — tap “Clock in” to start.</p>}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
