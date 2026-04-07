import { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Send,
    Info,
    AlertTriangle,
    Activity,
    Clock,
    User,
    Loader2,
} from 'lucide-react';
import { api } from '../lib/axios';

interface WatchroomLog {
    id: string;
    actor_id: string | null;
    entry_type: string | null;
    description: string;
    created_at: string;
}

export default function Watchroom() {
    const [logs, setLogs] = useState<WatchroomLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [entryType, setEntryType] = useState('INFO');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 30000); // Sinkronisasi otomatis setiap 30 detik
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/watchroom');
            // Urutkan berdasarkan waktu terbaru
            const sortedLogs = res.data.sort((a: WatchroomLog, b: WatchroomLog) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setLogs(sortedLogs);
        } catch (err) {
            console.error('Gagal memuat log:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        try {
            setSubmitting(true);
            await api.post('/watchroom', {
                description: description,
                entry_type: entryType,
                payload: {} // Metadata tambahan (opsional)
            });
            setDescription('');
            fetchLogs();
        } catch (err) {
            alert('Gagal mengirim laporan ke Watchroom');
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeIcon = (type: string | null) => {
        switch (type) {
            case 'ALERT': return <AlertTriangle className="text-orange-500" size={16} />;
            case 'CRITICAL': return <ShieldAlert className="text-red-500" size={16} />;
            case 'INFO': return <Info className="text-blue-500" size={16} />;
            default: return <Activity className="text-slate-500" size={16} />;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            {/* Header Statis */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldAlert className="text-blue-500" />
                        Watchroom Journal
                    </h1>
                    <p className="text-slate-400 mt-1">Sistem pencatatan logbook operasional & event tracking</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                    <Activity size={14} className="text-emerald-500 animate-pulse" />
                    Live Connection Active
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Kolom Kiri: Timeline Feed */}
                <div className="lg:col-span-2 flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden relative">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                        <div className="flex items-center gap-2 text-white font-semibold">
                            <Clock size={18} className="text-slate-500" />
                            Operational Timeline
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <Loader2 className="animate-spin mb-2" />
                                <span>Sinkronisasi database...</span>
                            </div>
                        ) : logs.length > 0 ? (
                            logs.map((log, idx) => (
                                <div key={log.id} className="relative pl-10 group">
                                    {/* Garis Timeline */}
                                    {idx !== logs.length - 1 && (
                                        <div className="absolute left-[11px] top-8 bottom-[-32px] w-[2px] bg-slate-800 group-hover:bg-blue-500/30 transition-colors" />
                                    )}

                                    {/* Node Indikator */}
                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-slate-900 z-10 flex items-center justify-center ${log.entry_type === 'ALERT' ? 'bg-orange-500' :
                                            log.entry_type === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-500'
                                        } shadow-lg shadow-black/20`}>
                                        {log.entry_type === 'CRITICAL' ? <ShieldAlert size={10} className="text-white" /> : null}
                                    </div>

                                    <div className="bg-slate-800/30 hover:bg-slate-800/50 border border-slate-800/50 p-5 rounded-2xl transition-all shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(log.entry_type)}
                                                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                                                    {log.entry_type || 'GENERAL'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                                                {new Date(log.created_at).toLocaleTimeString('id-ID', { hour12: false })}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {log.description}
                                        </p>
                                        <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <User size={10} />
                                                ACTOR: {log.actor_id?.slice(0, 8) || 'SYSTEM'}
                                            </div>
                                            <div className="text-slate-600 font-mono">
                                                {new Date(log.created_at).toLocaleDateString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 italic">
                                Belum ada log tercatat hari ini.
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Kanan: Input Form */}
                <div className="space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-white mb-6">Quick Report</h2>

                        <form onSubmit={handlePost} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Event Severity</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['INFO', 'ALERT', 'CRITICAL'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setEntryType(type)}
                                            className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${entryType === type
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Detail Kejadian</label>
                                <textarea
                                    required
                                    rows={6}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ketik detail laporan di sini..."
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-700 font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !description.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit to Journal
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6">
                        <h4 className="text-sm font-bold text-blue-400 mb-2">Audit Protocol</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Setiap catatan di Watchroom akan terikat permanen dengan UID operator sebagai bukti hukum operasional bandara.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
