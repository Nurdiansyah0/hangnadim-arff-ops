import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Timer, Dumbbell, Footprints, ShieldAlert, HeartPulse } from 'lucide-react';
import { api } from '../lib/axios';

interface FitnessTest {
  id: string;
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

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<FitnessTrend | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const res = await api.get('/fitness/me/trend');
      setTrends(res.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Failed fetching trends", err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <HeartPulse className="w-8 h-8 text-orange-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-orange-500 mb-2">
            <Activity size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pusat Kesamaptaan</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white italic tracking-tight uppercase">
            Battery Performance
          </h1>
        </div>
        {trends?.current && (
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Penilaian Terakhir</div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-white font-mono text-sm shadow-xl">
              {new Date(trends.current.test_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        )}
      </div>

      {!trends?.current ? (
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-4xl p-12 text-center relative overflow-hidden">
          <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Data Historis Tidak Ditemukan</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Sistem belum mendeteksi rekam jejak penilaian PSTL Battery Test untuk profil Anda. Silakan hubungi Team Leader untuk jadwal asesmen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Metric Card: 12 Min Run */}
          <MetricCard
            title="Endurance Run (12 Menit)"
            icon={<Footprints size={24} />}
            value={trends.current.run_12min_meters}
            unit="m"
            prev={trends.previous?.run_12min_meters}
            invert={false}
            color="blue"
          />

          {/* Metric Card: Shuttle Run */}
          <MetricCard
            title="Shuttle Run (Agility)"
            icon={<Timer size={24} />}
            value={trends.current.shuttle_run_seconds}
            unit="s"
            prev={trends.previous?.shuttle_run_seconds}
            invert={true}
            color="orange"
          />

          {/* Metric Card: Pull Ups */}
          <MetricCard
            title="Pull-Ups"
            icon={<Dumbbell size={24} />}
            value={trends.current.pull_ups}
            unit="reps"
            prev={trends.previous?.pull_ups}
            invert={false}
            color="emerald"
          />

          {/* Metric Card: Push Ups */}
          <MetricCard
            title="Push-Ups"
            icon={<Activity size={24} />}
            value={trends.current.push_ups}
            unit="reps"
            prev={trends.previous?.push_ups}
            invert={false}
            color="purple"
          />

          {/* Metric Card: Sit Ups */}
          <MetricCard
            title="Sit-Ups"
            icon={<Activity size={24} />}
            value={trends.current.sit_ups}
            unit="reps"
            prev={trends.previous?.sit_ups}
            invert={false}
            color="pink"
          />

        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Internal Premium UI Components
// ------------------------------------------------------------------

function MetricCard({ title, icon, value, unit, prev, invert, color }: any) {
  const colorSchemes: any = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };
  const activeScheme = colorSchemes[color] || colorSchemes.blue;

  let deltaUI = null;
  if (prev !== undefined && prev !== null && prev !== value) {
    const diff = value - prev;
    const rawNum = Math.abs(diff);
    let improved = diff > 0;
    if (invert) improved = !improved; // lower is better

    deltaUI = (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${improved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {improved ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
        <span>{improved ? '+' : '-'}{rawNum % 1 === 0 ? rawNum : rawNum.toFixed(1)} {unit} vs Periode Sebelumnya</span>
      </div>
    );
  } else if (prev === value) {
    deltaUI = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400">
        <span>Sama dengan Periode Sebelumnya</span>
      </div>
    );
  } else {
    deltaUI = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-500">
        <span>Data Dasar (Baseline)</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-3xl p-6 relative overflow-hidden group">
      {/* Background Glow */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${activeScheme.split(' ')[0].replace('text', 'bg')} group-hover:opacity-40 transition-opacity`} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${activeScheme}`}>
            {icon}
          </div>
          {deltaUI}
        </div>

        <div className="mt-auto">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
              {value % 1 === 0 ? value : value.toFixed(1)}
            </span>
            <span className="text-slate-500 font-bold uppercase text-sm tracking-widest">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
