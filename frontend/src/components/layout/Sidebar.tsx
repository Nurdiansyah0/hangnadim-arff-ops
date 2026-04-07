import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  ClipboardCheck,
  ShieldAlert,
  Users,
  LogOut,
  ChevronRight,
  Truck,
  Calendar,
  ShieldCheck,
  Plane,
  BarChart3,
  Wifi,
  WifiOff,
  CloudUpload
} from 'lucide-react';
import { useAuth } from '../../store/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
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

  // Navigasi disesuaikan dengan rute di App.tsx
  const navItems = [
    { path: '/dashboard', label: 'Tactical Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Performance Intel', icon: BarChart3 },
    { path: '/flights', label: 'Flight Watch', icon: Plane },
    { path: '/incidents', label: 'Incidents Log', icon: Flame },
    { path: '/inspections', label: 'Vehicle Inspections', icon: ClipboardCheck },
    { path: '/watchroom', label: 'Watchroom Journal', icon: ShieldAlert },
    { path: '/shifts', label: 'Shifts & Rotation', icon: Calendar },
    { path: '/compliance', label: 'Safety & Compliance', icon: ShieldCheck },
    { path: '/leave', label: 'Leave Management', icon: Calendar },
    { path: '/personnel', label: 'Personnel Master', icon: Users },
    { path: '/users', label: 'Force Personnel', icon: Users },
    { path: '/assets', label: 'Asset Fleet', icon: Truck },
    { path: '/fire-extinguishers', label: 'Fire Extinguishers', icon: Flame },
  ];

  return (
    <aside className="w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40">
      {/* Brand Logo Section */}
      <div className="p-8 border-b border-slate-800/50 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center ring-1 ring-blue-500/40 shadow-lg shadow-blue-900/20">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-white tracking-tight leading-none">SIOPEL</h2>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">ARFF V2.9 OPS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-500 mb-6 px-4 uppercase tracking-[0.3em]">Operational Menu</div>

        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-300 border ${isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50 hover:border-slate-700'
                }`}
            >
              <div className="flex items-center gap-3">
                <ActiveIcon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-6 border-t border-slate-800/50 bg-slate-900/40">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs ring-2 ring-blue-500/10">
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.username || 'Administrator'}</p>
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
              {user?.role_id === 1 ? 'System Admin' : 'Field Operator'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 font-semibold text-sm group mb-4"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Sign Out System
        </button>

        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 ${
          isOnline 
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
          : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'
        }`}>
           <div className="flex items-center gap-3">
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isOnline ? 'Network: Online' : 'Network: Offline'}
              </span>
           </div>
           {isOnline && <CloudUpload size={14} className="opacity-40" />}
        </div>
      </div>
    </aside>
  );
}
