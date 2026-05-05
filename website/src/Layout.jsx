import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a07baa661a7bdc51582ff/3e0084bba_35b41dbf-1767-4649-8e3b-2b1df0f996ed.jpeg"
                alt="Ting-A-Ling School"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Ting-A-Ling School</h1>
                <p className="text-sm text-slate-600">Enrollment Management</p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              {isStaff && (
                <Link to={createPageUrl('StaffDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Staff Dashboard
                  </Button>
                </Link>
              )}
              {!isAdmin && !isStaff && (
                <Link to={createPageUrl('MyContracts')}>
                  <Button variant="ghost" className="gap-2">
                    <FileText className="w-4 h-4" />
                    My Contracts
                  </Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
    </div>
  );
}