'use client';

import { Search, User } from 'lucide-react';

export default function Topbar() {
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
          <button className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 transition-colors">
            <User className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  );
}
