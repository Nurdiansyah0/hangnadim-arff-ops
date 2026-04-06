import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Flame, 
  MapPin, 
  Users, 
  Truck, 
  ShieldAlert, 
  CloudSun,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Plane,
  BarChart3,
  Calendar
} from 'lucide-react';
import { api } from '../lib/axios';

interface DashboardStats {
  activeIncidents: number;
  readyVehicles: number;
  onDutyStaff: number;
  totalLogs: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeIncidents: 0,
    readyVehicles: 0,
    onDutyStaff: 0,
    totalLogs: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [inc, veh, staff, logs] = await Promise.all([
        api.get('/incidents'),
        api.get('/vehicles'),
        api.get('/personnel'),
        api.get('/watchroom')
      ]);

      setStats({
        activeIncidents: inc.data.filter((i: any) => !i.resolved_at).length,
        readyVehicles: veh.data.filter((v: any) => v.status === 'READY').length,
        onDutyStaff: staff.data.length, // Placeholder logic
        totalLogs: logs.data.length
      });
    } catch (err) {
      console.error('Failed to sync command center data');
    }
  };

  const kpis = [
    { 
      label: 'Active Alerts', 
      value: stats.activeIncidents, 
      icon: Flame, 
      color: 'bg-red-500', 
      trend: stats.activeIncidents > 0 ? '+ Emergency' : 'Standard'
    },
    { 
      label: 'Fleet Ready', 
      value: stats.readyVehicles, 
      icon: Truck, 
      color: 'bg-emerald-500', 
      trend: 'High Readiness'
    },
    { 
      label: 'On-Duty Force', 
      value: stats.onDutyStaff, 
      icon: Users, 
      color: 'bg-blue-500', 
      trend: 'Deployment Active'
    },
    { 
      label: 'Ops Records', 
      value: stats.totalLogs, 
      icon: ShieldAlert, 
      color: 'bg-purple-500', 
      trend: 'Audited'
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Top Banner: Status & Clock */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-8">
        <div>
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <MapPin size={18} className="text-blue-500" />
            <span className="font-bold tracking-widest text-[10px] uppercase">Hadi Nadim Int. Airport — BTH/WIDD</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic text-shadow-xl">
            Command <span className="text-blue-500">Center</span>
          </h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="text-3xl font-mono font-black text-white leading-none">
              {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="h-12 w-px bg-slate-800" />
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
             <CloudSun className="text-yellow-500" />
             <div className="text-sm font-bold text-slate-300">29°C <span className="text-slate-600 font-medium">BTH</span></div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="group bg-slate-900/40 hover:bg-slate-900/60 transition-all border border-slate-800 hover:border-slate-700 p-6 rounded-4xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
                <div className={`p-4 ${kpi.color} text-white rounded-2xl shadow-xl shadow-black/20`}>
                   <kpi.icon size={24} />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{kpi.label}</div>
             </div>
             <div className="text-4xl font-black text-white mb-2">{kpi.value}</div>
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <TrendingUp size={12} className={kpi.color === 'bg-red-500' ? 'text-red-500' : 'text-emerald-500'} />
                {kpi.trend}
             </div>
             <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${kpi.color} w-24 h-24 rounded-full blur-3xl`} />
          </div>
        ))}
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Live Operations Feed */}
         <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                 <Activity className="text-blue-500" />
                 Operational Heatmap
              </h2>
              <button 
                onClick={() => navigate('/watchroom')}
                className="text-[10px] font-bold text-slate-500 uppercase hover:text-white transition-colors"
              >
                View All Logs
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Activity Widget 1 */}
               <div className="bg-slate-950/50 border border-slate-800/50 p-6 rounded-3xl group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => navigate('/incidents')}>
                  <div className="flex items-center gap-3 mb-4">
                     <AlertTriangle className="text-orange-500" size={18} />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Incident</span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">Fuel spill reported at East Terminal Runway. Response team dispatched (Striker-1).</p>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
                     <span>14:32:01 UTC</span>
                     <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded">STATUS: ONGOING</span>
                  </div>
               </div>

               {/* Activity Widget 2 */}
               <div className="bg-slate-950/50 border border-slate-800/50 p-6 rounded-3xl group hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => navigate('/inspections')}>
                  <div className="flex items-center gap-3 mb-4">
                     <ClipboardCheck className="text-emerald-500" size={18} />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inspection Check</span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">Unit ARFF-02 completed morning safety inspection. All systems Nominal.</p>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
                     <span>08:15:22 UTC</span>
                     <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">STATUS: CLEARED</span>
                  </div>
               </div>
            </div>

            <div className="bg-blue-600 shadow-xl shadow-blue-500/20 rounded-3xl p-8 relative overflow-hidden group cursor-pointer" onClick={() => navigate('/analytics')}>
               <ShieldAlert className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform" />
               <div className="relative z-10 max-w-lg">
                  <h3 className="text-2xl font-black text-white mb-2 leading-tight uppercase tracking-tight italic">Readiness Alert: <span className="text-blue-100">Full Status</span></h3>
                  <p className="text-blue-100/80 text-sm font-medium mb-6">Semua unit armada dalam kondisi siaga 1. Koordinasi personil tercatat 100% pada shift siang ini.</p>
                  <button className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-blue-50 transition-all">Launch Performance Intel</button>
               </div>
            </div>
         </div>

         {/* Sidebar widgets */}
         <div className="space-y-8">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8">
               <h3 className="text-white font-bold mb-6 flex items-center justify-between text-sm uppercase tracking-widest">
                  Quick Tactical Actions
               </h3>
               <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Audit Log', icon: ShieldAlert, path: '/compliance' },
                    { label: 'FLT Watch', icon: Plane, path: '/flights' },
                    { label: 'Cuti / Leave', icon: Calendar, path: '/leave' },
                    { label: 'Assets', icon: Truck, path: '/vehicles' },
                  ].map((action, i) => (
                    <button 
                      key={i} 
                      onClick={() => navigate(action.path)}
                      className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 rounded-3xl transition-all gap-2 group"
                    >
                       <action.icon className="text-slate-500 group-hover:text-blue-500 transition-colors" size={20} />
                       <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest text-center">{action.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-4xl p-8 group overflow-hidden relative cursor-pointer" onClick={() => navigate('/analytics')}>
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                     <BarChart3 size={24} />
                  </div>
                  <div>
                     <div className="text-white font-bold leading-tight uppercase italic text-sm">V2 Service Pulse</div>
                     <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active & Secure</div>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                     <span>OPERATIONAL SYNC</span>
                     <span className="text-white">94% Stability</span>
                  </div>
               </div>
               <ChevronRight className="absolute bottom-4 right-4 text-slate-800 group-hover:text-white transition-colors" />
            </div>
         </div>
      </div>
    </div>
  );
}
