import { ClipboardCheck, X, Flame, Loader2 } from 'lucide-react';
import type { FireExtinguisher } from '../../../types/fireExtinguisher';

interface InspectAparModalProps {
  selectedApar: FireExtinguisher;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  inspectDate: string;
  setInspectDate: (date: string) => void;
  template: any;
  templateItems: any[];
  checklistResults: Record<number, any>;
  setChecklistResults: React.Dispatch<React.SetStateAction<Record<number, any>>>;
}

export function InspectAparModal({
  selectedApar,
  onClose,
  onSubmit,
  submitting,
  inspectDate,
  setInspectDate,
  template,
  templateItems,
  checklistResults,
  setChecklistResults
}: InspectAparModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => !submitting && onClose()} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 pb-4 border-b border-slate-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/20 rounded-lg text-orange-500"><ClipboardCheck size={24} /></div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Audit APAR: {selectedApar.serial_number}</h3>
              <p className="text-sm text-slate-500">Perform periodic safety inspection.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-8 pt-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-orange-500 uppercase tracking-widest mb-2 ml-1">Unit Asset Info</label>
                <div className="bg-orange-600/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center text-orange-400">
                    <Flame size={24} />
                  </div>
                  <div>
                    <div className="text-white font-black text-lg leading-none">{selectedApar.serial_number}</div>
                    <div className="text-[10px] text-orange-400 font-bold uppercase mt-1">{selectedApar.agent_type} - {selectedApar.capacity_kg}kg</div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Inspection Date</label>
                <input
                  type="date"
                  required
                  value={inspectDate}
                  onChange={(e) => setInspectDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>

            {templateItems.length > 0 && (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300 font-bold uppercase tracking-widest">Inspection Protocol</div>
                  <div className="text-[10px] font-black text-slate-500 px-2 py-1 bg-slate-800 rounded-md uppercase">
                    {template?.name}
                  </div>
                </div>
                {templateItems.map(item => (
                  <div key={item.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <div className="text-white font-bold text-sm tracking-tight">{item.item_name}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-orange-500/80 font-black mt-0.5">{item.category}</div>
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
                        placeholder="Add notes (e.g. pressure low, label damaged)..."
                        className="w-full min-h-[70px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              disabled={submitting || !template}
              className="flex-1 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-500/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
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
}
