import { useState, useEffect } from 'react';
import { Bell, Search, Menu, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../store/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-400 hover:text-white p-2"
        >
          <Menu size={24} />
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
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className={`text-xs font-semibold uppercase ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
             {isOnline ? 'System Nominal' : 'Offline Mode'}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-slate-900"></span>
        </button>
      </div>

      {/* Mobile Dropdown Overlay (Hamburger Menu) */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl p-6 md:hidden flex flex-col gap-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg ring-2 ring-blue-500/10">
              {user?.full_name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <p className="text-base font-bold text-white truncate">{user?.full_name || user?.username || 'Administrator'}</p>
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                {user?.role || 'Field Operator'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3 px-2 py-3">
                 {isOnline ? <Wifi size={18} className="text-emerald-500"/> : <WifiOff size={18} className="text-red-500"/>}
                 <span className="text-sm font-bold text-slate-300">
                    Network: {isOnline ? 'Online via API' : 'Disconnected'}
                 </span>
             </div>
             <button
               onClick={logout}
               className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl text-red-500 bg-red-500/10 border border-red-500/20 font-bold text-sm transition-all"
             >
               <LogOut size={18} />
               Sign Out Framework
             </button>
          </div>
        </div>
      )}
    </header>
  );
}
