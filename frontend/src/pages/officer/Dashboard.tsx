import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Timer, 
  Dumbbell, 
  Footprints, 
  ShieldAlert, 
  HeartPulse,
  Truck,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

interface FitnessTest {
  test_date: string;
  run_12min_meters: number;
  shuttle_run_seconds: number;
  pull_ups: number;
  sit_ups: number;
  push_ups: number;
}

interface FitnessTrend {
  current: FitnessTest;
  previous: FitnessTest | null;
}

interface OperationalContext {
  assigned_vehicle: string | null;
  duty_position: string | null;
  duty_status: string;
}

interface Task {
  task_id: string;
  task_name: string;
  task_description: string;
  status: string;
}

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<FitnessTrend | null>(null);
  const [context, setContext] = useState<OperationalContext | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [fitnessRes, contextRes, tasksRes] = await Promise.all([
        api.get('/fitness/me/trend'),
        api.get('/auth/me/context'),
        api.get(`/tasks/my-tasks?date=${today}`)
      ]);
      setTrends(fitnessRes.data);
      setContext(contextRes.data);
      setTasks(tasksRes.data);
    } catch (err: any) {
      console.error("Failed fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <HeartPulse className="w-8 h-8 text-blue-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
              Selamat Datang, <span className="text-blue-200">{user?.full_name || user?.username}</span>!
            </h1>
            <p className="text-blue-100/80 font-medium max-w-xl text-sm md:text-base">
              Siap untuk bertugas hari ini? Pastikan alat pelindung diri lengkap dan koordinasi tim terjaga.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4">
              <Truck className="text-blue-300" size={32} />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-200/60">Unit Penugasan</div>
                <div className="text-lg font-bold">{context?.assigned_vehicle || 'STANDBY / BASE'}</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4">
              <ShieldAlert className="text-blue-300" size={32} />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-200/60">Posisi Tugas</div>
                <div className="text-lg font-bold">{context?.duty_position || user?.position || 'FIELD OPS'}</div>
              </div>
            </div>
          </div>
        </div>
        <Truck className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Fitness Trend Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Activity className="text-blue-500" />
              Battery Test Performance
            </h2>
            {trends?.current && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                Update {new Date(trends.current.test_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {!trends?.current ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-4xl p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 italic text-sm">Data Battery Test belum tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MiniMetricCard title="Run 12m" value={trends.current.run_12min_meters} unit="m" icon={<Footprints size={18} />} prev={trends.previous?.run_12min_meters} color="blue" />
              <MiniMetricCard title="Sprint" value={trends.current.shuttle_run_seconds} unit="s" icon={<Timer size={18} />} prev={trends.previous?.shuttle_run_seconds} invert={true} color="orange" />
              <MiniMetricCard title="Pull Ups" value={trends.current.pull_ups} unit="reps" icon={<Dumbbell size={18} />} prev={trends.previous?.pull_ups} color="emerald" />
              <MiniMetricCard title="Push Ups" value={trends.current.push_ups} unit="reps" icon={<Activity size={18} />} prev={trends.previous?.push_ups} color="purple" />
            </div>
          )}
        </div>

        {/* Today's Tasks Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="text-blue-500" />
            Tugas Hari Ini
          </h2>
          
          <div className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm italic">Tidak ada tugas terjadwal untuk hari ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {tasks.map((task) => (
                  <div key={task.task_id} className="p-5 flex items-center justify-between group hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{task.task_name}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{task.task_description}</p>
                      </div>
                    </div>
                    {task.status !== 'COMPLETED' && (
                      <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function MiniMetricCard({ title, value, unit, icon, color, prev, invert }: any) {
  let deltaUI = null;
  if (prev !== undefined && prev !== null && prev !== value) {
    const diff = value - prev;
    const rawNum = Math.abs(diff);
    let improved = diff > 0;
    if (invert) improved = !improved; 

    deltaUI = (
      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${improved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {improved ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        <span>{rawNum % 1 === 0 ? rawNum : rawNum.toFixed(1)}</span>
      </div>
    );
  }

  const colorClasses: any = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 relative group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</div>
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
