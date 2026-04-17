import { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Loader2, Mail, Shield, Smartphone } from 'lucide-react';
import { api } from '../../lib/axios';

interface Personnel {
  id: string;
  nip_nik: string | null;
  full_name: string | null;
  position_id: number | null;
  status: string | null;
  shift?: string | null;
  employment_status?: string | null;
}

interface Position {
  id: number;
  name: string;
}

export default function Personnel() {
  const [staff, setStaff] = useState<Personnel[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    nip_nik: '',
    full_name: '',
    position_id: '',
    status: 'ACTIVE',
    shift: '',
    employment_status: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, posRes] = await Promise.all([
        api.get('/personnel'),
        api.get('/personnel/positions')
      ]);
      setStaff(Array.isArray(pRes.data) ? pRes.data : []);
      setPositions(Array.isArray(posRes.data) ? posRes.data : []);
    } catch (err) {
      console.error('Failed to fetch personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/personnel', {
        ...form,
        position_id: form.position_id ? parseInt(form.position_id) : null,
        shift: form.shift || null,
        employment_status: form.employment_status || null
      });
      setShowModal(false);
      setForm({ nip_nik: '', full_name: '', position_id: '', status: 'ACTIVE', shift: '', employment_status: '' });
      fetchData();
    } catch (err) {
      alert('Failed to add new personnel');
    } finally {
      setSubmitting(false);
    }
  };

  const getPositionName = (id: number | null) => {
    return positions.find(p => p.id === id)?.name || 'General Staff';
  };

  const filteredStaff = staff.filter(s => 
    (s.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (s.nip_nik?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="text-blue-500" />
            Personnel & Ops Resources
          </h1>
          <p className="text-slate-400 mt-1">Manage ARFF force deployments and profiles</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/20 font-bold"
        >
          <UserPlus size={20} />
          Add Personnel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
               <div className="flex items-center gap-4 mb-8 bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
                  <div className="pl-4 text-slate-500"><Search size={20} /></div>
                  <input 
                    type="text" 
                    placeholder="Search by NIP or Name..."
                    className="flex-1 bg-transparent border-none text-white focus:outline-none p-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin mb-2" />
                    <span>Loading resources...</span>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStaff.map(s => (
                      <div key={s.id} className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/50 transition-all flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-black">
                          {s.full_name ? s.full_name[0] : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors">{s.full_name || 'Anonymous'}</h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">NIP: {s.nip_nik || 'N/A'}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                             <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                                {getPositionName(s.position_id)}
                             </span>
                             {s.shift && (
                               <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                                 {s.shift}
                               </span>
                             )}
                             <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                             }`}>
                                {s.status || 'UNKNOWN'}
                             </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 text-blue-400 space-y-4">
               <h4 className="font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]"><Shield size={14}/> Resource Insights</h4>
               <div className="text-3xl font-black">{staff.length}</div>
               <p className="text-xs text-slate-400">Total registered Personnel available for rotation.</p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
               <h4 className="text-white font-bold text-sm mb-4">Quick Shortcuts</h4>
               <div className="space-y-2">
                  {[
                    { icon: Mail, label: 'Email Report' },
                    { icon: Shield, label: 'Permission Audit' },
                    { icon: Smartphone, label: 'PWA Mobile Sync' }
                  ].map(item => (
                    <button key={item.label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-400 text-xs transition-all">
                       <item.icon size={16}/>
                       {item.label}
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Register Personnel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-8">Onboard New Personnel</h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">NIP / NIK Unique ID</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.nip_nik} onChange={e => setForm({...form, nip_nik: e.target.value})}/>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Full Legal Name</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}/>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Assignment Position</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={form.position_id} onChange={e => setForm({...form, position_id: e.target.value})}>
                  <option value="">-- Select Deployment --</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-bold uppercase transition-all hover:bg-slate-800">Cancel</button>
                 <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-bold uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={20}/> : 'Execute Onboarding'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
