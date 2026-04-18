import { useState, useEffect } from 'react';
import { ClipboardCheck, Loader2, CheckCircle, Clock, RefreshCw, Inbox, X, MessageSquareText } from 'lucide-react';
import { api } from '../../lib/axios';
import toast from 'react-hot-toast';

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
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<DailyTask | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get<DailyTask[]>('/tasks/my-tasks', { params: { date: today } });
      setTasks(res.data);
      
      if (isManual) toast.success('Tasks refreshed');
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenCompletionModal = (task: DailyTask) => {
    setCompletingTask(task);
    setNote('');
  };

  const submitTask = async () => {
    if (!completingTask) return;
    
    const taskId = completingTask.task_id;
    const finalNote = note.trim() || 'Completed physically.';
    const previousTasks = [...tasks];

    // Optimistic Update
    setTasks(prev => prev.map(t => 
      t.task_id === taskId 
        ? { ...t, status: 'COMPLETED', completed_at: new Date().toISOString() } 
        : t
    ));
    setCompletingTask(null);

    try {
      setSubmittingId(taskId);
      await api.put(`/tasks/${taskId}/submit`, { completed_notes: finalNote });
      toast.success('Task marked as complete');
      // Re-fetch to sync with server state (e.g. if TL approved immediately or status changed)
      await fetchTasks();
    } catch (err) {
      console.error('Failed to submit task', err);
      toast.error('Failed to submit task');
      // Rollback on error
      setTasks(previousTasks);
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const completedTasks = tasks.filter(t => t.status !== 'PENDING');

  const SkeletonCard = () => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 bg-slate-800 rounded-lg w-2/3" />
        <div className="h-5 bg-slate-800 rounded-lg w-16" />
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-800 rounded w-5/6" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-800 rounded-xl w-24" />
        <div className="h-8 bg-slate-800 rounded-xl w-32" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-4xl">
        <div className="flex items-center gap-6">
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
        <button 
          onClick={() => fetchTasks(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div className="h-4 bg-slate-800/50 rounded w-32 mx-2 mb-2" />
             <SkeletonCard />
             <SkeletonCard />
          </div>
          <div className="space-y-4">
             <div className="h-4 bg-slate-800/50 rounded w-32 mx-2 mb-2" />
             <SkeletonCard />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-24 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-[3rem] flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600 mb-6">
            <Inbox size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">All caught up!</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">No tasks have been assigned to you for today. Check back later or contact your Team Leader.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Action Box */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2 flex items-center gap-2">
              Action Required 
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
            </h2>
            {pendingTasks.map((task) => (
              <div key={task.task_id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 group hover:border-blue-500/50 transition-all shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{task.task_name}</h3>
                    <div className="bg-amber-500/10 text-amber-500 font-black text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest border border-amber-500/20">PENDING</div>
                 </div>
                 <p className="text-sm text-slate-400 mb-6 leading-relaxed">{task.task_description}</p>
                 <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                       {task.vehicle_code || task.position}
                    </div>
                    <button 
                      onClick={() => handleOpenCompletionModal(task)}
                      disabled={submittingId === task.task_id}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
                    >
                      {submittingId === task.task_id ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                      Mark Complete
                    </button>
                 </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="p-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
                <CheckCircle className="mx-auto text-emerald-500/50 mb-3" size={32} />
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No pending tasks</p>
              </div>
            )}
          </div>

          {/* Completed History Box */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-500 tracking-widest px-2 flex items-center gap-2">
              Completed Today
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{completedTasks.length}</span>
            </h2>
            {completedTasks.map((task) => (
              <div key={task.task_id} className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-6 opacity-70 group hover:opacity-100 transition-opacity">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-slate-300 strike-through">{task.task_name}</h3>
                    <div className={`font-black text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest border ${task.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                       {task.status}
                    </div>
                 </div>
                 {task.completed_at && (
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-2">
                      <Clock size={12}/>
                      {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            onClick={() => setCompletingTask(null)}
          />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setCompletingTask(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 ring-1 ring-blue-500/30">
                <MessageSquareText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Task Note</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Physical Completion Evidence</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-4 px-1">
              Provide any additional notes or observations for <span className="text-white font-bold">{completingTask.task_name}</span>.
            </p>

            <textarea
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none mb-6"
              rows={4}
              placeholder="E.g. Verified tire pressure, all equipment functional..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setCompletingTask(null)}
                className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={submitTask}
                className="flex-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Submit Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

