import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LogIn, GraduationCap, School } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
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
              <Link to={createPageUrl('Apply')}>
                <Button variant="outline" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Apply Now
                </Button>
              </Link>
              <Link to="/teacher">
                <Button variant="outline" className="gap-2">
                  <School className="w-4 h-4" />
                  Teacher Login
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Staff &amp; Parent Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p>&copy; 2026 Ting-A-Ling Schools &middot; Meerensee, Richards Bay</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/terms" className="hover:text-white underline-offset-2 hover:underline">
              Terms and Conditions
            </Link>
            <Link to="/refund-policy" className="hover:text-white underline-offset-2 hover:underline">
              Refund and Cancellation Policy
            </Link>
            <a href="mailto:info@tingalingschools.com" className="hover:text-white underline-offset-2 hover:underline">
              info@tingalingschools.com
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
