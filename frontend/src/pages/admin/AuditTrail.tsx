import { useState, useEffect } from 'react';
import { 
  History, 
  User, 
  Database, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { api } from '../../lib/axios';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  table_name: string;
  action: string;
  original_data: any;
  new_data: any;
  created_at: string;
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const limit = 15;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (id: string) => {
    if (!confirm('Are you sure you want to ROLLBACK this change? This will overwrite existing database records.')) return;
    
    try {
      setProcessing(id);
      await api.post(`/admin/audit-logs/${id}/rollback`);
      alert('Rollback successful.');
      fetchLogs();
    } catch (err) {
      alert('Rollback failed. Check system logs.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('WARNING: Permanently delete this audit record? This cannot be undone.')) return;
    
    try {
      setProcessing(id);
      await api.delete(`/admin/audit-logs/${id}`);
      fetchLogs();
    } catch (err) {
      alert('Deletion failed.');
    } finally {
      setProcessing(null);
    }
  };

  const formatData = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <History className="text-blue-500" />
            System Audit Trail
          </h1>
          <p className="text-slate-400 mt-1">Full traceability of operational approvals and master data changes</p>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actor</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" />
                    <span className="text-slate-500 text-xs font-bold uppercase">Retrieving history...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500 font-bold uppercase text-xs">No audit records found</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-mono text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-slate-700">
                          <User size={12} />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-tight">{log.actor_name || 'System Auto'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Database size={14} className="text-slate-500" />
                        {log.table_name.toUpperCase()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest ${
                        log.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-500' :
                        log.action === 'INSERT' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                          title="View Payload"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {(log.action === 'UPDATE' || log.action === 'DELETE') && (
                          <button 
                            onClick={() => handleRollback(log.id)}
                            disabled={processing === log.id}
                            className={`p-2 rounded-xl transition-all ${
                              processing === log.id ? 'opacity-50 cursor-not-allowed' : 'text-amber-500 hover:text-white hover:bg-amber-600/20'
                            }`}
                            title="Rollback Changes"
                          >
                            {processing === log.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                          </button>
                        )}

                        <button 
                          onClick={() => handleDelete(log.id)}
                          disabled={processing === log.id}
                          className="p-2 text-rose-500 hover:text-white hover:bg-rose-600/20 rounded-xl transition-all"
                          title="Purge Log (Warning)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex items-center justify-between">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Showing Page {page} of {totalPages || 1} ({total} Total Records)
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Audit Payload Inspection</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Log ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
               <div className="p-6 border-b md:border-b-0 md:border-r border-slate-800">
                  <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    Original State
                  </div>
                  <pre className="bg-slate-950 p-4 rounded-2xl text-[10px] font-mono text-slate-400 overflow-auto max-h-[400px]">
                    {formatData(selectedLog.original_data)}
                  </pre>
               </div>
               <div className="p-6">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    New State Result
                  </div>
                  <pre className="bg-slate-950 p-4 rounded-2xl text-[10px] font-mono text-slate-400 overflow-auto max-h-[400px]">
                    {formatData(selectedLog.new_data)}
                  </pre>
               </div>
            </div>

            <div className="p-6 bg-slate-950/50 flex items-center justify-end gap-3">
               <div className="flex-1 flex items-center gap-3 text-amber-500">
                  <AlertTriangle size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Rollback will overwrite the current live database record.</span>
               </div>
               <button 
                 onClick={() => setSelectedLog(null)}
                 className="px-6 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
               >
                 Close Detail
               </button>
               {(selectedLog.action === 'UPDATE' || selectedLog.action === 'DELETE') && (
                 <button 
                   onClick={() => {
                     handleRollback(selectedLog.id);
                     setSelectedLog(null);
                   }}
                   className="px-6 py-3 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
                 >
                   <RotateCcw size={14} />
                   Restore Original Data
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
