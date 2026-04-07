import { useState, useEffect } from 'react';
import { Plus, History, ClipboardCheck, Truck, Calendar, Loader2, AlertCircle, X } from 'lucide-react';
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

interface InspectionTemplate {
    id: number;
    name: string;
    target_type: string;
    frequency: string;
}

interface TemplateItem {
    id: number;
    template_id: number;
    category: string;
    item_name: string;
    item_order: number;
}

interface InspectionResult {
    id: string;
    inspection_id: string;
    inspection_date: string;
    template_item_id: number;
    result: string;
    notes: string | null;
    photo_url: string | null;
    created_at: string;
}

interface InspectionDetail {
    inspection: Inspection;
    results: InspectionResult[];
}

type ResultOption = 'PASS' | 'FAIL' | 'N_A';

interface ChecklistEntry {
    result: ResultOption;
    notes: string;
}

export default function Inspections() {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
    const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState<InspectionDetail | null>(null);

    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [inspectDate, setInspectDate] = useState(new Date().toISOString().split('T')[0]);
    const [checklistResults, setChecklistResults] = useState<Record<number, ChecklistEntry>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (!selectedTemplate) {
            setTemplateItems([]);
            setChecklistResults({});
            return;
        }

        fetchTemplateItems(Number(selectedTemplate));
    }, [selectedTemplate]);

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

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/inspections/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error('Failed to load inspection templates', err);
        }
    };

    const fetchTemplateItems = async (templateId: number) => {
        try {
            const res = await api.get(`/inspections/templates/${templateId}/items`);
            setTemplateItems(res.data);
            const initial: Record<number, ChecklistEntry> = {};
            res.data.forEach((item: TemplateItem) => {
                initial[item.id] = { result: 'N_A', notes: '' };
            });
            setChecklistResults(initial);
        } catch (err) {
            console.error('Failed to load template items', err);
            setTemplateItems([]);
        }
    };

    const openModal = () => {
        setSelectedVehicle('');
        setSelectedTemplate('');
        setInspectDate(new Date().toISOString().split('T')[0]);
        setChecklistResults({});
        setShowModal(true);
    };

    const resetModal = () => {
        setSelectedVehicle('');
        setSelectedTemplate('');
        setInspectDate(new Date().toISOString().split('T')[0]);
        setTemplateItems([]);
        setChecklistResults({});
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle || !selectedTemplate) return;

        try {
            setSubmitting(true);
            const results = templateItems.map(item => ({
                template_item_id: item.id,
                result: checklistResults[item.id]?.result || 'N_A',
                notes: checklistResults[item.id]?.notes || null,
                photo_url: null,
            }));

            await api.post('/inspections', {
                vehicle_id: selectedVehicle,
                tanggal: inspectDate,
                status: 'DRAFT',
                template_id: Number(selectedTemplate),
                results,
            });
            setShowModal(false);
            resetModal();
            fetchData();
        } catch (err) {
            alert('Gagal membuat log inspeksi baru');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewReport = async (inspectionId: string) => {
        try {
            const res = await api.get(`/inspections/${inspectionId}`);
            setDetailData(res.data);
            setShowDetailModal(true);
        } catch (err) {
            alert('Gagal mengambil detail inspeksi');
        }
    };

    const getVehicleCode = (id: string) => {
        return vehicles.find(v => v.id === id)?.code || 'Unknown';
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ClipboardCheck className="text-blue-500" />
                        Vehicle Inspections
                    </h1>
                    <p className="text-slate-400 mt-1">Pemeriksaan kesiapan armada harian (Daily Check)</p>
                </div>

                <button
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-medium"
                >
                    <Plus size={20} />
                    Inspeksi Baru
                </button>
            </div>

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
                                                {formatDate(item.tanggal)}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={() => handleViewReport(item.id)}
                                                className="text-slate-400 hover:text-white transition-colors text-xs px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-500"
                                            >
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => !submitting && setShowModal(false)} />
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500"><Plus size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Create Inspection Log</h3>
                                    <p className="text-sm text-slate-500">Pilih template checklist lalu isi hasil per item.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Pilih Template Checklist</label>
                                <select
                                    required
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="">-- Pilih Template --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.frequency})</option>
                                    ))}
                                </select>
                            </div>

                            {templateItems.length > 0 && (
                                <div className="grid gap-4">
                                    <div className="text-sm text-slate-300 font-semibold">Checklist Items</div>
                                    {templateItems.map(item => (
                                        <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                                                <div>
                                                    <div className="text-white font-semibold">{item.item_name}</div>
                                                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{item.category}</div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(['PASS', 'FAIL', 'N_A'] as const).map(option => (
                                                        <button
                                                            type="button"
                                                            key={option}
                                                            onClick={() => setChecklistResults(prev => ({
                                                                ...prev,
                                                                [item.id]: {
                                                                    result: option,
                                                                    notes: prev[item.id]?.notes || ''
                                                                }
                                                            }))}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition ${checklistResults[item.id]?.result === option ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Catatan</label>
                                                <textarea
                                                    value={checklistResults[item.id]?.notes || ''}
                                                    onChange={(e) => setChecklistResults(prev => ({
                                                        ...prev,
                                                        [item.id]: {
                                                            result: prev[item.id]?.result || 'N_A',
                                                            notes: e.target.value,
                                                        }
                                                    }))}
                                                    placeholder="Opsional: Tambahkan catatan pada item ini"
                                                    className="w-full min-h-[80px] bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                    disabled={submitting || !selectedVehicle || !selectedTemplate}
                                    className="flex-1 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mulai Input Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && detailData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowDetailModal(false)} />
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Inspection Report</h3>
                                <p className="text-sm text-slate-500">{getVehicleCode(detailData.inspection.vehicle_id)} • {formatDate(detailData.inspection.tanggal)}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            {detailData.results.map(result => {
                                const item = templateItems.find(i => i.id === result.template_item_id);
                                return (
                                    <div key={result.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-4">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                            <div>
                                                <div className="text-white font-semibold">{item?.item_name ?? `Item #${result.template_item_id}`}</div>
                                                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{item?.category ?? 'Checklist item'}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${result.result === 'PASS' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : result.result === 'FAIL' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                                                {result.result}
                                            </span>
                                        </div>
                                        {result.notes && (
                                            <div className="mt-3 text-sm text-slate-300">
                                                <strong>Notes:</strong> {result.notes}
                                            </div>
                                        )}
                                        {result.photo_url && (
                                            <div className="mt-3 text-sm text-slate-300">
                                                <strong>Photo:</strong> <a className="text-blue-400 hover:underline" href={result.photo_url} target="_blank" rel="noreferrer">View</a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
