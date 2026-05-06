import React, { useState, useEffect } from 'react';
import { auth } from '@/supabase/auth';
import { XCircle, FileText, CalendarDays, ShoppingCart, Calendar, Banknote, Megaphone, LayoutDashboard, Users } from 'lucide-react';
import ContractsAdmin from '../components/admin/ContractsAdmin';
import LeaveAdmin from '../components/admin/LeaveAdmin';
import PurchaseAdmin from '../components/admin/PurchaseAdmin';
import AdminCalendar from '../components/admin/AdminCalendar';
import PaySlipsAdmin from '../components/admin/PaySlipsAdmin';
import AnnouncementsAdmin from '../components/admin/AnnouncementsAdmin';
import StaffAdmin from '../components/admin/StaffAdmin';

const SUPERADMIN_SECTIONS = [
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'payslips', label: 'Pay Slips', icon: Banknote },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

const ADMIN_SECTIONS = [
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('calendar');

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Please Log In</h2>
        <p className="text-slate-500 mb-4">You need to be logged in to access the dashboard.</p>
        <a href="/Login" className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Go to Login</a>
      </div>
    );
  }

  const isSuperadmin = user.role === 'superadmin';
  const sections = isSuperadmin ? SUPERADMIN_SECTIONS : ADMIN_SECTIONS;
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];
  const ActiveIcon = currentSection.icon;

  const renderSection = () => {
    const sec = currentSection.id;
    if (sec === 'staff') return <StaffAdmin />;
    if (sec === 'contracts') return <ContractsAdmin />;
    if (sec === 'leave') return <LeaveAdmin />;
    if (sec === 'purchases') return <PurchaseAdmin />;
    if (sec === 'calendar') return <AdminCalendar />;
    if (sec === 'payslips') return <PaySlipsAdmin />;
    if (sec === 'announcements') return <AnnouncementsAdmin />;
    return null;
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-slate-200 flex-shrink-0 p-3 gap-0.5">
        <div className="px-3 py-3 mb-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isSuperadmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                s.id === currentSection.id
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
          );
        })}
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile nav */}
        <div className="md:hidden bg-white border-b border-slate-200 flex overflow-x-auto gap-1 p-2 flex-shrink-0">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  s.id === currentSection.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <ActiveIcon className="w-5 h-5 text-teal-600" />
              <h1 className="text-xl font-bold text-slate-800">{currentSection.label}</h1>
            </div>
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
