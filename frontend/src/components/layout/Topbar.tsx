import { Bell, Search, Menu } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle placeholder */}
        <button className="md:hidden text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
        
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search command center..." 
            className="bg-slate-950 border border-slate-800 text-sm text-slate-300 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-emerald-500 uppercase">System Nominal</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
        </button>
      </div>
    </header>
  );
}
