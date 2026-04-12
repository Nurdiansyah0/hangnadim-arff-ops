import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  ClipboardCheck,
  ShieldAlert,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  Truck,
  Calendar,
  ShieldCheck,
  Plane,
  CloudUpload,
  History,
  BarChart3,
  Wifi,
  WifiOff,
  Wrench,
  Clock
} from 'lucide-react';
import { useAuth } from '../../store/useAuth';

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  roleLimit?: number[];
  children?: NavItem[];
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

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

  // Sync open state with active route — desktop only.
  // On mobile the bottom popup should close immediately after navigation,
  // so we reset all open menus on every route change.
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Close all popup menus whenever the route changes
      setOpenMenus({});
      return;
    }
    // Desktop: auto-expand parent menu if a child route is active
    const currentPath = location.pathname;
    navItems.forEach(item => {
      if (item.children?.some(child => child.path === currentPath)) {
        setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const navItems: NavItem[] = [
    {
      path: user?.role_id === 9 || user?.role_id === 8 ? '/staff/dashboard' : '/dashboard',
      label: user?.role_id === 9 || user?.role_id === 8 ? 'Field Dashboard' : 'Tactical Dashboard',
      icon: LayoutDashboard
    },
    { path: '/analytics', label: 'Performance Intel', icon: BarChart3, roleLimit: [1, 2, 3, 4, 5, 6, 7] },
    { path: '/flights', label: 'Flight Watch', icon: Plane, roleLimit: [1, 2, 3, 4, 5, 6, 7] },
    { path: '/my-tasks', label: 'My Daily Tasks', icon: ClipboardCheck, roleLimit: [8, 9, 10, 11] },
    { path: '/shift-approval', label: 'Daily Shift Report', icon: ClipboardCheck, roleLimit: [4, 5, 6] },
    { path: '/incidents', label: 'Incidents Log', icon: Flame, roleLimit: [1, 2, 3, 4, 5, 6, 7] },
    {
      label: 'Inspections',
      icon: ClipboardCheck,
      children: [
        { path: '/inspections', label: 'Vehicle Audit', icon: Truck },
        { path: '/fire-extinguishers', label: 'APAR Audit', icon: Flame },
      ]
    },
    { path: '/maintenance/request', label: 'Request Maintenance', icon: Wrench, roleLimit: [8, 9] },
    { path: '/watchroom', label: 'Watchroom Journal', icon: ShieldAlert, roleLimit: [1, 2, 3, 4, 5, 6, 7] },
    { path: '/roster', label: 'Duty Matrix', icon: Calendar, roleLimit: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { path: '/shifts', label: 'Shifts & Rotation', icon: Clock, roleLimit: [1, 2, 3, 4, 5, 6, 7] },
    { path: '/compliance', label: 'Safety & Compliance', icon: ShieldCheck, roleLimit: [1, 2, 3, 4, 5, 6, 7] },
    { path: '/leave', label: user?.role_id === 9 || user?.role_id === 8 ? 'Request Leave' : 'Leave Management', icon: Calendar },
    { path: '/users', label: 'Personnel Master', icon: Users, roleLimit: [1, 7] },
    { path: '/assets', label: 'Asset Fleet', icon: Truck, roleLimit: [1, 2, 3, 4, 5, 6] },
    { path: '/audit-trail', label: 'System Audit Trail', icon: History, roleLimit: [1] },
  ];

  const renderLink = (item: NavItem, isChild = false) => {
    const ActiveIcon = item.icon;
    const isActive = item.path ? (location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/') || (item.path === '/staff/dashboard' && location.pathname === '/')) : false;

    return (
      <Link
        key={item.path}
        to={item.path!}
        className={`flex items-center justify-between group rounded-2xl transition-all duration-300 border ${isChild ? 'px-4 py-3 md:px-4 md:py-2.5 md:ml-9 mb-1' : 'px-4 py-3.5'
          } ${isActive
            ? 'bg-blue-500/10 md:bg-blue-600 md:text-white text-blue-400 border border-blue-500/20 md:border-blue-500 shadow-none md:shadow-lg md:shadow-blue-600/20'
            : 'text-slate-400 md:border-transparent md:hover:text-white hover:text-blue-400 hover:bg-slate-800 md:hover:bg-slate-800/50 md:hover:border-slate-700'
          }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
          <ActiveIcon size={isChild ? 18 : 24} className={isActive ? 'text-blue-400 md:text-white drop-shadow-md md:drop-shadow-none' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
          <span className={`font-medium ${isChild ? 'text-xs md:text-xs text-center md:text-left mt-1 md:mt-0 tracking-wide' : 'text-[9px] md:text-sm text-center md:text-left'} ${isActive ? 'font-black md:font-medium' : ''}`}>{item.label}</span>
        </div>
        {isActive && !isChild && <ChevronRight size={14} className="hidden md:block opacity-50" />}
        {isActive && isChild && <div className="hidden md:block w-1 h-1 bg-white rounded-full" />}
      </Link>
    );
  };

  return (
    <aside className="
      fixed bottom-0 left-0 w-full h-18 pb-[env(safe-area-inset-bottom)] flex flex-row border-t border-slate-800/60 z-50
      md:w-72 md:h-screen md:pb-0 md:flex-col md:border-r md:border-t-0 md:sticky md:top-0
      bg-slate-900/90 md:bg-slate-900/80 backdrop-blur-xl md:backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-none
    ">
      {/* Brand Logo Section (Desktop Only) */}
      <div className="hidden md:flex p-8 border-b border-slate-800/50 items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center ring-1 ring-blue-500/40 shadow-lg shadow-blue-900/20">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-white tracking-tight leading-none">SIOPEL</h2>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">ARFF V2.9 OPS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-row md:flex-col px-1 py-1 md:p-6 gap-2 md:space-y-2 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto custom-scrollbar items-center md:items-stretch">
        <div className="hidden md:block text-[10px] font-bold text-slate-500 mb-6 px-4 uppercase tracking-[0.3em]">Operational Menu</div>

        {navItems.filter(item => !item.roleLimit || item.roleLimit.includes(user?.role_id || 0)).map((item) => {
          if (item.children) {
            const isOpen = openMenus[item.label];
            const hasActiveChild = item.children.some(child => child.path === location.pathname);
            const ParentIcon = item.icon;

            return (
              <div key={item.label} className="space-y-1 shrink-0 relative group/mobile">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex flex-col md:flex-row items-center justify-between group px-3 py-2 md:px-4 md:py-3.5 rounded-2xl transition-all duration-300 md:border ${hasActiveChild
                      ? 'text-blue-400 md:border-blue-500/20 md:bg-blue-500/5'
                      : 'text-slate-500 md:text-slate-400 md:border-transparent hover:text-blue-400 md:hover:text-white md:hover:bg-slate-800/50 md:hover:border-slate-700'
                    }`}
                >
                  <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                    <ParentIcon size={24} className={hasActiveChild ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
                    <span className="font-medium text-[9px] md:text-sm text-center md:text-left">{item.label}</span>
                  </div>
                  {isOpen ? <ChevronDown size={14} className="hidden md:block opacity-50" /> : <ChevronRight size={14} className="hidden md:block opacity-50" />}
                </button>

                {isOpen && (
                  <>
                    {/* Mobile: horizontal icon-only pills */}
                    <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-100 flex flex-row gap-3 md:hidden animate-in fade-in zoom-in-75 duration-150">
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        const childActive = location.pathname === child.path;
                        return (
                          <button
                            key={child.path}
                            onClick={() => {
                              toggleMenu(item.label);
                              navigate(child.path!);
                            }}
                            className={`flex flex-col items-center justify-center w-20 h-20 rounded-3xl border-2 transition-all duration-200 shadow-2xl shadow-black/60 active:scale-95 ${childActive
                                ? 'bg-blue-600 border-blue-400 text-white shadow-blue-600/30'
                                : 'bg-slate-800/95 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white'
                              }`}
                          >
                            <ChildIcon size={32} className={childActive ? 'text-white' : ''} />
                          </button>
                        );
                      })}
                    </div>
                    {/* Backdrop to close on outside tap */}
                    <div
                      className="fixed inset-0 z-99 md:hidden"
                      onClick={() => toggleMenu(item.label)}
                    />

                    {/* Desktop: vertical list (unchanged) */}
                    <div className="hidden md:flex flex-col gap-1">
                      {item.children.map(child => renderLink(child, true))}
                    </div>
                  </>
                )}
              </div>
            );
          }

          return (
            <div key={item.path} className="shrink-0">
              {renderLink(item)}
            </div>
          );
        })}
      </nav>

      {/* User Profile & Logout Section (Desktop Only) */}
      <div className="hidden md:block p-6 border-t border-slate-800/50 bg-slate-900/40">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs ring-2 ring-blue-500/10">
            {user?.full_name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.full_name || user?.username || 'Administrator'}</p>
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
              {user?.position || user?.role || 'Field Operator'}
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

        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 ${isOnline
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
