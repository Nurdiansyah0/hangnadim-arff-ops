import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Flame, ClipboardCheck, ShieldAlert, Users, Truck, LogOut } from 'lucide-react';
import { useAuth } from '../../store/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const navItems = [
    { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { path: '/dashboard/incidents', label: 'Incidents & Watchroom', icon: Flame },
    { path: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
    { path: '/dashboard/vehicles', label: 'Assets & Vehicles', icon: Truck },
    { path: '/dashboard/personnel', label: 'Personnel & Shifts', icon: Users },
    { path: '/dashboard/audit', label: 'Audit & Compliance', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center ring-1 ring-blue-500/50">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="font-bold text-white leading-tight">AeroCommand</h2>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">ARFF Force</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 mb-4 px-3 uppercase tracking-wider">Operations</div>
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ActiveIcon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-slate-300 truncate">{user?.username}</p>
          <p className="text-xs text-slate-500">Operatif / {user?.role_id === 1 ? 'Admin' : 'Staff'}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
