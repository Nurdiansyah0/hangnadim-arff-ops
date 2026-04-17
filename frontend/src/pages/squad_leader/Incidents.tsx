import { useState, useEffect } from 'react';
import { 
  Flame, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Users, 
  Loader2,
  TrendingUp,
  History
} from 'lucide-react';
import { api } from '../../lib/axios';
import GridSelector from '../../components/common/GridSelector';

interface Incident {
  id: string;
  description: string;
  location: string | null;
  dispatch_time: string;
  arrival_time: string | null;
  resolved_at: string | null;
  severity: string | null;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [gridCoord, setGridCoord] = useState('');
  const [landmark, setLandmark] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/incidents');
      setIncidents(res.data);
    } catch (err) {
      console.error('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/incidents', {
        description,
        location,
        severity,
        dispatch_time: new Date().toISOString()
      });
      setShowModal(false);
      setDescription('');
      setLocation('');
      fetchIncidents();
    } catch (err) {
      alert('Failed to report new incident');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityStyle = (sev: string | null) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const handleRecordArrival = async (id: string) => {
    try {
      await api.patch(`/incidents/${id}/arrival`, {
        arrival_time: new Date().toISOString()
      });
      fetchIncidents();
    } catch (err) {
      alert('Failed to record arrival time');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.patch(`/incidents/${id}/resolve`, {
        resolved_at: new Date().toISOString()
      });
      fetchIncidents();
    } catch (err) {
      alert('Failed to resolve incident');
    }
  };

  const activeIncidents = incidents.filter(i => !i.resolved_at);
  const resolvedIncidents = incidents.filter(i => i.resolved_at);

  return (
    <div className="space-y-8 pb-12">
      {/* ... rest of the header ... */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/30">
              <Flame size={32} className="text-white animate-pulse" />
            </div>
            INCIDENT RESPONSE
          </h1>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            ARFF Tactical Command Unit — Real-time emergency field logs
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-3 flex items-center gap-4">
            <div className="text-center border-r border-slate-800 pr-4">
              <div className="text-2xl font-bold text-red-500">{activeIncidents.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{resolvedIncidents.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cleared</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 font-black tracking-widest text-sm"
          >
            <Plus size={20} strokeWidth={3} />
            REPORT EMERGENCY
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            Current Active Alerts
          </h2>

          {loading ? (
             <div className="h-64 flex items-center justify-center bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
                <Loader2 className="animate-spin text-slate-600" size={32} />
             </div>
          ) : activeIncidents.length > 0 ? (
            activeIncidents.map(incident => (
              <div key={incident.id} className="group bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-red-500/50 rounded-3xl p-6 transition-all shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Flame size={80} />
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border ${getSeverityStyle(incident.severity)}`}>
                        {incident.severity} PRIORITY
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">UID: {incident.id.slice(0, 8)}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                      {incident.description}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                        <MapPin size={16} className="text-red-500" />
                        {incident.location || 'Unknown Coordinates'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                        <Clock size={16} className="text-blue-500" />
                        DISPATCH: {new Date(incident.dispatch_time).toLocaleTimeString('en-GB', { hour12: false })}
                      </div>
                      {incident.arrival_time && (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-in fade-in zoom-in">
                          <CheckCircle2 size={16} />
                          ARRIVAL: {new Date(incident.arrival_time).toLocaleTimeString('en-GB', { hour12: false })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col justify-end gap-3 shrink-0">
                    {!incident.arrival_time && (
                      <button 
                        onClick={() => handleRecordArrival(incident.id)}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
                      >
                        <Clock size={16} />
                        Record Arrival
                      </button>
                    )}
                    <button 
                      onClick={() => handleResolve(incident.id)}
                      className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                      <CheckCircle2 size={16} />
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
              <AlertCircle className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Clear Horizon — No Active Incidents</p>
            </div>
          )}
        </div>

        {/* Right: History & Briefing */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
              <History size={16} />
              Recent Clearances
            </h2>
            
            <div className="space-y-4">
              {resolvedIncidents.slice(0, 5).map(incident => (
                <div key={incident.id} className="flex gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all group">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold truncate group-hover:text-emerald-400">{incident.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(incident.dispatch_time).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {resolvedIncidents.length === 0 && <p className="text-center text-xs text-slate-600 py-4">No recent history</p>}
            </div>
          </div>

          <div className="bg-blue-600 shadow-xl shadow-blue-600/20 rounded-3xl p-6 text-white overflow-hidden relative group">
            <TrendingUp className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 group-hover:scale-110 transition-transform" />
            <h3 className="font-black text-lg tracking-tight mb-2">Performance Analytics</h3>
            <p className="text-sm text-blue-100/80 leading-relaxed mb-4">Your response time is 12% faster than last month. Keep up the high readiness status.</p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors uppercase tracking-widest">View Stats</button>
          </div>
        </div>
      </div>

      {/* EMERGENCY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => !submitting && setShowModal(false)}
          />
          <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-red-500/30 rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(239,68,68,0.15)] animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg ring-4 ring-red-600/20"><Flame size={28}/></div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Emergency Entry</h3>
                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Protocol Alpha — Immediate Reporting</p>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2 text-center">Threat Severity</label>
                  <select 
                    required
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-red-500/20 appearance-none font-bold text-center"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2 text-center">Precise Grid Location (Hang Nadim Grid Map)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                     <GridSelector selected={gridCoord} onSelect={(c) => {
                       setGridCoord(c);
                       setLocation(`${c} — ${landmark || ''}`);
                     }} />
                     <div className="space-y-4">
                        <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Landmark / Zone Info</label>
                        <input 
                          type="text"
                          required
                          placeholder="E.g. Runway 04, Hangar 2, Engine 1"
                          value={landmark}
                          onChange={(e) => {
                            setLandmark(e.target.value);
                            setLocation(`${gridCoord || ''} — ${e.target.value}`);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-5 py-6 focus:outline-none focus:ring-4 focus:ring-red-500/20 font-bold placeholder:text-slate-900 italic"
                        />
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 border-dashed">
                           <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Target Lock:</div>
                           <div className="text-sm font-black text-blue-500 uppercase italic">
                              {gridCoord || '??'} / {landmark || 'UNKNOWN ZONE'}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Situation Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the nature of the emergency..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-3xl p-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all resize-none placeholder:text-slate-800"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-5 rounded-2xl border-2 border-slate-800 text-slate-500 hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-xs"
                >
                  Abort Entry
                </button>
                <button 
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="flex-1 px-4 py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-2xl shadow-red-900/50 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'EXECUTE DISPATCH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
