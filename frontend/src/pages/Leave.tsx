import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { api } from '../lib/axios';

interface LeaveRequest {
  id: string;
  personnel_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

export default function Leave() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/leaves', form);
      setShowModal(false);
      setForm({ start_date: '', end_date: '', reason: '' });
      fetchRequests();
    } catch (err) {
      alert('Gagal mengajukan cuti');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/leaves/${id}/status`, { status });
      fetchRequests();
    } catch (err) {
      alert('Akses ditolak atau gagal memproses');
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
            <Calendar className="text-blue-500" size={36} />
            Leave Management
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">Personnel time-off requests and administrative oversight</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl transition-all shadow-xl shadow-blue-500/20 font-black uppercase text-xs tracking-widest"
        >
          <Plus size={20} />
          Submit Request
        </button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8 shadow-2xl">
        {loading ? (
           <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-4" size={40} />
              <span className="font-black uppercase tracking-widest text-[10px]">Syncing workflow data...</span>
           </div>
        ) : (
          <div className="space-y-4">
             {requests.map(req => (
               <div key={req.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6 group relative overflow-hidden">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                        <FileText size={24} />
                     </div>
                     <div>
                        <div className="text-xl font-bold text-white uppercase italic tracking-tight">{req.personnel_name}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1.5 font-mono">
                           <Clock size={12} className="text-blue-500" />
                           {new Date(req.start_date).toLocaleDateString()} — {new Date(req.end_date).toLocaleDateString()}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 max-w-sm relative z-10">
                     <p className="text-sm text-slate-400 font-medium italic line-clamp-2">"{req.reason}"</p>
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                     <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ring-1 shadow-lg ${getStatusStyle(req.status)}`}>
                        {req.status}
                     </div>
                     {req.status === 'PENDING' && (
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleProcess(req.id, 'APPROVED')}
                             className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-lg border border-emerald-500/20"
                           >
                              <CheckCircle2 size={18} />
                           </button>
                           <button 
                             onClick={() => handleProcess(req.id, 'REJECTED')}
                             className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg border border-red-500/20"
                           >
                              <XCircle size={18} />
                           </button>
                        </div>
                     )}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
             ))}
             {requests.length === 0 && (
                <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-4xl text-slate-700 font-black uppercase tracking-[0.4em] text-xs">
                   <AlertTriangle className="mx-auto mb-4 opacity-20" size={48} />
                   No pending leave requests
                </div>
             )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-white mb-8 italic uppercase tracking-tighter text-center">Submit Leave Request</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Start Date</label>
                   <input required type="date" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}/>
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">End Date</label>
                   <input required type="date" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}/>
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Reason / Remarks</label>
                <textarea required rows={4} placeholder="Purpose of leave..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm resize-none" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}/>
              </div>

              <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all font-mono">Cancel</button>
                 <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={20}/> : 'Submit Request'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
