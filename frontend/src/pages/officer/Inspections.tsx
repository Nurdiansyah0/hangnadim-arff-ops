import { useState } from 'react';
import { Plus, History, Truck, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';

// Hooks
import { useInspections } from '../../hooks/useInspections';

// Components
import { InspectionHistoryCard } from '../../components/officer/InspectionHistoryCard';
import { CreateInspectionModal } from '../../components/officer/CreateInspectionModal';
import { InspectionDetailModal } from '../../components/officer/InspectionDetailModal';

// Types
import type { InspectionDetail } from '../../types/inspection';

export default function Inspections() {
    const {
        inspections,
        vehicles,
        templates,
        templateItems,
        loading,
        error,
        opsContext,
        selectedVehicle,
        setSelectedVehicle,
        selectedTemplate,
        setSelectedTemplate,
        inspectDate,
        setInspectDate,
        checklistResults,
        setChecklistResults,
        submitting,
        handleCreate,
        prepareNewInspection,
        resetModal
    } = useInspections();

    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState<InspectionDetail | null>(null);

    const openModal = async () => {
        const success = await prepareNewInspection();
        if (success) {
            setShowModal(true);
        }
    };

    const handleViewReport = async (inspectionId: string) => {
        try {
            const res = await api.get(`/inspections/${inspectionId}`);
            setDetailData(res.data);
            setShowDetailModal(true);
        } catch (err) {
            toast.error('Failed to fetch inspection details');
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

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCreate(() => {
            setShowModal(false);
            resetModal();
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
                        {inspections.filter(item => item.vehicle_id !== null).length > 0 ? (
                            inspections.filter(item => item.vehicle_id !== null).map((item) => (
                                <InspectionHistoryCard 
                                    key={item.id} 
                                    item={item} 
                                    onViewReport={handleViewReport} 
                                    formatDate={formatDate} 
                                />
                            ))
                        ) : (
                            <div className="col-span-1 lg:col-span-2 py-20 text-center text-slate-500 italic text-sm">
                                --- No vehicle inspection history recorded in system ---
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateInspectionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                submitting={submitting}
                handleCreate={onSubmit}
                opsContext={opsContext}
                selectedVehicle={selectedVehicle}
                setSelectedVehicle={setSelectedVehicle}
                vehicles={vehicles}
                inspectDate={inspectDate}
                setInspectDate={setInspectDate}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                templates={templates}
                templateItems={templateItems}
                checklistResults={checklistResults}
                setChecklistResults={setChecklistResults}
            />

            <InspectionDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                detailData={detailData}
                formatDateTime={formatDateTime}
            />
        </div>
    );
}
