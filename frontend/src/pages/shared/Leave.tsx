import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  FileText,
  AlertTriangle,
  Info,
  CalendarDays,
  User as UserIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

interface LeaveRequest {
  id: string;
  personnel_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

export default function Leave() {
  const { user, token, setAuth } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState({ 
    month: new Date().getMonth(), 
    year: new Date().getFullYear() 
  });

  const [form, setForm] = useState({
    start_date: '',
    request_days: 1,
    reason: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leaves');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to sync leave requests');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const ctx = res.data;
      const updatedUser = {
        ...user!,
        full_name: ctx.full_name || ctx.username,
        role: ctx.role,
        personnel_id: ctx.personnel_id,
        role_id: ctx.role_id,
        remaining_leave: ctx.remaining_leave,
        annual_leave_quota: ctx.annual_leave_quota,
        shift_team: ctx.shift_team
      };
      setAuth(updatedUser, token!);
      toast.success('Profile refreshed! Roster: ' + (ctx.shift_team || 'Not Assigned'));
    } catch (err) {
      toast.error('Failed to refresh profile');
    }
  };

  const getShiftInfo = (date: Date, team: string) => {
    const t = team.toUpperCase();
    if (t === 'NORMAL') {
      const day = date.getDay();
      if (day === 0 || day === 6) return 'OFF';
      return 'NORMAL';
    }

    // Use local date for baseline to avoid TZ issues
    const baseline = new Date(2026, 3, 12); 
    const diffTime = date.getTime() - baseline.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const cycleIdx = diffDays >= 0 ? diffDays % 6 : (6 + (diffDays % 6)) % 6;

    // Pattern for teams
    if (t === 'ALPHA') {
      const pattern = ['MORNING', 'NIGHT', 'NIGHT', 'OFF', 'OFF', 'MORNING'];
      return pattern[cycleIdx];
    }
    if (t === 'BRAVO') {
      const pattern = ['OFF', 'MORNING', 'MORNING', 'NIGHT', 'NIGHT', 'OFF'];
      return pattern[cycleIdx];
    }
    if (t === 'CHARLIE') {
      const pattern = ['NIGHT', 'OFF', 'OFF', 'MORNING', 'MORNING', 'NIGHT'];
      return pattern[cycleIdx];
    }
    return 'UNKNOWN';
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { month: 0, year: prev.year + 1 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { month: 11, year: prev.year - 1 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const calendarDays = useMemo(() => {
    const start = new Date(currentMonth.year, currentMonth.month, 1);
    const end = new Date(currentMonth.year, currentMonth.month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Fill empty days before 1st
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    
    // Fill actual days
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(currentMonth.year, currentMonth.month, i));
    }
    
    return days;
  }, [currentMonth]);

  const leaveCalculation = useMemo(() => {
    if (!form.start_date || !user?.shift_team) return null;
    
    let current = new Date(form.start_date);
    let workingDaysFound = 0;
    let daysToTraverse = 0;
    const shiftsCovered: { date: string, type: string }[] = [];

    // Limit search to prevent infinite loop
    while (workingDaysFound < form.request_days && daysToTraverse < 60) {
      const type = getShiftInfo(current, user.shift_team);
      if (type !== 'OFF') {
        workingDaysFound++;
        shiftsCovered.push({ 
          date: current.toISOString().split('T')[0], 
          type 
        });
      }
      if (workingDaysFound < form.request_days) {
        current.setDate(current.getDate() + 1);
        daysToTraverse++;
      }
    }

    return {
      end_date: current.toISOString().split('T')[0],
      shifts: shiftsCovered
    };
  }, [form.start_date, form.request_days, user?.shift_team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveCalculation) {
      toast.error('Please select a start date and ensure your roster is assigned.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/leaves', {
        start_date: form.start_date,
        end_date: leaveCalculation.end_date,
        reason: form.reason
      });
      setShowModal(false);
      setForm({ start_date: '', request_days: 1, reason: '' });
      fetchRequests();
      toast.success('Request submitted! Quota will be deducted once approved.');
    } catch (err: any) {
      const msg = err.response?.data || 'Failed to submit leave request';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/leaves/${id}/status`, { status });
      fetchRequests();
      toast.success(`Request ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      const msg = err.response?.data || 'Access denied or failed to process';
      toast.error(msg);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 ring-red-500/20';
      default: return 'bg-orange-500/10 text-orange-500 ring-orange-500/20';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
            <Calendar className="text-blue-500" size={40} />
            Leave Management
          </h1>
          <p className="text-slate-400 mt-2 font-medium italic">Monitor personnel absences and manage annual leave quotas</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-500/30 font-black uppercase text-xs tracking-[0.2em] active:scale-95"
        >
          <Plus size={20} />
          Submit New Request
        </button>
      </div>

      {/* Quota Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
               <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <CalendarDays size={14} className="text-blue-500" />
                  Annual Quota
               </div>
               <div className="text-5xl font-black text-white italic tracking-tighter mb-2">
                  {user?.annual_leave_quota || 12} <span className="text-xl text-slate-600 not-italic font-medium uppercase tracking-widest ml-1">Days</span>
               </div>
               <div className="h-1 w-12 bg-blue-600 rounded-full mb-2" />
               <p className="text-xs text-slate-500 font-medium">Standard yearly allocation</p>
            </div>
            <CalendarDays className="absolute -bottom-4 -right-4 text-white/5 rotate-12" size={160} />
         </div>

         <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
               <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-emerald-500" />
                  Remaining Balance
               </div>
               <div className="text-5xl font-black text-emerald-500 italic tracking-tighter mb-2">
                  {user?.remaining_leave ?? '—'} <span className="text-xl text-slate-600 not-italic font-medium uppercase tracking-widest ml-1">Days</span>
               </div>
               <div className="h-1 w-12 bg-emerald-500 rounded-full mb-2" />
               <p className="text-xs text-slate-500 font-medium italic">Available for future requests</p>
            </div>
            <Clock className="absolute -bottom-4 -right-4 text-emerald-500/5 -rotate-12" size={160} />
         </div>

         <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
               <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Info size={14} className="text-orange-500" />
                  Active Policy
               </div>
               <div className="text-xl font-bold text-white uppercase tracking-tight mb-2 flex items-center gap-2 mt-4">
                  Max 2 Persons <span className="text-slate-500 font-medium">/ Shift</span>
               </div>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Only 2 personnel from the same team can be on leave simultaneously per working shift.
               </p>
            </div>
            <AlertTriangle className="absolute -bottom-4 -right-4 text-orange-500/5" size={160} />
         </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-6">
           <h2 className="text-xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
              <FileText className="text-blue-500" />
              Recent Requests
           </h2>
           <span className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
              {requests.length} Total
           </span>
        </div>

        {loading ? (
           <div className="py-24 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-6 text-blue-500" size={48} />
              <span className="font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Synchronizing database...</span>
           </div>
        ) : (
          <div className="space-y-5">
             {requests.map(req => (
               <div key={req.id} className="bg-slate-950/40 border border-slate-800/60 p-7 rounded-4xl hover:border-blue-500/30 hover:bg-slate-950/60 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-8 group relative overflow-hidden">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all shadow-2xl">
                        <UserIcon size={28} />
                     </div>
                     <div>
                        <div className="text-2xl font-black text-white uppercase italic tracking-tighter">{req.personnel_name}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2 font-mono">
                           <Calendar className="text-blue-500" size={14} />
                           {new Date(req.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                           <span className="text-slate-700 mx-1">—</span>
                           {new Date(req.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 max-w-md relative z-10">
                     <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 ml-1 italic flex items-center gap-2">
                        <Info size={12} /> Reason for Leave
                     </div>
                     <p className="text-sm text-slate-400 font-medium italic bg-slate-900/40 p-4 rounded-2xl border border-slate-800/30">
                        "{req.reason}"
                     </p>
                  </div>

                  <div className="flex items-center gap-6 relative z-10">
                     <div className={`px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] ring-1 shadow-2xl ${getStatusStyle(req.status)}`}>
                        {req.status}
                     </div>
                     
                     {/* Admin Controls */}
                     {(user?.role_id === 1 || user?.role_id === 2) && req.status === 'PENDING' && (
                        <div className="flex gap-3">
                           <button 
                             title="Approve"
                             onClick={() => handleProcess(req.id, 'APPROVED')}
                             className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-xl border border-emerald-500/20 active:scale-90"
                           >
                              <CheckCircle2 size={22} />
                           </button>
                           <button 
                             title="Reject"
                             onClick={() => handleProcess(req.id, 'REJECTED')}
                             className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-xl border border-red-500/20 active:scale-90"
                           >
                              <XCircle size={22} />
                           </button>
                        </div>
                     )}
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/2 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-500/5 transition-all" />
               </div>
             ))}
             {requests.length === 0 && (
                <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/20">
                   <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-800 border border-slate-800/50">
                      <AlertTriangle size={40} />
                   </div>
                   <div className="text-slate-600 font-black uppercase tracking-[0.5em] text-xs">No pending leave requests found</div>
                </div>
             )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto pt-20 md:pt-6">
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl transition-all" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300 my-auto">
            <div className="text-center mb-10">
               <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500 border border-blue-500/20">
                  <CalendarDays size={32} />
               </div>
               <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Submit Leave Request</h3>
               <p className="text-slate-500 mt-2 text-sm font-medium flex items-center gap-2">
                  Roster: <span className="text-blue-500 font-bold uppercase">{user?.shift_team || 'Not Assigned'}</span>
                  <button type="button" onClick={refreshProfile} className="p-1 hover:bg-slate-800 rounded-md text-blue-500 transition-all" title="Sync Profile">
                     <Loader2 size={14} className={submitting ? 'animate-spin' : ''} />
                  </button>
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                 <label className="flex text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 items-center gap-2">
                    <CalendarDays size={12} className="text-blue-500" /> Select Start Date
                 </label>
                 
                 <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 px-2">
                       <h4 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3 italic">
                          {new Date(currentMonth.year, currentMonth.month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                       </h4>
                       <div className="flex gap-2">
                          <button type="button" onClick={() => prevMonth()} className="p-2 hover:bg-slate-900 rounded-xl text-slate-500 transition-all"><ChevronLeft size={18}/></button>
                          <button type="button" onClick={() => nextMonth()} className="p-2 hover:bg-slate-900 rounded-xl text-slate-500 transition-all"><ChevronRight size={18}/></button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                       {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                          <div key={i} className="text-[10px] font-black text-slate-700 py-2">{d}</div>
                       ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                       {calendarDays.map((date, idx) => {
                          const isSelected = form.start_date === date?.toISOString().split('T')[0];
                          const isToday = new Date().toISOString().split('T')[0] === date?.toISOString().split('T')[0];
                          const shift = date ? getShiftInfo(date, user?.shift_team || '') : null;
                          const isPast = date && date < new Date(new Date().setHours(0,0,0,0));

                          return (
                             <button
                                key={idx}
                                type="button"
                                disabled={!date || isPast}
                                onClick={() => date && setForm({...form, start_date: date.toISOString().split('T')[0]})}
                                className={`
                                   aspect-square rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden
                                   ${!date ? 'opacity-0 cursor-default' : isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-blue-600/20'}
                                   ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 ring-2 ring-white/20' : isToday ? 'text-blue-500 ring-1 ring-blue-500/30' : 'text-slate-400'}
                                `}
                             >
                                {date?.getDate()}
                                {date && !isPast && !isSelected && (
                                   <div className={`w-1 h-1 rounded-full ${shift === 'MORNING' ? 'bg-orange-500' : shift === 'NIGHT' ? 'bg-indigo-500' : shift === 'OFF' ? 'bg-slate-700' : 'bg-blue-500'}`} />
                                )}
                             </button>
                          );
                       })}
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="flex text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 items-center gap-2">
                    <CalendarDays size={12} className="text-blue-500" /> Duration (Days)
                 </label>
                 <div className="flex items-center gap-4">
                    <input required type="range" min="1" max={user?.remaining_leave || 12} className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" value={form.request_days} onChange={e => setForm({...form, request_days: parseInt(e.target.value) || 1})}/>
                    <div className="bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl text-white font-black italic w-20 text-center">
                       {form.request_days}
                    </div>
                 </div>
              </div>

              {leaveCalculation && (
                 <div className="space-y-4 animate-in slide-in-from-top duration-500">
                    <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-3xl flex items-center justify-between">
                       <div>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Calculated End Date</div>
                          <div className="text-xl font-black text-white italic">
                             {new Date(leaveCalculation.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Shift on Return</div>
                          <div className="text-sm font-bold text-emerald-500 uppercase tracking-tighter">
                             {getShiftInfo(new Date(new Date(leaveCalculation.end_date).getTime() + 86400000), user?.shift_team || '')}
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800/50 p-6 rounded-3xl">
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1 italic">Shifts to be Missed:</div>
                       <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {leaveCalculation.shifts.map((s, idx) => (
                             <div key={idx} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${s.type === 'MORNING' ? 'bg-orange-500' : s.type === 'NIGHT' ? 'bg-indigo-500' : 'bg-blue-500'}`} />
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{s.type}</span>
                                <span className="text-[9px] font-medium text-slate-500">{new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              )}

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Reason / Remarks</label>
                <textarea required rows={4} placeholder="Briefly explain the purpose of your leave..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm resize-none transition-all placeholder:text-slate-700" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}/>
              </div>

              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 rounded-2xl border border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 hover:text-white transition-all">Cancel</button>
                 <button type="submit" disabled={submitting || !leaveCalculation} className="flex-1 py-5 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {submitting ? <Loader2 className="animate-spin" size={20}/> : 'Submit Application'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
