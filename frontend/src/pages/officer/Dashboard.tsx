import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Timer,
  Dumbbell,
  Footprints,
  ShieldAlert,
  Truck,
  ClipboardCheck,
  ChevronRight,
  Zap,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';
import toast from 'react-hot-toast';

// ============================================================================
// 1. TYPING EKSPLISIT: Mencegah AI menebak struktur data
// ============================================================================

export interface FitnessTest {
  test_date: string;
  run_12min_meters: number;
  shuttle_run_seconds: number;
  pull_ups: number;
  sit_ups: number;
  push_ups: number;
}

export interface FitnessTrend {
  current: FitnessTest;
  previous: FitnessTest | null;
}

export interface OperationalContext {
  assigned_vehicle: string | null;
  duty_position: string | null;
  duty_status: string;
}

export interface Task {
  task_id: string;
  task_name: string;
  task_description: string;
  status: string;
}

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function OfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [trends, setTrends] = useState<FitnessTrend | null>(null);
  const [context, setContext] = useState<OperationalContext | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetch data menggunakan Promise.allSettled.
   * Struktur linier (tanpa nested try-catch) mencegah AI merusak blok logika.
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [fitnessRes, contextRes, tasksRes] = await Promise.allSettled([
        api.get<FitnessTrend>('/fitness/me/trend'),
        api.get<OperationalContext>('/auth/me/context'),
        api.get<Task[]>(`/tasks/my-tasks?date=${today}`)
      ]);

      let failedCount = 0;

      if (fitnessRes.status === 'fulfilled') {
        setTrends(fitnessRes.value.data);
      } else {
        console.warn("Fitness data fetch failed:", fitnessRes.reason);
        failedCount++;
      }

      if (contextRes.status === 'fulfilled') {
        setContext(contextRes.value.data);
      } else {
        console.warn("Context data fetch failed:", contextRes.reason);
        failedCount++;
      }

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value.data);
      } else {
        console.warn("Tasks data fetch failed:", tasksRes.reason);
        failedCount++;
      }

      if (failedCount === 3) {
        setError(true);
        toast.error("Gagal memuat data dashboard. Silakan coba lagi.");
      } else if (failedCount > 0) {
        toast.error("Beberapa data gagal dimuat.");
      }
      
    } catch (err: unknown) {
      console.error("General dashboard error", err);
      setError(true);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError onRetry={fetchDashboardData} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <DashboardWelcomeBanner user={user} context={context} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DashboardFitnessTrends trends={trends} />
        <DashboardTasksList tasks={tasks} onNavigate={(path) => navigate(path)} />
      </div>
    </div>
  );
}

// ============================================================================
// 3. AUXILIARY COMPONENTS: Loading & Error States
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-64 bg-slate-800/50 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-64 bg-slate-800/50 rounded-lg" />
            <div className="h-6 w-32 bg-slate-800/50 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-28 bg-slate-800/50 rounded-3xl" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-slate-800/50 rounded-lg" />
          <div className="h-80 bg-slate-800/40 rounded-4xl border border-slate-800/50" />
        </div>
      </div>
    </div>
  );
}

interface DashboardErrorProps {
  onRetry: () => void;
}

function DashboardError({ onRetry }: DashboardErrorProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
        <AlertCircle className="text-red-500" size={40} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
      <p className="text-slate-400 max-w-md mb-8">
        We couldn't load your dashboard data. This might be a temporary connection issue.
      </p>
      <button 
        onClick={onRetry}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
      >
        <RefreshCcw size={18} />
        Try Again
      </button>
    </div>
  );
}

const formatDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  } catch (e) {
    return dateString;
  }
};

// ============================================================================
// 4. KOMPONEN TERPISAH: Mencegah god-component & memudahkan modifikasi AI
// ============================================================================

interface DashboardWelcomeBannerProps {
  user: any; 
  context: OperationalContext | null;
}

function DashboardWelcomeBanner({ user, context }: DashboardWelcomeBannerProps) {
  return (
    <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
      <div className="relative z-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
            Welcome, <span className="text-blue-200">{user?.full_name || user?.username}</span>!
          </h1>
          <p className="text-blue-100/80 font-medium max-w-xl text-sm md:text-base">
            Ready for duty today? Ensure full PPE and maintain team coordination.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4">
            <Truck className="text-blue-300" size={32} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-200/60">Assigned Unit</div>
              <div className="text-lg font-bold">{context?.assigned_vehicle || 'STANDBY / BASE'}</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4">
            <ShieldAlert className="text-blue-300" size={32} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-200/60">Duty Position</div>
              <div className="text-lg font-bold">{context?.duty_position || user?.position || 'FIELD OPS'}</div>
            </div>
          </div>
        </div>
      </div>
      <Truck className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 -rotate-12" />
    </div>
  );
}

