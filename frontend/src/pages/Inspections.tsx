import { useState, useEffect } from 'react';
import { Plus, History, ClipboardCheck, Truck, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/axios';

interface Vehicle {
    id: string;
    code: string;
    name: string;
    status: string;
}

interface Inspection {
    id: string;
    vehicle_id: string;
    tanggal: string;
    status: string;
    created_at: string;
}

export default function Inspections() {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [inspectDate, setInspectDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [insRes, vehRes] = await Promise.all([
                api.get('/inspections'),
                api.get('/vehicles')
            ]);
            setInspections(insRes.data);
            setVehicles(vehRes.data);
        } catch (err) {
            setError('Gagal mengambil data dari server operasional.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle) return;

        try {
            setSubmitting(true);
            await api.post('/inspections', {
                vehicle_id: selectedVehicle,
                tanggal: inspectDate,
                status: 'DRAFT'
            });
            setShowModal(false);
            fetchData(); // Refresh list otomatis
        } catch (err) {
            alert('Gagal membuat log inspeksi baru');
        } finally {
            setSubmitting(false);
        }
    };

    const getVehicleCode = (id: string) => {
        return vehicles.find(v => v.id === id)?.code || 'Unknown';
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ClipboardCheck className="text-blue-500" />
                        Vehicle Inspections
                    </h1>
                    <p className="text-slate-400 mt-1">Pemeriksaan kesiapan armada harian (Daily Check)</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-medium"
                >
                    <Plus size={20} />
                    Inspeksi Baru
                </button>
            </div>

            {/* Main Content Area (Glassmorphic Table) */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <History size={120} />
                </div>

                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    Log Riwayat Terakhir
                </h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-sm">Sinkronisasi data taktis...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-2">
                        <AlertCircle />
                        <span>{error}</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-sm">
                                    <th className="pb-4 font-medium uppercase tracking-wider">Unit Armada</th>
                                    <th className="pb-4 font-medium uppercase tracking-wider">Tanggal Check</th>
                                    <th className="pb-4 font-medium uppercase tracking-wider">Status Approval</th>
                                    <th className="pb-4 font-medium text-right lowercase italic">ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {inspections.length > 0 ? inspections.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                    <Truck size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{getVehicleCode(item.vehicle_id)}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 uppercase">UID: {item.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-slate-300 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-500" />
                                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    item.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="text-slate-400 hover:text-white transition-colors text-xs px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-500">
                                                View Report
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-600 italic text-sm">
                                            --- Belum ada riwayat inspeksi tercatat di sistem ---
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form Inspeksi */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
                        onClick={() => !submitting && setShowModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500"><Plus size={24} /></div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Create Inspection Log</h3>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Pilih Unit Armada</label>
                                <select
                                    required
                                    value={selectedVehicle}
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="">-- Pilih Kendaraan --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.code} - {v.name} ({v.status})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Tanggal Pemeriksaan</label>
                                <input
                                    type="date"
                                    required
                                    value={inspectDate}
                                    onChange={(e) => setInspectDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition-all font-semibold disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedVehicle}
                                    className="flex-1 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mulai Input Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
