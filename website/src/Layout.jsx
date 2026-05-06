import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { LogOut, FileText, LogIn, LayoutDashboard, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isParent = user?.role === 'parent';
  const isStaff = user?.role === 'staff';
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.png"
                alt="Ting-A-Ling Schools"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Ting-A-Ling Schools</h1>
                <p className="text-sm text-slate-600">Pre-Primary · English Nurturing · Special Needs</p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              {isStaff && (
                <Link to={createPageUrl('StaffDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Staff Portal
                  </Button>
                </Link>
              )}
              {isParent && (
                <Link to={createPageUrl('ParentDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <User className="w-4 h-4" />
                    My Portal
                  </Button>
                </Link>
              )}
              {isLoggedIn ? (
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                !loading && (
                  <Link to={createPageUrl('Login')}>
                    <Button variant="outline" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Staff Login
                    </Button>
                  </Link>
                )
              )}
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