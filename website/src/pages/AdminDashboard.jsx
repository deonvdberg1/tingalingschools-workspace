import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { XCircle, FileText, CalendarDays, ShoppingCart, Calendar, Banknote, Megaphone, LayoutDashboard, Users } from 'lucide-react';
import ContractsAdmin from '../components/admin/ContractsAdmin';
import LeaveAdmin from '../components/admin/LeaveAdmin';
import PurchaseAdmin from '../components/admin/PurchaseAdmin';
import AdminCalendar from '../components/admin/AdminCalendar';
import PaySlipsAdmin from '../components/admin/PaySlipsAdmin';
import AnnouncementsAdmin from '../components/admin/AnnouncementsAdmin';
import StaffAdmin from '../components/admin/StaffAdmin';

const SECTIONS = [
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'payslips', label: 'Pay Slips', icon: Banknote },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('staff');

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Denied</h2>
        <p className="text-slate-500">This area is for administrators only.</p>
      </div>
    );
  }

  const ActiveIcon = SECTIONS.find(s => s.id === activeSection)?.icon || LayoutDashboard;

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-slate-200 flex-shrink-0 p-3 gap-0.5">
        <div className="px-3 py-3 mb-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</span>
          </div>
        </div>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === s.id
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

      {/* Right side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile nav */}
        <div className="md:hidden bg-white border-b border-slate-200 flex overflow-x-auto gap-1 p-2 flex-shrink-0">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeSection === s.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
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
              <h1 className="text-xl font-bold text-slate-800">
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </h1>
            </div>

            {activeSection === 'staff' && <StaffAdmin />}
            {activeSection === 'contracts' && <ContractsAdmin />}
            {activeSection === 'leave' && <LeaveAdmin />}
            {activeSection === 'purchases' && <PurchaseAdmin />}
            {activeSection === 'calendar' && <AdminCalendar />}
            {activeSection === 'payslips' && <PaySlipsAdmin />}
            {activeSection === 'announcements' && <AnnouncementsAdmin />}
          </div>
        </main>
      </div>
    </div>
  );
}