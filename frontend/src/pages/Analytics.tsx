import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  Loader2,
  Clock,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardCheck,
  Zap
} from 'lucide-react';
import { api } from '../lib/axios';

interface KpiReport {
  code: string;
  name: string;
  value: number;
  unit: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  trend: number | null;
  regulation_ref: string | null;
}

export default function Analytics() {
  const [kpis, setKpis] = useState<KpiReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      const res = await api.get('/analytics/kpis');
      setKpis(res.data);
    } catch (err) {
      console.error('Failed to fetch KPIs');
    } finally {
      setLoading(false);
    }
  };

  const getKpiIcon = (code: string) => {
    switch (code) {
      case 'RESPONSE_TIME': return Clock;
      case 'VEHICLE_READINESS': return Truck;
      case 'INSPECTION_COMPLETION': return ClipboardCheck;
      case 'CERT_COMPLIANCE': return ShieldCheck;
      case 'FOAM_STOCK_RATIO': return Zap;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'emerald';
      case 'YELLOW': return 'amber';
      case 'RED': return 'rose';
      default: return 'slate';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
        <span className="font-black uppercase tracking-[0.3em] text-xs">Syncing Regulatory Metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
            <BarChart3 className="text-blue-500" size={36} />
            Command KPI Dashboard
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">Regulatory Compliance Monitoring based on **PR 30 Tahun 2022**</p>
        </div>
        
        <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
           <div className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">Real-time Watch</div>
           <div className="px-6 py-2 text-slate-500 hover:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-widest">Historical Trends ON</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {kpis.map((kpi, i) => {
           const Icon = getKpiIcon(kpi.code);
           const color = getStatusColor(kpi.status);
           const isPositiveTrend = kpi.trend !== null && kpi.trend > 0;
           
           return (
             <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-4xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
                <Icon className={`absolute -right-6 -bottom-6 w-32 h-32 text-slate-800 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform`} />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{kpi.name}</div>
                  {kpi.regulation_ref && (
                    <div className="text-[8px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {kpi.regulation_ref}
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4 relative z-10">
                  <div className="text-5xl font-black text-white tracking-tighter">
                    {kpi.code === 'RESPONSE_TIME' 
                      ? (kpi.value ? `${Math.floor(kpi.value / 60)}m ${Math.round(kpi.value % 60)}s` : '0m 0s') 
                      : `${(kpi.value || 0).toFixed(1)}${kpi.unit}`
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className={`flex items-center gap-2 text-[10px] font-black text-${color}-500 uppercase tracking-widest`}>
                    <div className={`w-3 h-3 rounded-full bg-${color}-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse`} />
                    {kpi.status}
                  </div>

                  {kpi.trend !== null && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${isPositiveTrend ? (kpi.code === 'RESPONSE_TIME' ? 'text-rose-500' : 'text-emerald-500') : (kpi.code === 'RESPONSE_TIME' ? 'text-emerald-500' : 'text-rose-500')}`}>
                      {isPositiveTrend ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                      {Math.abs(kpi.trend).toFixed(1)}%
                      <span className="text-[8px] text-slate-500 ml-1 uppercase">vs Last Month</span>
                    </div>
                  )}
                </div>
             </div>
           );
         })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-10 space-y-10 group overflow-hidden relative">
            <div className="flex items-center justify-between relative z-10">
               <h3 className="text-xl font-bold text-white flex items-center gap-3 italic uppercase tracking-tighter">
                  <Activity className="text-blue-500" />
                  Fleet Readiness Analysis
               </h3>
               <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Live Syncing</span>
            </div>
            
            <div className="space-y-6 relative z-10">
               {[
                 { label: 'Heavy Pressure Foam Tender (Striker)', rate: 94, color: 'emerald' },
                 { label: 'Medium Pressure Foam Tender (Rosenbauer)', rate: 82, color: 'blue' },
                 { label: 'Tactical Ambulance Support', rate: 100, color: 'purple' },
                 { label: 'Rapid Intervention Vehicle', rate: 75, color: 'orange' }
               ].map((item, i) => (
                 <div key={i} className="space-y-3 group/row">
                    <div className="flex justify-between items-end">
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</div>
                       <div className={`text-xl font-black text-${item.color}-500 italic`}>{item.rate}%</div>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                       <div className={`h-full bg-${item.color}-500 rounded-full transition-all duration-[1.5s]`} style={{ width: `${item.rate}%` }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-10 space-y-8 group overflow-hidden relative">
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 italic uppercase tracking-tighter">
                   <AlertTriangle className="text-amber-500" />
                   High-Priority Alerts
                </h3>
             </div>
             
             <div className="space-y-4 relative z-10">
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                  <div className="w-1.5 h-12 bg-rose-500 rounded-full mt-1" />
                  <div>
                    <div className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Critical Supply Low</div>
                    <div className="text-sm text-slate-300">Foam concentration in Category 9 Fleet is below PR 30/2022 minimum mandatory level. Procuring required immediately.</div>
                  </div>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                  <div className="w-1.5 h-12 bg-amber-500 rounded-full mt-1" />
                  <div>
                    <div className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Inspection Overdue</div>
                    <div className="text-sm text-slate-300">3 Fire Extinguisher units at Passenger Terminal North-Gate have passed their 30-day inspection cycle.</div>
                  </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
