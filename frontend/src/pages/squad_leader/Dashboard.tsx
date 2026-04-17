import { useState, useEffect } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  ShieldCheck, 
  Activity,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Calendar
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

interface SquadSummary {
  active_personnel: number;
  pending_tasks: number;
  completed_tasks: number;
  readiness_percentage: number;
}

export default function SquadLeaderDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SquadSummary | null>(null);

  useEffect(() => {
    fetchSquadSummary();
  }, []);

  const fetchSquadSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get shift_id from operational context
      const contextRes = await api.get('/auth/me/context');
      const shiftId = contextRes.data.shift_id || 1; // Fallback to 1 if not assigned
      
      const res = await api.get(`/squad/summary?shift_id=${shiftId}&date=${today}`);
      setSummary(res.data);
    } catch (err: any) {
      console.error("Failed fetching squad summary", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Users className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
              Operational <span className="text-teal-200">Control</span>
            </h1>
            <p className="text-teal-100/80 font-medium max-w-xl text-sm md:text-base">
              Welcome to duty, {user?.full_name || user?.username}. Here is the readiness summary of your squad for this shift.
            </p>
          </div>
        </div>
        <ShieldCheck className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Squad Status Overview */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="Active Force" value={summary?.active_personnel || 0} unit="Personnel On Duty" icon={<Users className="text-blue-400" />} color="blue" />
              <SummaryCard title="Task Progress" value={summary?.completed_tasks || 0} unit={`/ ${((summary?.completed_tasks || 0) + (summary?.pending_tasks || 0))} Tasks Done`} icon={<ClipboardCheck className="text-emerald-400" />} color="emerald" />
              <SummaryCard title="Readiness" value={Math.round(summary?.readiness_percentage || 0)} unit="%" icon={<ShieldCheck className="text-orange-400" />} color="orange" />
           </div>

           <div className="bg-slate-900/40 border border-slate-800 rounded-4xl p-8">
              <h3 className="text-white font-bold mb-6 flex items-center gap-3">
                 <BarChart3 className="text-emerald-500" />
                 Squad Readiness Metric
              </h3>
              <div className="space-y-4">
                 <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${summary?.readiness_percentage || 0}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Low Readiness</span>
                    <span className="text-white">Current: {Math.round(summary?.readiness_percentage || 0)}%</span>
                    <span>Ready for Action</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-8">
           <div className="bg-slate-900 border border-slate-800 rounded-4xl p-8">
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Team Management</h3>
              <div className="space-y-3">
                 <button className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 rounded-2xl border border-slate-800 transition-all text-left">
                    <div className="flex items-center gap-3">
                       <Calendar size={18} className="text-blue-500" />
                       <span className="text-xs font-bold text-slate-300">Daily Roster</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                 </button>
                 <button className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 rounded-2xl border border-slate-800 transition-all text-left">
                    <div className="flex items-center gap-3">
                       <ShieldCheck size={18} className="text-emerald-500" />
                       <span className="text-xs font-bold text-slate-300">Task Validations</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                 </button>
                 <button className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 rounded-2xl border border-slate-800 transition-all text-left">
                    <div className="flex items-center gap-3">
                       <Activity size={18} className="text-orange-500" />
                       <span className="text-xs font-bold text-slate-300">Shift Performance</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                 </button>
              </div>
           </div>

           <div className="bg-red-500/10 border border-red-500/20 rounded-4xl p-8">
              <div className="flex items-center gap-3 mb-4">
                 <AlertTriangle size={20} className="text-red-500" />
                 <h4 className="text-sm font-black uppercase tracking-widest text-red-500">Emergency Alerts</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Regularly check the latest incident logs to ensure team coordination remains optimal.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}

function SummaryCard({ title, value, unit, icon }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-4xl">
       <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
             {icon}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</div>
       </div>
       <div className="text-3xl font-black text-white mb-1">{value}{unit === '%' && '%'}</div>
       <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{unit === '%' ? 'Readiness Score' : unit}</div>
    </div>
  );
}
