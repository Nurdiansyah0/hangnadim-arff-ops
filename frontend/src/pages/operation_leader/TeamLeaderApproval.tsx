import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

interface DailyTask {
  task_id: string;
  task_name: string;
  task_description: string | null;
  status: string;
  completed_at: string | null;
  assignment_date: string;
  vehicle_code: string | null;
  position: string;
  personnel_name: string;
}

export default function TeamLeaderApproval() {
  const { user } = useAuth();
  const isRestricted = user?.role_id !== 1 && user?.role_id !== 3;

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [availableShifts, setAvailableShifts] = useState<{id: number, name: String}[]>([]);
  const [shiftId, setShiftId] = useState<number>(0);
  
  // Actually, we need to know the TL's shift_id for today.
  // For the sake of demonstration, we provide a selector or fetch it if the user info has it.
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch available shifts
        const shiftsRes = await api.get('/shifts');
        const shifts = shiftsRes.data;
        setAvailableShifts(shifts);

        // 2. Try to get current user's shift from context
        const contextRes = await api.get('/auth/me/context');
        if (contextRes.data.shift_id) {
          setShiftId(contextRes.data.shift_id);
        } else if (shifts.length > 0) {
          // Fallback: Default to 'Morning' or the first one if no context
          const morning = shifts.find((s: any) => s.name.toLowerCase() === 'morning');
          setShiftId(morning ? morning.id : shifts[0].id);
        }
      } catch (err) {
        console.error('Initialization failed', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (shiftId > 0) {
      fetchShiftTasks();
    }
  }, [shiftId]);

  const fetchShiftTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/pending-approval', { params: { date: today, shift_id: shiftId } });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch shift tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const approveShift = async () => {
    if(!window.confirm("Approve all COMPLETED tasks and finalize the Daily Shift Report?")) return;
    try {
      setApproving(true);
      await api.post(`/tasks/approve-shift`, { shift_id: shiftId, date: today });
      await fetchShiftTasks();
      alert("Shift Report Approved successfully!");
    } catch (err) {
      alert('Failed to approve shift.');
    } finally {
      setApproving(false);
    }
  };

  const generateTodayTasks = async () => {
    try {
      setGenerating(true);
      await api.post(`/tasks/generate-today`);
      await fetchShiftTasks();
      alert("Today's tasks generated based on Matrix!");
    } catch (err) {
      alert("Failed to generate tasks.");
    } finally {
      setGenerating(false);
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const readyToApprove = pendingCount === 0 && completedCount > 0;
  const isApproved = tasks.length > 0 && tasks.every(t => t.status === 'APPROVED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-4xl">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center ring-1 ring-emerald-500/30">
             <ShieldCheck size={32} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-white tracking-tight">
               Shift <span className="text-emerald-500">Approval</span>
             </h1>
             <p className="text-slate-400 mt-1">Review team submissions and sign off Daily Report.</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={generateTodayTasks}
             disabled={generating}
             className="px-4 py-2 border border-blue-500/50 text-blue-500 rounded-xl text-sm font-bold uppercase transition-all hover:bg-blue-500/10"
           >
             {generating ? <Loader2 size={16} className="animate-spin inline mr-2"/> : null}
             Generate Matrix Tasks
           </button>
           <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
             {availableShifts.map(s => (
               <button 
                  key={s.id}
                  onClick={() => !isRestricted && setShiftId(s.id)} 
                  className={`px-4 py-2 rounded-xl text-sm font-bold uppercase transition-all ${shiftId === s.id ? (s.name.toLowerCase().includes('night') ? 'bg-purple-600' : 'bg-blue-600') + ' text-white' : 'text-slate-500 hover:text-white'} ${isRestricted && shiftId !== s.id ? 'hidden' : ''}`}
                  disabled={isRestricted}
               >
                  {s.name} Shift
               </button>
             ))}
           </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : tasks.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-3xl">
          <p className="text-slate-500 font-bold uppercase tracking-widest">No generated tasks for this shift today.</p>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex gap-4">
                 <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Pending</span>
                    <span className="text-white font-bold">{pendingCount}</span>
                 </div>
                 <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Ready</span>
                    <span className="text-emerald-500 font-bold">{completedCount}</span>
                 </div>
              </div>

              {!isApproved ? (
                 <button 
                   onClick={approveShift}
                   disabled={!readyToApprove || approving}
                   className={`px-6 py-3 rounded-2xl font-bold uppercase text-sm flex items-center gap-2 transition-all shadow-xl ${
                     readyToApprove 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                   }`}
                 >
                   {approving ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />}
                   Approve Shift Report
                 </button>
              ) : (
                 <div className="px-6 py-3 rounded-2xl font-bold uppercase text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
                    <ShieldCheck size={18} />
                    Report Finalized
                 </div>
              )}
           </div>

           {!readyToApprove && !isApproved && pendingCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
                 <AlertCircle size={18} />
                 Cannot approve shift report until all personnel have completed their assigned tasks.
              </div>
           )}

           <div className="grid grid-cols-1 gap-3">
             {tasks.map((task) => (
               <div key={task.task_id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  task.status === 'APPROVED' ? 'bg-emerald-900/10 border-emerald-500/20' :
                  task.status === 'COMPLETED' ? 'bg-slate-900 border-slate-700' :
                  'bg-slate-950/50 border-slate-800/50 opacity-60'
               }`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${
                        task.status === 'APPROVED' ? 'bg-emerald-500' :
                        task.status === 'COMPLETED' ? 'bg-blue-500 animate-pulse' :
                        'bg-amber-500'
                     }`} />
                     <div>
                        <h4 className="font-bold text-white text-sm">{task.task_name}</h4>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                           {task.personnel_name} • {task.vehicle_code || task.position}
                        </div>
                     </div>
                  </div>
                  
                  <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                     task.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' :
                     task.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-500' :
                     'bg-amber-500/20 text-amber-500'
                  }`}>
                     {task.status}
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
