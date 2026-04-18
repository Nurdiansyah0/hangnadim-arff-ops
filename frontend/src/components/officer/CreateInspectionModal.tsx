import React from 'react';
import { Plus, X, Truck, Loader2, ClipboardCheck } from 'lucide-react';
import type { 
    Vehicle, 
    InspectionTemplate, 
    TemplateItem, 
    OperationalContext, 
    ChecklistEntry 
} from '../../types/inspection';

interface CreateInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    submitting: boolean;
    handleCreate: (e: React.FormEvent) => void;
    opsContext: OperationalContext | null;
    selectedVehicle: string;
    setSelectedVehicle: (id: string) => void;
    vehicles: Vehicle[];
    inspectDate: string;
    setInspectDate: (date: string) => void;
    selectedTemplate: string;
    setSelectedTemplate: (id: string) => void;
    templates: InspectionTemplate[];
    templateItems: TemplateItem[];
    checklistResults: Record<number, ChecklistEntry>;
    setChecklistResults: React.Dispatch<React.SetStateAction<Record<number, ChecklistEntry>>>;
}

export const CreateInspectionModal = ({
    isOpen,
    onClose,
    submitting,
    handleCreate,
    opsContext,
    selectedVehicle,
    setSelectedVehicle,
    vehicles,
    inspectDate,
    setInspectDate,
    selectedTemplate,
    setSelectedTemplate,
    templates,
    templateItems,
    checklistResults,
    setChecklistResults
}: CreateInspectionModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => !submitting && onClose()} />
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
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
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
                            onClick={onClose}
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
    );
};
