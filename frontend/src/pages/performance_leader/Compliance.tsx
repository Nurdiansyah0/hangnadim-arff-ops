import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  History, 
  AlertCircle, 
  Download, 
  Lock, 
  Loader2,
  CheckCircle2,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/axios';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  created_at: string;
}

interface SOP {
  id: string;
  title: string;
  category: string;
  version: string;
  last_updated: string;
}

interface ExpiringCert {
  personnel_name: string;
  cert_name: string;
  expiry_date: string;
  days_left: number;
}

export default function Compliance() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SOPS' | 'AUDIT' | 'CERTS'>('SOPS');
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sopRes, certRes] = await Promise.all([
        api.get('/compliance/sops'),
        api.get('/certifications/expiring?days=90')
      ]);
      setSops(sopRes.data);
      setExpiringCerts(certRes.data);

      try {
        const auditRes = await api.get('/compliance/audit?limit=20');
        setAuditLogs(auditRes.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setAdminError("Access Denied: Audit Logs are only visible to Command Administrators.");
        }
      }
    } catch (err) {
      console.error('Failed to sync compliance data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
            <ShieldCheck className="text-blue-500" />
            Safety & Compliance
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">ICAO Annex 14 & Safety Management System (SMS) Oversight</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
           {['SOPS', 'CERTS', 'AUDIT'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                 activeTab === tab 
                 ? 'bg-blue-600 text-white shadow-lg' 
                 : 'text-slate-500 hover:text-slate-300'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'SOPS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {sops.length > 0 ? sops.map(sop => (
                 <div key={sop.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 group hover:border-blue-500/50 transition-all flex flex-col justify-between h-48">
                    <div>
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20">
                             <FileText size={20} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">v{sop.version}</span>
                       </div>
                       <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors line-clamp-2">{sop.title}</h3>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sop.category}</span>
                       <button className="text-blue-500 hover:text-blue-400 p-2"><Download size={18}/></button>
                    </div>
                 </div>
               )) : (
                <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed text-slate-600 font-bold uppercase tracking-widest">
                   No SOP documents registered
                </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'CERTS' && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8 overflow-hidden">
             <div className="flex items-center gap-3 mb-8">
                <UserCheck className="text-emerald-500" />
                <h2 className="text-xl font-bold text-white">Certification Readiness</h2>
             </div>
             
             <div className="space-y-4">
                {expiringCerts.map((cert, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-orange-500/30 transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-all">
                           <AlertCircle size={20} />
                        </div>
                        <div>
                           <div className="text-white font-bold">{cert.personnel_name}</div>
                           <div className="text-xs text-slate-500 uppercase tracking-tighter font-bold">{cert.cert_name}</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className={`text-xs font-black uppercase tracking-widest ${cert.days_left < 30 ? 'text-red-500' : 'text-orange-500'}`}>
                           {cert.days_left} Days Remaining
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">EXPIRES: {new Date(cert.expiry_date).toLocaleDateString()}</div>
                     </div>
                  </div>
                ))}
                {expiringCerts.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-600 border border-slate-800 border-dashed rounded-3xl">
                     <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                     <p className="font-bold uppercase tracking-widest text-[10px]">All Personnel Training Current</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin mb-2" />
                <span>Syncing compliance datasets...</span>
             </div>
        ) : activeTab === 'AUDIT' && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <History className="text-purple-500" />
                   <h2 className="text-xl font-bold text-white tracking-tight">System Audit Trail</h2>
                </div>
                {!adminError && (
                  <div className="flex gap-3">
                    <button 
                      onClick={async () => {
                        try {
                          const body = auditLogs.map(log => 
                            `${log.created_at} | ${log.actor_id.slice(0,8)} | ${log.action} | ${log.target_type}`
                          ).join('\n');
                          
                          await api.post('/email/send-report', {
                            to: 'admin@hangnadim-arff.id',
                            subject: `HAIS: System Audit Log ${new Date().toLocaleDateString()}`,
                            body: `Here is the summary of the HAIS system audit logs:\n\n${body}`
                          });
                          alert('Audit Report successfully sent via Email!');
                        } catch (err) {
                          alert('Failed to send email. Ensure the SMTP server is configured.');
                        }
                      }}
                      className="text-[10px] font-black text-blue-500 uppercase bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/20"
                    >
                      Email Report
                    </button>
                    <button className="text-[10px] font-black text-slate-500 uppercase bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 hover:text-white transition-all">Export CSV</button>
                  </div>
                )}
             </div>

             {adminError ? (
               <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-6 bg-red-600/10 text-red-500 rounded-full ring-8 ring-red-500/5">
                     <Lock size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Security Restriction</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">{adminError}</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-slate-800">
                      <tr>
                        <th className="pb-4 px-2">Actor UID</th>
                        <th className="pb-4 px-2">Action Event</th>
                        <th className="pb-4 px-2">Entity</th>
                        <th className="pb-4 px-2 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-all text-sm font-medium">
                          <td className="py-4 px-2 font-mono text-xs text-blue-500">{log.actor_id.slice(0, 8)}</td>
                          <td className="py-4 px-2 text-slate-300">{log.action}</td>
                          <td className="py-4 px-2">
                             <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold uppercase">{log.target_type}</span>
                          </td>
                          <td className="py-4 px-2 text-right text-slate-500 font-mono text-xs">
                             {new Date(log.created_at).toLocaleString('en-GB', { hour12: false })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8 flex items-start gap-6">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
              <ShieldCheck size={28} />
            </div>
            <div>
               <h4 className="text-white font-black uppercase tracking-tight italic mb-2">Compliance Rating: <span className="text-blue-400">CLASS-A</span></h4>
               <p className="text-sm text-slate-400 leading-relaxed">The ARFF Unit at Hang Nadim complies with all ICAO and DGCA standards this season. All audit logs are fully synchronized.</p>
            </div>
         </div>
         
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex items-center justify-between group">
            <div className="space-y-1">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latest SOP Release</div>
               <div className="text-lg font-bold text-white tracking-tight">Emergency Response Protocol</div>
            </div>
            <button className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 group-hover:border-blue-500/50 transition-all">
               <ExternalLink size={20} />
            </button>
         </div>
      </div>
    </div>
  );
}
