import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Activity, 
  ShieldCheck, 
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../lib/axios';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/performance');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
        <span className="font-black uppercase tracking-[0.3em] text-xs">Compiling tactical metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
            <BarChart3 className="text-blue-500" size={36} />
            Performance Intel
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">Operational speed, consistency, and resource efficiency</p>
        </div>
        
        <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
           <div className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">Last 30 Days</div>
           <div className="px-6 py-2 text-slate-500 hover:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-widest">Q2-2026 Archive</div>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         {[
           { label: 'Avg Resp Time', value: '2m 14s', icon: Clock, color: 'emerald', trend: 'Optimal' },
           { label: 'Resolve Efficiency', value: '98.2%', icon: Activity, color: 'blue', trend: 'High Force' },
           { label: 'SOP Compliance', value: '100%', icon: ShieldCheck, color: 'purple', trend: 'Certified' },
           { label: 'Deployment Ready', value: data?.personnel_count || '24', icon: TrendingUp, color: 'emerald', trend: '+2 Standby' }
         ].map((kpi, i) => (
           <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-4xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
              <kpi.icon className={`absolute -right-6 -bottom-6 w-32 h-32 text-slate-800 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform`} />
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">{kpi.label}</div>
              <div className="text-5xl font-black text-white mb-2 tracking-tighter">{kpi.value}</div>
              <div className={`flex items-center gap-1.5 text-[10px] font-black text-${kpi.color}-500 uppercase tracking-widest`}>
                 <div className={`w-2 h-2 rounded-full bg-${kpi.color}-500 animate-pulse`} />
                 {kpi.trend} Status
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Custom Visual Intelligence Widget: Incident Frequency */}
         <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-10 space-y-10 group overflow-hidden relative">
            <Layers className="absolute -left-12 -top-12 w-48 h-48 text-blue-500/5 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between relative z-10">
               <h3 className="text-xl font-bold text-white flex items-center gap-3 italic uppercase tracking-tighter">
                  <Activity className="text-blue-500" />
                  Weekly Incident Pulse
               </h3>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">Frequency Distribution</span>
            </div>
            
            <div className="h-72 flex items-end gap-5 px-2 pb-2 relative z-10">
               <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-slate-800 pointer-events-none p-4">
                  {[1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-800/30 border-dashed" />)}
               </div>
               {[40, 75, 45, 95, 65, 35, 55].map((height, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                    <div className="w-full bg-slate-950/50 rounded-2xl relative overflow-hidden flex items-end h-full ring-1 ring-white/5 shadow-inner">
                       <div className="w-full bg-linear-to-t from-blue-600 via-blue-500 to-blue-400 rounded-2xl transition-all duration-1000 origin-bottom group-hover/bar:brightness-125 shadow-[0_0_20px_rgba(37,99,235,0.2)]" style={{ height: `${height}%` }}>
                          <div className="absolute top-0 right-0 left-0 bg-white/20 h-full w-[1.5px] mx-auto opacity-30 group-hover/bar:opacity-60 transition-opacity" />
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 group-hover/bar:text-white transition-colors uppercase tracking-widest">{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i]}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Readiness Indicator: Fleet Health */}
         <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-10 space-y-10 group overflow-hidden relative">
             <ShieldCheck className="absolute -right-12 -top-12 w-48 h-48 text-emerald-500/5 group-hover:rotate-12 transition-transform" />
             <div className="flex items-center justify-between relative z-10">
               <h3 className="text-xl font-bold text-white flex items-center gap-3 italic uppercase tracking-tighter">
                  <Calendar className="text-emerald-500" />
                  Resource Readiness Level
               </h3>
               <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Live Syncing</span>
            </div>
            
            <div className="space-y-8 relative z-10">
               {[
                 { label: 'Category 9 (Oshkosh Striker)', rate: 94, color: 'emerald' },
                 { label: 'Category 6 (Rosenbauer)', rate: 82, color: 'blue' },
                 { label: 'Tactical Support (Ambulance)', rate: 100, color: 'purple' },
                 { label: 'Rapid Response (Nurse)', rate: 75, color: 'orange' }
               ].map((item, i) => (
                 <div key={i} className="space-y-4 group/row">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/row:text-slate-300 transition-colors">{item.label}</div>
                          <div className="text-sm font-bold text-white tracking-tight">Deployment Ready</div>
                       </div>
                       <div className={`text-xl font-black text-${item.color}-500 italic`}>{item.rate}%</div>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 p-[3px] shadow-inner">
                       <div className={`h-full bg-${item.color}-500 rounded-full transition-all duration-[1.5s] relative group-hover/row:brightness-110 shadow-lg`} style={{ width: `${item.rate}%` }}>
                          <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent" />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
