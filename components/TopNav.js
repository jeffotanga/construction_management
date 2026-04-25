import React from 'react';
import { useAuthStore } from '../services/store';

const TopNav = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-soft">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Mobile menu button */}
        <div className="flex items-center gap-4 lg:hidden">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="hidden flex-1 items-center justify-start gap-4 px-4 lg:flex">
          <div className="relative w-full max-w-md flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search projects, workers, reports..."
              className="block w-full rounded-3xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-orange focus:ring-1 focus:ring-orange"
            />
          </div>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2z" />
            </svg>
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange text-xs font-semibold text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white text-sm font-semibold">
              {user?.first_name?.charAt(0) || 'G'}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-slate-900">{user?.first_name || 'Geofrey'}</div>
              <div className="text-xs text-slate-500">{user?.role?.replace('_', ' ') || 'Project Manager'}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;