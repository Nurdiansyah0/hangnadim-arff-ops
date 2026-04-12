import { useState, useEffect } from 'react';
import { Clock, Plus, Loader2, Calendar, Scissors, Trash2 } from 'lucide-react';
import { api } from '../../lib/axios';

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
}

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    start_time: '07:00:00',
    end_time: '19:00:00'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await api.get('/shifts');
      setShifts(res.data);
    } catch (err) {
      console.error('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Ensure time format is HH:MM:SS
      const formattedForm = {
        ...form,
        start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
        end_time: form.end_time.length === 5 ? `${form.end_time}:00` : form.end_time,
      };
      await api.post('/shifts', formattedForm);
      setShowModal(false);
      setForm({ name: '', start_time: '07:00:00', end_time: '19:00:00' });
      fetchShifts();
    } catch (err) {
      alert('Gagal menambah shift baru');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="text-blue-500" />
            Operational Shift Patterns
          </h1>
          <p className="text-slate-400 mt-1">Manage duty cycles and rotation windows</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/20 font-bold"
        >
          <Plus size={20} />
          Define New Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span>Syncing rotation schedules...</span>
          </div>
        ) : shifts.length > 0 ? (
          shifts.map(shift => (
            <div key={shift.id} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 group hover:border-blue-500/50 transition-all shadow-xl relative overflow-hidden">
               <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-blue-500/10 transition-colors">
                  <Clock size={120} />
               </div>
               
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
                        <Clock size={24} />
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 text-slate-500 hover:text-white transition-colors"><Scissors size={16}/></button>
                        <button className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{shift.name}</h3>
                  
                  <div className="space-y-3">
                     <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Starts</span>
                        <span className="text-white font-mono font-bold">{shift.start_time.slice(0, 5)}</span>
                     </div>
                     <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ends</span>
                        <span className="text-white font-mono font-bold">{shift.end_time.slice(0, 5)}</span>
                     </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                     Auto-rotation Enabled
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
            <p className="text-slate-500 font-bold uppercase tracking-widest">No shift patterns defined</p>
          </div>
        )}
      </div>

      {/* New Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-8">Define Duty Shift</h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Shift Label</label>
                <input 
                  required 
                  placeholder="E.g. Alpha Shift, Night Watch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Begin Time</label>
                  <input 
                    type="time"
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={form.start_time}
                    onChange={e => setForm({...form, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">End Time</label>
                  <input 
                    type="time"
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value={form.end_time}
                    onChange={e => setForm({...form, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-bold uppercase transition-all hover:bg-slate-800">Cancel</button>
                 <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-bold uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={20}/> : 'Initialize Shift'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