interface DashboardFitnessTrendsProps {
  trends: FitnessTrend | null;
}

function DashboardFitnessTrends({ trends }: DashboardFitnessTrendsProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <Activity className="text-blue-500" />
          Battery Test Performance
        </h2>
        {trends?.current && (
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            Update {formatDate(trends.current.test_date)}
          </span>
        )}
      </div>

      {!trends?.current ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-4xl p-16 text-center flex flex-col items-center group">
          <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Dumbbell className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-white font-bold mb-1">No Fitness Data</h3>
          <p className="text-slate-500 italic text-sm max-w-xs">
            Battery Test data not available yet. Keep training to stay mission-ready!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           <MiniMetricCard title="Run 12m" value={trends.current.run_12min_meters} unit="m" icon={<Footprints size={18} />} prev={trends.previous?.run_12min_meters} color="blue" />
           <MiniMetricCard title="Shuttle Run" value={trends.current.shuttle_run_seconds} unit="s" icon={<Timer size={18} />} prev={trends.previous?.shuttle_run_seconds} invert={true} color="orange" />
           <MiniMetricCard title="Pull Ups" value={trends.current.pull_ups} unit="reps" icon={<Dumbbell size={18} />} prev={trends.previous?.pull_ups} color="emerald" />
           <MiniMetricCard title="Push Ups" value={trends.current.push_ups} unit="reps" icon={<Activity size={18} />} prev={trends.previous?.push_ups} color="purple" />
           <MiniMetricCard title="Sit Ups" value={trends.current.sit_ups} unit="reps" icon={<Zap size={18} />} prev={trends.previous?.sit_ups} color="blue" />
        </div>
      )}
    </div>
  );
}

interface DashboardTasksListProps {
  tasks: Task[];
  onNavigate: (path: string) => void;
}

function DashboardTasksList({ tasks, onNavigate }: DashboardTasksListProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-3">
        <ClipboardCheck className="text-blue-500" />
        Today's Tasks
      </h2>

      <div className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden min-h-[320px] flex flex-col">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center group">
            <div className="w-16 h-16 bg-blue-500/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500/10 transition-colors duration-500">
              <ClipboardCheck className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-white font-semibold mb-1">Clear Schedule</p>
            <p className="text-slate-500 text-xs italic max-w-[200px]">
              No tasks scheduled for today. Take this time for equipment maintenance.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tasks.map((task) => (
              <div 
                key={task.task_id} 
                onClick={() => onNavigate('/my-tasks')}
                role="button"
                aria-label={`Task: ${task.task_name}. Status: ${task.status}. Description: ${task.task_description}`}
                className="p-5 flex items-center justify-between group hover:bg-slate-800/30 transition-all cursor-pointer border-b border-slate-800/50 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{task.task_name}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{task.task_description}</p>
                  </div>
                </div>
                {task.status !== 'COMPLETED' && (
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Menambahkan typing eksplisit untuk prop MiniMetricCard untuk hindari "any"
export interface MiniMetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'emerald' | 'purple';
  prev?: number | null;
  invert?: boolean;
}

function MiniMetricCard({ title, value, unit, icon, color, prev, invert }: MiniMetricCardProps) {
  let deltaUI = null;
  let tooltipText = "";

  if (prev !== undefined && prev !== null && prev !== value) {
    const diff = value - prev;
    const rawNum = Math.abs(diff);
    let improved = diff > 0;
    if (invert) improved = !improved;

    tooltipText = `${improved ? 'Improvement' : 'Decline'} of ${rawNum}${unit} compared to previous test`;

    deltaUI = (
      <div 
        title={tooltipText}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase cursor-help transition-transform hover:scale-110 ${improved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
      >
        {improved ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        <span>{rawNum % 1 === 0 ? rawNum : rawNum.toFixed(1)}</span>
      </div>
    );
  }

  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/40',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 relative group hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors duration-300 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">{title}</div>
          {deltaUI}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-white">{value}</span>
          <span className="text-[10px] font-bold text-slate-600 uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
}
