import { useState, useEffect } from 'react';
import { 
  Plane, 
  Plus, 
  Loader2, 
  Navigation, 
  Search,
  ArrowRightLeft,
  Shield
} from 'lucide-react';
import { api } from '../../lib/axios';

interface Flight {
  id: string;
  flight_number: string;
  origin: string | null;
  destination: string | null;
  runway: string;
  actual_time: string;
}

export default function Flights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    flight_number: '',
    origin: '',
    destination: '',
    runway: 'RUNWAY-04',
    actual_time: new Date().toISOString().slice(0, 16)
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const res = await api.get('/flights');
      setFlights(res.data);
    } catch (err) {
      console.error('Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/flights', {
        ...form,
        actual_time: new Date(form.actual_time).toISOString()
      });
      setShowModal(false);
      setForm({
        flight_number: '', origin: '', destination: '', 
        runway: 'RUNWAY-04', actual_time: new Date().toISOString().slice(0, 16)
      });
      fetchFlights();
    } catch (err) {
      alert('Gagal menambah jadwal penerbangan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFlights = flights.filter(f => 
    f.flight_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 italic uppercase tracking-tighter">
            <Plane className="text-blue-500 rotate-45" />
            Flight Watch & Standby
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">ICAO-Certified real-time situational awareness</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/20 font-black uppercase text-xs tracking-widest"
        >
          <Plus size={20} />
          Register Movement
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-3 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8">
               <div className="flex items-center gap-4 mb-8 bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
                  <div className="pl-4 text-slate-500"><Search size={20} /></div>
                  <input 
                    type="text" 
                    placeholder="Search by flight number (e.g. GA123)..."
                    className="flex-1 bg-transparent border-none text-white focus:outline-none p-3 font-medium placeholder:text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Syncing flight data...</span>
                  </div>
               ) : (
                  <div className="space-y-4">
                    {filteredFlights.map(f => (
                      <div key={f.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6 group">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all shadow-xl">
                              <Plane size={32} className="rotate-45" />
                           </div>
                           <div>
                              <div className="text-3xl font-black text-white leading-tight uppercase italic">{f.flight_number}</div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                                 <Navigation size={12} className="text-blue-500" />
                                 {f.origin || 'N/A'} <ArrowRightLeft size={10} className="mx-1" /> {f.destination || 'N/A'}
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 items-center flex-1 lg:flex-none">
                           <div className="text-right xl:text-left">
                              <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Designated RWY</div>
                              <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 rounded-lg font-mono font-black text-xs">
                                 {f.runway}
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Schedule Time</div>
                              <div className="text-white font-mono font-black text-xl">
                                 {new Date(f.actual_time).toLocaleTimeString('id-ID', { hour12: false })}
                              </div>
                           </div>
                           <div className="col-span-2 lg:col-span-1">
                              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest shadow-xl ring-1 ring-white/5">
                                 <Shield size={14} /> Standby Ready
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8 relative overflow-hidden group h-64 flex flex-col justify-between">
               <Navigation className="absolute -right-8 -top-8 w-40 h-40 text-blue-500/10 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter relative z-10">Runway Status</h3>
               <div className="space-y-4 relative z-10">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center group/item hover:bg-emerald-500/20 transition-all">
                     <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">RWY-04</span>
                     <span className="px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">READY</span>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex justify-between items-center group/item hover:bg-blue-500/20 transition-all">
                     <span className="text-xs font-black text-blue-500 uppercase tracking-widest">RWY-22</span>
                     <span className="px-3 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">ACTIVE</span>
                  </div>
               </div>
            </div>

            <div className="bg-blue-600 shadow-2xl shadow-blue-500/20 rounded-4xl p-8 text-white relative overflow-hidden group">
               <div className="absolute inset-0 bg-linear-to-br from-blue-400/20 to-transparent" />
               <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
               <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl">
                     <Activity size={24} />
                  </div>
                  <h4 className="text-2xl font-black italic uppercase leading-none tracking-tighter">Situational<br/>Awareness</h4>
                  <p className="text-sm text-blue-100/80 font-medium leading-relaxed">Jadwal penerbangan tersinkronisasi otomatis dengan server airside Hang Nadim.</p>
               </div>
            </div>
         </div>
      </div>

      {/* Register Flight Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-white mb-8 italic uppercase tracking-tighter text-center">Register Movement</h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Flight Number</label>
                <input required placeholder="E.g. JT123 / GA900" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg placeholder:text-slate-800" value={form.flight_number} onChange={e => setForm({...form, flight_number: e.target.value})}/>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Origin</label>
                  <input placeholder="E.g. CGK" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Destination</label>
                  <input placeholder="E.g. BTH" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Runway</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold" value={form.runway} onChange={e => setForm({...form, runway: e.target.value})}>
                    <option value="RUNWAY-04">RUNWAY 04</option>
                    <option value="RUNWAY-22">RUNWAY 22</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Actual Time</label>
                  <input type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm font-bold" value={form.actual_time} onChange={e => setForm({...form, actual_time: e.target.value})}/>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-800">Cancel</button>
                 <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={20}/> : 'Initialize Standby'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity(props: any) {
  return <Shield {...props} />; // Placeholder check
}
