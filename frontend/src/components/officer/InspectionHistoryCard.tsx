import { Truck, Calendar } from 'lucide-react';
import type { Inspection } from '../../types/inspection';

interface InspectionHistoryCardProps {
    item: Inspection;
    onViewReport: (id: string) => void;
    formatDate: (date: string) => string;
}

export const InspectionHistoryCard = ({ item, onViewReport, formatDate }: InspectionHistoryCardProps) => {
    return (
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4 group hover:border-slate-700 transition-colors">
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
                onClick={() => onViewReport(item.id)}
                className="w-full mt-2 bg-slate-800/30 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl border border-slate-700 transition-colors"
            >
                Open Details
            </button>
        </div>
    );
};
