import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Megaphone, CalendarDays, Users, LogOut, ArrowLeft,
  Plane, BarChart3,
} from 'lucide-react';

/**
 * Shared portal shell — sidebar + mobile header + footer.
 * Used by the dashboard and analytics pages so navigation stays visible everywhere.
 */
export default function PortalShell({ user, logout, active = 'dashboard', children }) {
  const isAdmin = user?.role === 'client_admin' || user?.role === 'overlord';
  const isStaff = user?.role === 'staff';

  const navItem = (to, label, icon, isActive, show = true) =>
    show && (
      <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
          isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        {icon} {label}
      </Link>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (desktop) */}
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
          {navItem('/portal', 'Dashboard', <LayoutDashboard className="w-4 h-4" />, active === 'dashboard')}
          {navItem('/portal/analytics', 'Analytics', <BarChart3 className="w-4 h-4" />, active === 'analytics', isAdmin)}
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
          <Badge variant="secondary" className="mb-2 capitalize">{user?.role?.replace('_', ' ') || ''}</Badge>
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
            <Badge variant="secondary" className="capitalize">{user?.role?.replace('_', ' ') || ''}</Badge>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4 text-red-500" /></Button>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

        <footer className="p-4 text-center text-xs text-slate-400">
          Ting-A-Ling Schools · Meerensee, Richards Bay · 061 527 4429 · info@tingalingschools.com
        </footer>
      </div>
    </div>
  );
}
