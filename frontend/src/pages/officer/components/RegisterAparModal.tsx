import { useState } from 'react';
import { Loader2, Navigation, Locate } from 'lucide-react';

interface RegisterAparModalProps {
  onClose: () => void;
  onSubmit: (form: any) => Promise<void>;
  submitting: boolean;
  locationStatus: string;
  locationAccuracy: number | null;
  captureLocation: () => Promise<any>;
}

export function RegisterAparModal({ 
  onClose, 
  onSubmit, 
  submitting, 
  locationStatus, 
  locationAccuracy, 
  captureLocation 
}: RegisterAparModalProps) {
  const [form, setForm] = useState({
    serial_number: '',
    agent_type: 'CO2',
    capacity_kg: '2.0',
    location_description: '',
    floor: '',
    building: '',
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: 'READY',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-2xl font-bold text-white mb-8">Register New APAR Unit</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Serial Number</label>
              <input
                required
                placeholder="E.g. APAR-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Agent Type</label>
              <select
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.agent_type}
                onChange={(e) => setForm({ ...form, agent_type: e.target.value })}
              >
                <option value="CO2">CO2</option>
                <option value="DCP">DCP</option>
                <option value="Foam">Foam</option>
                <option value="Water">Water</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Capacity (kg)</label>
              <input
                required
                type="number"
                step="0.1"
                min="0"
                placeholder="2.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.capacity_kg}
                onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Expiry Date</label>
              <input
                required
                type="date"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Location description</label>
              <input
                placeholder="Hangar area / terminal gate"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.location_description}
                onChange={(e) => setForm({ ...form, location_description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Building</label>
              <input
                placeholder="Main Hangar"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.building}
                onChange={(e) => setForm({ ...form, building: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Floor</label>
              <input
                placeholder="Ground"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Status</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="READY">READY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className={`p-6 rounded-3xl border transition-all ${
                locationStatus === 'CAPTURING' ? 'bg-orange-500/5 border-orange-500/20 animate-pulse' :
                locationStatus === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20' :
                locationStatus === 'ERROR' ? 'bg-red-500/5 border-red-500/20' :
                'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${locationStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                       <Navigation size={20} />
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Spatial Sync</div>
                        <div className="text-white font-bold text-sm">
                          {locationStatus === 'CAPTURING' ? 'Capturing High-Precision GPS...' :
                           locationStatus === 'SUCCESS' ? 'Accuracy Locked' :
                           locationStatus === 'ERROR' ? 'GPS Signal Blocked' : 'Waiting for Device...'}
                        </div>
                     </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => captureLocation()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Locate size={14} />
                    Refresh
                  </button>
                </div>

                {form.latitude && (
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">LATITUDE</div>
                        <div className="text-xs font-mono text-blue-400">{form.latitude?.toFixed(8) || '0.00000000'}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">LONGITUDE</div>
                        <div className="text-xs font-mono text-blue-400">{form.longitude?.toFixed(8) || '0.00000000'}</div>
                     </div>
                    <div className="col-span-2 flex items-center gap-2 mt-1">
                       <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">CONFIDENCE:</div>
                       <div className={`text-[10px] font-bold ${locationAccuracy && locationAccuracy < 10 ? 'text-emerald-500' : 'text-orange-500'}`}>
                         {locationAccuracy ? `+/- ${locationAccuracy.toFixed(1)} meters` : 'Calculating...'}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-bold uppercase transition-all hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-orange-600 text-white font-bold uppercase shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Register APAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
