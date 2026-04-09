import { useState, useEffect } from 'react';
import { Plus, History, ClipboardCheck, Truck, Calendar, Loader2, AlertCircle, X } from 'lucide-react';
import { api } from '../lib/axios';

interface Vehicle {
    id: string;
    code: string;
    name: string;
    status: string;
    vehicle_type?: string;
}

interface Inspection {
    id: string;
    vehicle_id: string | null;
    fire_extinguisher_id: string | null;
    tanggal: string;
    status: string;
    created_at: string;
    // Joined fields
    inspector_name?: string;
    vehicle_code?: string;
    fire_extinguisher_serial?: string;
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
    // Joined fields
    item_name?: string;
    category?: string;
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

interface OperationalContext {
    shift_name: string | null;
    duty_position: string | null;
    assigned_vehicle: string | null;
    assigned_vehicle_id: string | null;
    duty_status: string;
}

export default function Inspections() {
    const getLocalISODate = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().split('T')[0];
    };

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
    const [inspectDate, setInspectDate] = useState(getLocalISODate());
    const [checklistResults, setChecklistResults] = useState<Record<number, ChecklistEntry>>({});
    const [submitting, setSubmitting] = useState(false);
    const [opsContext, setOpsContext] = useState<OperationalContext | null>(null);

    useEffect(() => {
        fetchData();
        fetchTemplates();
        fetchOpsContext();
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
            setError('Failed to fetch data from operational server.');
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

    const fetchOpsContext = async () => {
        try {
            const res = await api.get('/auth/me/context');
            setOpsContext(res.data);
            
            // Auto-select assigned vehicle if it exists
            if (res.data.assigned_vehicle_id) {
                const vid = res.data.assigned_vehicle_id;
                setSelectedVehicle(vid);
                
                // Intelligent Template Selection
                const vehicle = vehicles.find(v => v.id === vid);
                if (vehicle) {
                    const type = vehicle.vehicle_type || '';
                    const isAmbulance = type === 'RESCUE' || vehicle.code.startsWith('AMB');
                    
                    const templateName = isAmbulance ? 'Daily Ambulance Check' : 'Daily Vehicle Check (ARFF)';
                    const targetTemplate = templates.find(t => t.name === templateName);
                    
                    if (targetTemplate) {
                        setSelectedTemplate(targetTemplate.id.toString());
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch operational context', err);
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
        // Re-fetch context to ensure latest assignment is picked up
        fetchOpsContext();
        
        if (!opsContext?.assigned_vehicle_id) {
            alert('SYSTEM ACCESS DENIED: No active vehicle assignment found. Please perform "Shift Check-in" from the Dashboard first to proceed with the audit.');
            return;
        }

        setSelectedVehicle(opsContext.assigned_vehicle_id);
        
        // Intelligent Template Selection logic (locked)
        const vehicle = vehicles.find(v => v.id === opsContext.assigned_vehicle_id);
        if (vehicle) {
            const type = vehicle.vehicle_type || '';
            const isAmbulance = type === 'RESCUE' || vehicle.code.startsWith('AMB');
            const templateName = isAmbulance ? 'Daily Ambulance Check' : 'Daily Vehicle Check (ARFF)';
            const targetTemplate = templates.find(t => t.name === templateName);
            if (targetTemplate) {
                setSelectedTemplate(targetTemplate.id.toString());
            } else {
                setSelectedTemplate('');
            }
        }

        setInspectDate(getLocalISODate());
        setChecklistResults({});
        setShowModal(true);
    };

    const resetModal = () => {
        if (!opsContext?.assigned_vehicle_id) {
            setSelectedVehicle('');
        }
        setSelectedTemplate('');
        setInspectDate(getLocalISODate());
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
        } catch (err: any) {
            const msg = err.response?.data || 'Failed to create new inspection log';
            alert(msg);
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
            alert('Failed to fetch inspection details');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };



    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-GB', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Truck className="text-blue-500" />
                        Vehicle Fleet Audit
                    </h1>
                    <p className="text-slate-400 mt-1">Daily vehicle readiness checks (ARFF Fleet)</p>
                </div>

                <button
                    onClick={openModal}
                    className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-[11px] group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    New Inspection Audit
                </button>
            </div>

            {opsContext?.assigned_vehicle && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Truck size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-blue-500">Current Assignment</div>
                            <div className="text-white font-bold text-lg">{opsContext.assigned_vehicle}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Duty Position</div>
                        <div className="text-blue-400 font-bold">{opsContext.duty_position || 'UNASSIGNED'}</div>
                    </div>
                </div>
            )}

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <History size={120} />
                </div>

                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        Recent History Logs
                    </h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-2" />
                            <span className="text-sm">Synchronizing tactical data...</span>
                        </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-2">
                        <AlertCircle />
                        <span>{error}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {inspections.filter(item => item.vehicle_id !== null).length > 0 ? inspections.filter(item => item.vehicle_id !== null).map((item) => (
                            <div key={item.id} className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4 group hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-base">{item.vehicle_code || 'Unknown Vehicle'}</div>
                                            <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">UID: {item.id.slice(0, 8)}</div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date Logged</span>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                                            <Calendar size={14} className="text-slate-400" />
                                            {formatDate(item.tanggal)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col border-l border-slate-800/50 pl-3">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Inspector</span>
                                        <div className="text-xs text-blue-400 font-bold truncate">
                                            {item.inspector_name || 'System Analyst'}
                                        </div>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => handleViewReport(item.id)}
                                    className="w-full mt-2 bg-slate-800/30 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl border border-slate-700 transition-colors"
                                >
                                    Open Details
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-1 lg:col-span-2 py-20 text-center text-slate-500 italic text-sm">
                                --- No vehicle inspection history recorded in system ---
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => !submitting && setShowModal(false)} />
                    <div className="relative w-full h-[95vh] md:h-auto max-w-2xl bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in duration-300 flex flex-col md:max-h-[90vh]">
                        {/* Header - Fixed */}
                        <div className="p-8 pb-4 border-b border-slate-800/50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500"><Plus size={24} /></div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Create Inspection Log</h3>
                                    <p className="text-sm text-slate-500">Fill in inspection results for each task item.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
                            {/* Body - Scrollable */}
                            <div className="p-8 pt-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {opsContext?.assigned_vehicle_id ? (
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 ml-1">Active Duty Assignment</label>
                                            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                                                    <Truck size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-black text-lg leading-none">{opsContext.assigned_vehicle}</div>
                                                    <div className="text-[10px] text-blue-400 font-bold uppercase mt-1">Locked to Duty Assignment</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                            Assigned Vehicle Unit 
                                        </label>
                                        <div className="relative">
                                            <select
                                                required
                                                disabled={true}
                                                value={selectedVehicle}
                                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-blue-500/30 text-white rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-not-allowed opacity-80"
                                            >
                                                <option value="">-- No Unit Assigned --</option>
                                                {vehicles.map(v => (
                                                    <option key={v.id} value={v.id}>{v.code} - {v.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 uppercase italic">Locked</div>
                                        </div>
                                    </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Inspection Date</label>
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                        Audit Protocol (Automatic)
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            disabled={true}
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-emerald-500/30 text-white rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-not-allowed opacity-80"
                                        >
                                            <option value="">-- Resolving Protocol... --</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase italic">Automated</div>
                                    </div>
                                </div>

                                {templateItems.length > 0 && (
                                    <div className="grid gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-slate-300 font-bold uppercase tracking-widest">Audit Items</div>
                                            <div className="text-[10px] font-black text-slate-500 px-2 py-1 bg-slate-800 rounded-md">
                                                PROGRESS: {Object.keys(checklistResults).filter(k => checklistResults[Number(k)].result !== 'N_A').length} / {templateItems.length}
                                            </div>
                                        </div>
                                        {templateItems.map(item => (
                                            <div key={item.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                                    <div>
                                                        <div className="text-white font-bold text-sm tracking-tight">{item.item_name}</div>
                                                        <div className="text-[10px] uppercase tracking-[0.2em] text-blue-500/80 font-black mt-0.5">{item.category}</div>
                                                    </div>
                                                    <div className="flex gap-1.5 p-1 bg-slate-900 rounded-lg w-fit">
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
                                                                className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                                                    checklistResults[item.id]?.result === option 
                                                                    ? (option === 'PASS' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : option === 'FAIL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-700 text-white') 
                                                                    : 'text-slate-500 hover:text-slate-300'
                                                                }`}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <textarea
                                                        value={checklistResults[item.id]?.notes || ''}
                                                        onChange={(e) => setChecklistResults(prev => ({
                                                            ...prev,
                                                            [item.id]: {
                                                                result: prev[item.id]?.result || 'N_A',
                                                                notes: e.target.value,
                                                            }
                                                        }))}
                                                        placeholder="Add inspection notes here (optional)..."
                                                        className="w-full min-h-[70px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer - Fixed */}
                            <div className="p-8 pt-4 border-t border-slate-800/50 bg-slate-900/50 flex gap-3">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedVehicle || !selectedTemplate}
                                    className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <ClipboardCheck size={16} className="group-hover:scale-110 transition-transform" />
                                            Submit & Finalize Audit
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && detailData && (
                <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowDetailModal(false)} />
                    <div className="relative w-full h-[95vh] md:h-auto max-w-2xl bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in duration-300 flex flex-col md:max-h-[90vh]">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white italic tracking-tighter uppercase">Inspection Report</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                  <span className="text-blue-500 font-black">
                                    {detailData.inspection.vehicle_code || 'UNIT'}
                                  </span> • {formatDateTime(detailData.inspection.created_at)}
                                </p>
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                                  Inspector: <span className="text-slate-300">{detailData.inspection.inspector_name || 'Authorized Personnel'}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {detailData.results.map(result => (
                                <div key={result.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 group hover:border-slate-700 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <div>
                                            <div className="text-white font-bold">{result.item_name || `Item #${result.template_item_id}`}</div>
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">{result.category || 'GENERAL CHECK'}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                             result.result === 'PASS' 
                                             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                             : result.result === 'FAIL' 
                                             ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                                             : 'bg-slate-800 text-slate-400 border-slate-700'
                                           }`}>
                                               {result.result}
                                           </span>
                                        </div>
                                    </div>
                                    {result.notes && (
                                        <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 text-xs text-slate-400 italic leading-relaxed">
                                            <span className="text-slate-500 font-bold uppercase text-[9px] block mb-1 not-italic tracking-widest">Technician Notes:</span>
                                            "{result.notes}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           <div>Audit Trail ID: {detailData.inspection.id}</div>
                           <button className="text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                              Generate Official PDF
                           </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
