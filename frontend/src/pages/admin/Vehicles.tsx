import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Loader2, Settings2, Trash2 } from 'lucide-react';
import { api } from '../../lib/axios';

interface Vehicle {
  id: string;
  code: string;
  name: string;
  vehicle_type: string | null;
  status: string;
  water_capacity_liters: string | null;
  foam_capacity_liters: string | null;
  dcp_capacity_kg: string | null;
  last_service_date: string | null;
  next_service_due: string | null;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    vehicle_type: 'ARFF_TRUCK',
    status: 'READY',
    water_capacity_liters: '',
    foam_capacity_liters: '',
    dcp_capacity_kg: '',
    last_service_date: '',
    next_service_due: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      vehicle_type: 'ARFF_TRUCK',
      status: 'READY',
      water_capacity_liters: '',
      foam_capacity_liters: '',
      dcp_capacity_kg: '',
      last_service_date: '',
      next_service_due: '',
    });
    setSelectedVehicleId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setForm({
      code: vehicle.code,
      name: vehicle.name,
      vehicle_type: vehicle.vehicle_type ?? 'ARFF_TRUCK',
      status: vehicle.status,
      water_capacity_liters: vehicle.water_capacity_liters ?? '',
      foam_capacity_liters: vehicle.foam_capacity_liters ?? '',
      dcp_capacity_kg: vehicle.dcp_capacity_kg ?? '',
      last_service_date: vehicle.last_service_date ?? '',
      next_service_due: vehicle.next_service_due ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        code: form.code,
        name: form.name,
        vehicle_type: form.vehicle_type,
        status: form.status,
        water_capacity_liters: form.water_capacity_liters || null,
        foam_capacity_liters: form.foam_capacity_liters || null,
        dcp_capacity_kg: form.dcp_capacity_kg || null,
        last_service_date: form.last_service_date || null,
        next_service_due: form.next_service_due || null,
      };

      if (selectedVehicleId) {
        await api.put(`/vehicles/${selectedVehicleId}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }

      setShowModal(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      alert(selectedVehicleId ? 'Failed to update vehicle' : 'Failed to add new vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Truck className="text-blue-500" />
            Asset Fleet Management
          </h1>
          <p className="text-slate-400 mt-1">Manage and monitor ARFF tactical vehicles</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/20 font-bold"
        >
          <Plus size={20} />
          Register Vehicle
        </button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-8 bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
          <div className="pl-4 text-slate-500"><Search size={20} /></div>
          <input 
            type="text" 
            placeholder="Search by code or unit name..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mb-2" />
            <span>Loading fleet data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-4 py-4">Unit Identity</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Capacity</th>
                  <th className="px-4 py-4">Service Due</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredVehicles.map(v => (
                  <tr key={v.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Truck size={24} />
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg leading-tight">{v.code}</div>
                          <div className="text-sm text-slate-500">{v.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {v.vehicle_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-300 space-y-1">
                      <div>Water: {v.water_capacity_liters ?? '—'} L</div>
                      <div>Foam: {v.foam_capacity_liters ?? '—'} L</div>
                      <div>DCP: {v.dcp_capacity_kg ?? '—'} kg</div>
                    </td>
                    <td className="px-4 py-5 text-slate-300">
                      {v.next_service_due ?? 'N/A'}
                    </td>
                    <td className="px-4 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        v.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        v.status === 'MAINTENANCE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                       <div className="flex justify-end gap-2 text-slate-500">
                          <button onClick={() => openEditModal(v)} className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition-all"><Settings2 size={18}/></button>
                          <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"><Trash2 size={18}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-8">
              {selectedVehicleId ? 'Edit Fleet Unit' : 'Register New Fleet Unit'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Vehicle Code</label>
                  <input 
                    required 
                    placeholder="E.g. ARFF-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.code}
                    onChange={e => setForm({...form, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Fleet Name</label>
                  <input 
                    required 
                    placeholder="E.g. Oshkosh Striker"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Water Capacity (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.water_capacity_liters}
                    onChange={e => setForm({...form, water_capacity_liters: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Foam Capacity (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.foam_capacity_liters}
                    onChange={e => setForm({...form, foam_capacity_liters: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">DCP Capacity (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.dcp_capacity_kg}
                    onChange={e => setForm({...form, dcp_capacity_kg: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Last Service Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.last_service_date}
                    onChange={e => setForm({...form, last_service_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Next Service Due</label>
                  <input
                    type="date"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.next_service_due}
                    onChange={e => setForm({...form, next_service_due: e.target.value})}
                  />
                </div>
              </div>

              <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Initial Status</label>
                 <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}
                 >
                    <option value="READY">READY OPERATIONAL</option>
                    <option value="MAINTENANCE">UNDER MAINTENANCE</option>
                    <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                 </select>
              </div>

              <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-bold uppercase transition-all hover:bg-slate-800">Cancel</button>
                 <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-blue-600 text-white font-bold uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={20}/> : selectedVehicleId ? 'Update Vehicle' : 'Commit Registry'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
