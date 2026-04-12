import { useState, useEffect } from 'react';
import { ClipboardCheck, Loader2, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../lib/axios';

interface DailyTask {
  task_id: string;
  task_name: string;
  task_description: string | null;
  status: string;
  completed_at: string | null;
  assignment_date: string;
  vehicle_code: string | null;
  position: string;
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0]; // Current local date
      const res = await api.get('/tasks/my-tasks', { params: { date: today } });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (id: string) => {
    try {
      setSubmittingId(id);
      await api.put(`/tasks/${id}/submit`, { completed_notes: 'Completed physically.' });
      await fetchTasks();
    } catch (err) {
      alert('Failed to submit task.');
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-4xl">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-500 flex items-center justify-center ring-1 ring-blue-500/30">
          <ClipboardCheck size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            My Daily <span className="text-blue-500">Tasks</span>
          </h1>
          <p className="text-slate-400 mt-1">Execute RACI duties and report completion to Team Leader.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : tasks.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-3xl">
          <p className="text-slate-500 font-bold uppercase tracking-widest">No tasks generated for you today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Action Box */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2">Action Required ({pendingTasks.length})</h2>
            {pendingTasks.map((task) => (
              <div key={task.task_id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 group hover:border-blue-500/50 transition-all shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{task.task_name}</h3>
                    <div className="bg-amber-500/10 text-amber-500 font-black text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest">PENDING</div>
                 </div>
                 <p className="text-sm text-slate-400 mb-6">{task.task_description}</p>
                 <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                       {task.vehicle_code || task.position}
                    </div>
                    <button 
                      onClick={() => submitTask(task.task_id)}
                      disabled={submittingId === task.task_id}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2"
                    >
                      {submittingId === task.task_id ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                      Mark Complete
                    </button>
                 </div>
              </div>
            ))}
          </div>

          {/* Completed History Box */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2">Completed Today ({completedTasks.length})</h2>
            {completedTasks.map((task) => (
              <div key={task.task_id} className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-6 opacity-70">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-slate-300 strike-through">{task.task_name}</h3>
                    <div className={`font-black text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest ${task.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                       {task.status}
                    </div>
                 </div>
                 {task.completed_at && (
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-2">
                      <Clock size={12}/>
                      {new Date(task.completed_at).toLocaleTimeString()}
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
