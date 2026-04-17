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
import { api } from '../../lib/axios';

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
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/watchroom');
            const sortedLogs = res.data.sort((a: WatchroomLog, b: WatchroomLog) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setLogs(sortedLogs);
        } catch (err) {
            console.error('Failed to load logs:', err);
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
                payload: {}
            });
            setDescription('');
            fetchLogs();
        } catch (err) {
            alert('Failed to send report to Watchroom');
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter italic uppercase">
                        <ShieldAlert className="text-blue-500" size={32} />
                        Watchroom Journal
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium italic">Operational logbook & event tracking</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Activity size={14} className="text-emerald-500 animate-pulse" />
                    Live Connection Active
                </div>
            </div>

            {/* QUICK INPUT BAR */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Send size={120} />
                </div>

                <form onSubmit={handlePost} className="relative z-10 flex flex-col lg:flex-row gap-6">
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Event Severity</label>
                        <div className="flex gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                            {['INFO', 'ALERT', 'CRITICAL'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setEntryType(type)}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${entryType === type
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-500 hover:text-white hover:bg-slate-900'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Daily Log / Event Entry</label>
                        <div className="flex flex-col md:flex-row gap-4">
                           <textarea
                                required
                                rows={1}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Type your report or operational notes here..."
                                className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-800 font-medium"
                           />
                           <button
                                type="submit"
                                disabled={submitting || !description.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/30 shrink-0"
                           >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> POST LOG</>}
                           </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Timeline Feed */}
            <div className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden relative">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                    <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs italic">
                        <Clock size={16} className="text-blue-500" />
                        Operational Timeline Feed
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Loader2 className="animate-spin mb-2" />
                            <span>Database synchronization...</span>
                        </div>
                    ) : logs.length > 0 ? (
                        logs.map((log, idx) => (
                            <div key={log.id} className="relative pl-10 group">
                                {idx !== logs.length - 1 && (
                                    <div className="absolute left-[11px] top-8 bottom-[-32px] w-[2px] bg-slate-800 group-hover:bg-blue-500/30 transition-colors" />
                                )}

                                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-slate-900 z-10 flex items-center justify-center ${log.entry_type === 'ALERT' ? 'bg-orange-500' :
                                        log.entry_type === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-500'
                                    } shadow-lg shadow-black/20`}>
                                    {log.entry_type === 'CRITICAL' ? <ShieldAlert size={10} className="text-white" /> : null}
                                </div>

                                <div className="bg-slate-800/30 hover:bg-slate-800/50 border border-slate-800/50 p-5 rounded-2xl transition-all shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(log.entry_type)}
                                            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                                                {log.entry_type || 'GENERAL'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                                            {new Date(log.created_at).toLocaleTimeString('en-GB', { hour12: false })}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {log.description}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-widest">
                                            <User size={10} />
                                            Operator: {log.actor_id?.slice(0, 8) || 'SYSTEM'}
                                        </div>
                                        <div className="text-slate-600 font-mono">
                                            {new Date(log.created_at).toLocaleDateString('en-GB')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 italic">
                            No logs recorded today.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
