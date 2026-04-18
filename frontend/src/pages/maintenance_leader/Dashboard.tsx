import { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  Search,
  Truck,
  Loader2,
  Calendar
} from 'lucide-react';
import { api } from '../../lib/axios';
import toast from 'react-hot-toast';

interface MaintenanceRequest {
    id: string;
    vehicle_id: string;
    vehicle_code?: string;
    description: string;
    status: string;
    priority?: string;
    requested_by_name?: string;
    created_at: string;
    photo_url: string | null;
}

export default function MaintenanceDashboard() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/maintenance');
            // Parse priority from description if it exists (pattern: [PRIORITY: Routine])
            const enhancedData = res.data.map((r: any) => {
                const priorityMatch = r.description?.match(/\[PRIORITY: (.*?)\]/);
                return {
                    ...r,
                    priority: priorityMatch ? priorityMatch[1] : 'Routine',
                    // Clean description for display
                    displayDescription: r.description?.replace(/\[PRIORITY:.*?\]/, '').trim()
                };
            });
            setRequests(enhancedData);
        } catch (err) {
            console.error('Failed to fetch maintenance requests', err);
            toast.error('Failed to load maintenance queue');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        try {
            // Backend status logic: PENDING -> IN_PROGRESS or REJECTED
            await api.patch(`/maintenance/${id}`, { 
                status: action === 'APPROVE' ? 'IN_PROGRESS' : 'REJECTED' 
            });
            toast.success(`Request ${action === 'APPROVE' ? 'Authorized' : 'Rejected'}`);
            fetchRequests();
        } catch (err) {
            toast.error('System failed to process request');
        }
    };

    const filteredRequests = requests.filter(r => filter === 'ALL' || r.status === filter);

    return (
        <div className="flex flex-col gap-8 p-1">
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="animate-in slide-in-from-left duration-700">
                    <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter italic uppercase">
                        <Wrench className="text-orange-500" size={40} />
                        Maintenance Command
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium italic">
                        Review and authorize vehicle repair & equipment trouble tickets
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Maintenance Leader Access
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                    { label: 'Pending Approval', value: requests.filter(r => r.status === 'PENDING').length, icon: Clock, color: 'text-orange-400', bg: 'from-orange-500/10 to-transparent' },
                    { label: 'In Repair', value: requests.filter(r => r.status === 'IN_PROGRESS').length, icon: Wrench, color: 'text-blue-400', bg: 'from-blue-500/10 to-transparent' },
                    { label: 'Fleet Readiness', value: '94%', icon: ShieldCheck, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-4xl relative overflow-hidden group hover:border-slate-700 transition-all duration-500 bg-linear-to-br ${stat.bg}`}>
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12">
                            <stat.icon size={120} />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-2xl bg-slate-950 border border-slate-800 ${stat.color} shadow-inner`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter & List */}
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="p-8 border-b border-slate-800/50 flex flex-col lg:flex-row justify-between items-center gap-8 bg-slate-950/30">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-[1.25rem] border border-slate-800 w-full lg:w-auto">
                        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ALL'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`flex-1 lg:px-8 py-3 text-[10px] font-black rounded-xl transition-all duration-300 ${filter === t 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                            >
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search ticket or vehicle code..."
                            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-[1.25rem] pl-14 pr-8 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder:text-slate-800 font-medium"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-800/40">
                    {loading ? (
                        <div className="p-32 flex flex-col items-center gap-6">
                            <div className="relative">
                                <Loader2 className="animate-spin text-blue-500" size={48} />
                                <Wrench className="absolute inset-0 m-auto text-blue-500/30" size={20} />
                            </div>
                            <span className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Maintenance Database</span>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-32 text-center">
                            <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                                <ShieldCheck className="text-slate-800" size={32} />
                            </div>
                            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">Operational Queue Clear</p>
                            <p className="text-slate-700 text-[10px] mt-2 italic font-medium">No maintenance requests found for this filter.</p>
                        </div>
                    ) : (
                        filteredRequests.map((req) => (
                            <div key={req.id} className="p-10 hover:bg-blue-500/2 transition-all duration-500 group relative">
                                <div className="flex flex-col xl:flex-row justify-between gap-10">
                                    <div className="flex gap-8">
                                        <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-4xl flex items-center justify-center text-slate-700 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all duration-500 shrink-0 overflow-hidden shadow-inner group-hover:shadow-blue-500/5">
                                            {req.photo_url ? (
                                                <img src={req.photo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Defect Report" />
                                            ) : (
                                                <Truck size={40} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className="text-white font-black text-2xl tracking-tighter uppercase group-hover:text-blue-400 transition-colors">{req.vehicle_code || 'UNIT-UNSET'}</span>
                                                <div className="flex gap-2">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                        req.priority === 'Emergency' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5' :
                                                        req.priority === 'Urgent' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5'
                                                    }`}>
                                                        {req.priority}
                                                    </span>
                                                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-950 text-slate-500 border border-slate-800">
                                                        Ticket #{req.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-base max-w-3xl font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                                                {(req as any).displayDescription || req.description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                                <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    <Calendar size={14} className="text-slate-800" /> {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    <Clock size={14} className="text-slate-800" /> {new Date(req.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                                    Requested By: <span className="text-slate-400 italic font-bold ml-1">{req.requested_by_name || 'Field Officer'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 xl:flex-col justify-center shrink-0">
                                        {req.status === 'PENDING' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleAction(req.id, 'REJECT')}
                                                    className="flex-1 xl:w-16 h-16 rounded-3xl border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300 flex items-center justify-center group/btn shadow-lg shadow-red-950/20"
                                                    title="Reject Ticket"
                                                >
                                                    <XCircle size={28} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(req.id, 'APPROVE')}
                                                    className="flex-2 xl:w-auto h-16 xl:px-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 transition-all duration-300 shadow-xl shadow-emerald-900/40 group/approve"
                                                >
                                                    <CheckCircle size={22} className="group-hover/approve:scale-110 transition-transform" /> 
                                                    <span className="xl:hidden">AUTHORIZE REPAIR</span>
                                                    <span className="hidden xl:inline">AUTHORIZE</span>
                                                </button>
                                            </>
                                        ) : (
                                            <button className="w-full xl:w-auto px-8 py-4 rounded-3xl bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:text-white hover:border-slate-700 transition-all">
                                                <ExternalLink size={16} /> Track Status
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
