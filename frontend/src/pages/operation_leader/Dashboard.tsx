import { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity,
  ChevronRight,
  BarChart3,
  Plane,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

interface OperationSummary {
  active_personnel: number;
  pending_approvals: number;
  active_flights: number;
  overall_readiness: number;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'approval' | 'flight' | 'alert';
}

interface SummaryCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export default function OperationLeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OperationSummary | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const fetchOperationSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/operation/summary');
      setSummary(res.data.summary);
      setActivities(res.data.activities);
    } catch (err: any) {
      console.error("Failed fetching operation summary", err);
      setError("Unable to sync real-time operational metrics. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationSummary();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchOperationSummary} />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-blue-700 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
              Operation <span className="text-blue-300">Command</span>
            </h1>
            <p className="text-blue-100/80 font-medium max-w-xl text-sm md:text-base">
              Welcome back, {user?.full_name || user?.username}. Your operational overview is ready. Oversee readiness, active flights, and team approvals below.
            </p>
          </div>
        </div>
        <ShieldCheck className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Operation Status Overview */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                title="Active Personnel" 
                value={summary?.active_personnel || 0} 
                unit="On Duty" 
                icon={<Users className="text-blue-400" />} 
              />
              <SummaryCard 
                title="Pending Approvals" 
                value={summary?.pending_approvals || 0} 
                unit="Requests" 
                icon={<ClipboardList className="text-orange-400" />} 
                onClick={() => navigate('/shift-approval')}
              />
              <SummaryCard 
                title="Overall Readiness" 
                value={Math.round(summary?.overall_readiness || 0)} 
                unit="%" 
                icon={<CheckCircle2 className="text-emerald-400" />} 
              />
           </div>
           

           {/* Global Readiness Metric */}
           <div className="bg-slate-900/40 border border-slate-800 rounded-4xl p-8 backdrop-blur-sm relative group overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h3 className="text-white font-bold mb-6 flex items-center gap-3 relative z-10">
                 <BarChart3 className="text-blue-500" />
                 Global Readiness Metric
              </h3>
              <div className="space-y-4 relative z-10">
                 <div className="h-4 w-full bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div 
                      className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                      style={{ width: `${summary?.overall_readiness || 0}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-1"><AlertCircle size={10} className="text-red-500" /> Critical</span>
                    <span className="text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Current: {Math.round(summary?.overall_readiness || 0)}%</span>
                    <span className="flex items-center gap-1">Optimal <CheckCircle2 size={10} className="text-emerald-500" /></span>
                 </div>
              </div>
           </div>

           {/* Recent Activity Section */}
           <div className="bg-slate-900/40 border border-slate-800 rounded-4xl p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-white font-bold flex items-center gap-3">
                   <Clock className="text-blue-500" />
                   Recent Activities
                </h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group">
                    <div className={`mt-1 p-2 rounded-lg ${
                      activity.type === 'approval' ? 'bg-emerald-500/10 text-emerald-500' :
                      activity.type === 'flight' ? 'bg-indigo-500/10 text-indigo-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {activity.type === 'approval' && <CheckCircle2 size={16} />}
                      {activity.type === 'flight' && <Plane size={16} />}
                      {activity.type === 'alert' && <AlertCircle size={16} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-200">{activity.user}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {activity.time.includes('-') ? formatTimeAgo(activity.time) : activity.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{activity.action}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="py-12 text-center bg-slate-950/20 rounded-2xl border-2 border-dashed border-slate-800/50">
                    <div className="text-slate-600 font-black uppercase tracking-widest text-[10px] italic">No recent activities found</div>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-8">
           <div className="bg-slate-900 border border-slate-800 rounded-4xl p-8">
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Command Actions</h3>
              <div className="space-y-3">
                 <Link to="/roster" className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] rounded-2xl border border-slate-800 transition-all text-left group">
                    <div className="flex items-center gap-3">
                       <Users size={18} className="text-blue-500" />
                       <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Manage Roster</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </Link>
                 <Link to="/shift-approval" className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] rounded-2xl border border-slate-800 transition-all text-left group">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={18} className="text-emerald-500" />
                       <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Shift Approvals</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </Link>
                 <Link to="/flights" className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] rounded-2xl border border-slate-800 transition-all text-left group">
                    <div className="flex items-center gap-3">
                       <Plane size={18} className="text-indigo-500" />
                       <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Flight Schedules</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </Link>
              </div>
           </div>

           <div className="bg-blue-500/10 border border-blue-500/20 rounded-4xl p-8 group overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-500/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-3 mb-4">
                 <Activity size={20} className="text-blue-500 animate-pulse" />
                 <h4 className="text-sm font-black uppercase tracking-widest text-blue-500">Operational Updates</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-6">
                Ensure rosters are updated and shift handovers are approved in a timely manner to maintain optimal readiness.
              </p>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                View Reports <ArrowRight size={12} />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}

function SummaryCard({ title, value, unit, icon, onClick }: SummaryCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 p-6 rounded-4xl transition-all group ${onClick ? 'cursor-pointer hover:border-slate-700 hover:scale-[1.05] active:scale-95' : 'cursor-default hover:border-slate-800'}`}
    >
       <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:bg-slate-800 group-hover:border-slate-600 transition-colors">
             {icon}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">{title}</div>
       </div>
       <div className="text-3xl font-black text-white mb-1 group-hover:text-blue-100 transition-colors">{value}{unit === '%' && '%'}</div>
       <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-500 transition-colors">{unit === '%' ? 'Readiness Score' : unit}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Banner Skeleton */}
      <div className="h-64 bg-slate-800/50 rounded-[2.5rem] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-slate-700/10 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-slate-800/50 rounded-4xl animate-pulse" />
            ))}
          </div>
          {/* Metric Bar Skeleton */}
          <div className="h-48 bg-slate-800/50 rounded-4xl animate-pulse" />
          {/* Activities Skeleton */}
          <div className="h-64 bg-slate-800/50 rounded-4xl animate-pulse" />
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-8">
          <div className="h-80 bg-slate-800/50 rounded-4xl animate-pulse" />
          <div className="h-40 bg-slate-800/50 rounded-4xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-full">
        <AlertCircle size={48} className="text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Operational Sync Failed</h2>
        <p className="text-slate-400 max-w-md mx-auto">{message}</p>
      </div>
      <button 
        onClick={onRetry}
        className="flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-white font-bold transition-all hover:scale-105 active:scale-95"
      >
        <RefreshCcw size={18} className="text-blue-500" />
        Retry Connection
      </button>
    </div>
  );
}
