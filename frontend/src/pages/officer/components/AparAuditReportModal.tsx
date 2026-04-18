import { X } from 'lucide-react';
import type { InspectionDetail } from '../../../types/fireExtinguisher';
import { formatDateTime } from '../../../utils/dateFormatter';

interface AparAuditReportModalProps {
  detailData: InspectionDetail;
  onClose: () => void;
}

export function AparAuditReportModal({ detailData, onClose }: AparAuditReportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                  <h3 className="text-xl font-bold text-white italic tracking-tighter uppercase">APAR Audit Report</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="text-orange-500 font-black">
                      {detailData.inspection.fire_extinguisher_serial || 'UNIT'}
                    </span> • {formatDateTime(detailData.inspection.created_at)}
                  </p>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                    Inspector: <span className="text-slate-300">{detailData.inspection.inspector_name || 'Authorized Personnel'}</span>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
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
                              <span className="text-slate-500 font-bold uppercase text-[9px] block mb-1 not-italic tracking-widest">Inspector Notes:</span>
                              "{result.notes}"
                          </div>
                      )}
                  </div>
              ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
             <div>Audit Trail ID: {detailData.inspection.id}</div>
             <button className="text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2">
                Download Report
             </button>
          </div>
      </div>
    </div>
  );
}
