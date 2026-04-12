import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Send, 
  AlertTriangle, 
  Truck, 
  Camera, 
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

interface OperationalContext {
    assigned_vehicle: string | null;
    assigned_vehicle_id: string | null;
}

export default function MaintenanceRequest() {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [opsContext, setOpsContext] = useState<OperationalContext | null>(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
  });

  useEffect(() => {
    fetchOpsContext();
  }, []);

  const fetchOpsContext = async () => {
    try {
      const res = await api.get('/auth/me/context');
      setOpsContext(res.data);
    } catch (err) {
      console.error('Failed to fetch operational context', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opsContext?.assigned_vehicle_id || !user?.id) {
       alert("SISTEM DITOLAK: Kendaraan aktif belum ditetapkan (No Assigned Vehicle).");
       return;
    }

    setLoading(true);
    try {
      // Backend expects a single description field. We prepend the subject for clarity.
      const finalDescription = `[${formData.subject.toUpperCase()}] - ${formData.description}`;
      
      await api.post('/maintenance', {
        vehicle_id: opsContext.assigned_vehicle_id,
        maintenance_type: null,
        description: finalDescription,
        performed_by: user.id,
        performed_at: null,
        cost: null,
        next_due: null
      });

      setSuccess(true);
      setTimeout(() => navigate('/staff/dashboard'), 2000);
    } catch (err: any) {
      console.error('Server Refused Request:', err);
      const msg = err.response?.data || err.message || 'Transmission failed';
      alert(`Server Diagnostic Error:\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormLocked = !opsContext?.assigned_vehicle_id;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Ops</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center text-orange-500 shadow-xl shadow-orange-950/20">
                <Wrench size={32} />
             </div>
             <div>
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Request Maintenance</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Field Equipment & Fleet Support</p>
             </div>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl text-center">
               <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <Send size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 uppercase italic">Request Dispatched</h3>
               <p className="text-slate-400 text-sm">Tim Teknis telah menerima laporan kerusakan armada. Mohon tunggu investigasi teknisi.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Dynamic Vehicle Lock context */}
              {opsContext?.assigned_vehicle_id ? (
                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                              <Truck size={24} />
                          </div>
                          <div>
                              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Active Duty Unit Auto-Lock</div>
                              <div className="text-white font-black text-lg leading-none">{opsContext.assigned_vehicle}</div>
                          </div>
                      </div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20">Locked</div>
                  </div>
              ) : opsContext != null ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                      <AlertTriangle className="text-red-500 shrink-0" size={24} />
                      <div>
                          <div className="text-red-400 font-bold mb-1">NO ACTIVE VEHICLE ASSIGNED</div>
                          <div className="text-[10px] text-red-500/80 uppercase font-bold tracking-widest leading-relaxed">
                            System refused submission. You must check-in to a shift and select an operational vehicle before reporting maintenance tickets.
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-slate-800 animate-pulse h-20 rounded-2xl" />
              )}

              {/* Maintenance Class Dropdown Removed - Deferred to Team Leader */}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject / Component Defect</label>
                <div className="relative">
                  <Wrench className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFormLocked ? 'text-slate-700' : 'text-slate-500'}`} size={18} />
                  <input 
                    type="text" 
                    placeholder="e.g. Malfunction on foam turret valve"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                    disabled={isFormLocked || loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detailed Technical Description</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the nature of the malfunction or defect in detail so engineering can understand the scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all resize-none disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  disabled={isFormLocked || loading}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                 <button 
                   type="button" 
                   disabled={isFormLocked || loading}
                   className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white hover:border-slate-700 transition-all group disabled:opacity-50"
                 >
                    <Camera size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Attach Photo</span>
                 </button>
                 
                 <button 
                   type="submit"
                   disabled={isFormLocked || loading}
                   className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/20 transition-all disabled:opacity-50 group"
                 >
                    {loading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Submit Trouble Ticket</span>
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                 </button>
              </div>
            </form>
          )}
        </div>

        <AlertTriangle className="absolute -right-12 -bottom-12 w-48 h-48 text-orange-500/5 pointer-events-none" />
      </div>
    </div>
  );
}
