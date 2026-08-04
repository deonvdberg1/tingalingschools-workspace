import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LogIn, GraduationCap } from 'lucide-react';
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
              <a
                href="https://app.autoeffortless.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Staff Login
                </Button>
              </a>
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
