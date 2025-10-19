'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Topbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Database-first mode - always show auth UI

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-64 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-6">
          {loading ? (
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : user ? (
            <div className="relative">
              <button
                data-testid="user-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900">{profile?.name || user.email}</div>
                  <div className="text-xs text-slate-500">{profile?.role || 'User'}</div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-900">{profile?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{profile?.role || 'No role'}</p>
                    <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    data-testid="logout-button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowUserMenu(false);
                      await handleSignOut();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
