import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/store';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const AppLayout = ({ title, subtitle, actions, children }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const crumbs = location.pathname.split('/').filter(Boolean);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="lg:flex lg:min-h-screen">
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar onClose={() => setMobileMenuOpen(false)} />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex flex-1 flex-col">
          <TopNav onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Workspace</p>
                  <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
                  <p className="mt-2 text-slate-600">{subtitle}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    {crumbs.length === 0 ? 'Dashboard' : crumbs.map((crumb, idx) => (
                      <span key={crumb}>
                        {crumb.replace('-', ' ')}{idx < crumbs.length - 1 ? ' / ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="flex-shrink-0">{actions}</div>
              </div>
            </div>
            {user ? (
              <div className="mx-auto mt-6 w-full max-w-7xl">{children}</div>
            ) : (
              <div className="mx-auto mt-6 w-full max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">Loading authenticated content...</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
