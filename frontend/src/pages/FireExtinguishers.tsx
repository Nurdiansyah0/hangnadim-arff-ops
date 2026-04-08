import { useState, useEffect } from 'react';
import { Flame, Plus, Search, Loader2, Settings2, Trash2, Map as MapIcon, List } from 'lucide-react';
import { api } from '../lib/axios';
import AparMap from '../components/gis/AparMap';

interface FireExtinguisher {
  id: string;
  serial_number: string;
  agent_type: string;
  capacity_kg: number;
  location_description: string | null;
  floor: string | null;
  building: string | null;
  expiry_date: string;
  status: string;
}

export default function FireExtinguishers() {
  const [items, setItems] = useState<FireExtinguisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'TABLE' | 'MAP'>('TABLE');

  const [form, setForm] = useState({
    serial_number: '',
    agent_type: 'CO2',
    capacity_kg: '2.0',
    location_description: '',
    floor: '',
    building: '',
    expiry_date: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/fire-extinguishers');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch fire extinguishers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post('/fire-extinguishers', {
        serial_number: form.serial_number,
        agent_type: form.agent_type,
        capacity_kg: parseFloat(form.capacity_kg),
        location_description: form.location_description || null,
        floor: form.floor || null,
        building: form.building || null,
        expiry_date: form.expiry_date,
        last_inspection_date: null,
        status: form.status,
        photo_url: null,
      });
      setShowModal(false);
      setForm({
        serial_number: '',
        agent_type: 'CO2',
        capacity_kg: '2.0',
        location_description: '',
        floor: '',
        building: '',
        expiry_date: '',
        status: 'ACTIVE',
      });
      fetchItems();
    } catch (err) {
      alert('Gagal menambah APAR baru. Pastikan tanggal expiry tidak di masa lalu.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.agent_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.building?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Flame className="text-orange-500" />
            Fire Extinguishers
          </h1>
          <p className="text-slate-400 mt-1">Track APAR units by serial number, expiry, location, and status.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 font-bold"
        >
          <Plus size={20} />
          Register APAR
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-800 backdrop-blur-md">
          <button 
            onClick={() => setViewMode('TABLE')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === 'TABLE' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List size={18} />
            LIST VIEW
          </button>
          <button 
            onClick={() => setViewMode('MAP')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === 'MAP' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MapIcon size={18} />
            GIS MAP
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           Live spatial data enabled
        </div>
      </div>

      {viewMode === 'MAP' ? (
        <AparMap />
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-8 bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
          <div className="pl-4 text-slate-500"><Search size={20} /></div>
          <input
            type="text"
            placeholder="Search serial, agent type, or building..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mb-2" />
            <span>Loading APAR data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-4 py-4">Serial / Agent</th>
                  <th className="px-4 py-4">Capacity</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Expiry</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                          <Flame size={24} />
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg leading-tight">{item.serial_number}</div>
                          <div className="text-sm text-slate-500">{item.agent_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {item.capacity_kg} kg
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="text-sm text-slate-300">{item.building || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{item.location_description || item.floor || 'Unknown'}</div>
                    </td>
                    <td className="px-4 py-5 text-slate-200">{item.expiry_date}</td>
                    <td className="px-4 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        item.status === 'MAINTENANCE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        item.status === 'EXPIRED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-slate-600/20 text-slate-200 border-slate-700/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition-all"><Settings2 size={18} /></button>
                        <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-8">Register New APAR Unit</h3>
            <form onSubmit={handleCreate} className="space-y-6">
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
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-bold uppercase transition-all hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-orange-600 text-white font-bold uppercase shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Register APAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
