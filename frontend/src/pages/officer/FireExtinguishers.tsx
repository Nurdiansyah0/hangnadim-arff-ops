import { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Loader2, 
  ClipboardCheck, 
  Navigation, 
  Locate,
  History as HistoryIcon,
  Calendar,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

// Utils & Types
import type { FireExtinguisher } from '../../types/fireExtinguisher';
import { calculateDistance } from '../../utils/distance';
import { formatDate, formatTime } from '../../utils/dateFormatter';

// Hooks
import { useGeolocation } from '../../hooks/useGeolocation';
import { useFireExtinguishers } from '../../hooks/useFireExtinguishers';

// Components
import { RegisterAparModal } from './components/RegisterAparModal';
import { InspectAparModal } from './components/InspectAparModal';
import { AparAuditReportModal } from './components/AparAuditReportModal';
import { QrScannerModal } from './components/QrScannerModal';
import { RegistrationSuccessModal } from './components/RegistrationSuccessModal';

export default function FireExtinguishers() {
  const {
    currentCoords,
    locationStatus,
    locationAccuracy,
    filteredAccuracy,
    kalmanSamples,
    locationError,
    setLocationError,
    captureLocation
  } = useGeolocation();

  const {
    items,
    inspections,
    loading,
    submitting,
    selectedApar,
    template,
    templateItems,
    checklistResults,
    setChecklistResults,
    inspectDate,
    setInspectDate,
    detailData,
    handleCreate,
    openInspectModal,
    handleInspectSubmit,
    handleViewReport
  } = useFireExtinguishers();

  const [showModal, setShowModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [lastRegistered, setLastRegistered] = useState<FireExtinguisher | null>(null);
  const [detectedAsset, setDetectedAsset] = useState<FireExtinguisher | null>(null);
  const [minDistance, setMinDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!currentCoords || items.length === 0) return;

    let closest: FireExtinguisher | null = null;
    let shortestDist = Infinity;

    items.forEach((item) => {
      if (item.latitude && item.longitude) {
        const dist = calculateDistance(
          currentCoords.lat, 
          currentCoords.lng, 
          item.latitude, 
          item.longitude
        );
        if (dist < shortestDist) {
          shortestDist = dist;
          closest = item;
        }
      }
    });

    const PROXIMITY_THRESHOLD = 15;
    if (shortestDist <= PROXIMITY_THRESHOLD) {
      setDetectedAsset(closest);
      setMinDistance(shortestDist);
    } else {
      setDetectedAsset(null);
      setMinDistance(shortestDist);
    }
  }, [currentCoords, items]);

  const onRegisterSubmit = async (form: any) => {
    try {
      const data = await handleCreate(form, captureLocation);
      setLastRegistered(data);
      setShowModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      // toast is handled in hook
    }
  };

  const onInspectModalOpen = async (apar: FireExtinguisher) => {
    const success = await openInspectModal(apar);
    if (success) setShowInspectModal(true);
  };

  const onInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleInspectSubmit(captureLocation);
    if (success) setShowInspectModal(false);
  };

  const onViewReport = async (id: string) => {
    const success = await handleViewReport(id);
    if (success) setShowDetailModal(true);
  };

  const handleQrScanSuccess = (decodedText: string) => {
    const found = items.find(item => item.serial_number === decodedText || item.id === decodedText);
    
    if (found) {
        setShowQrScanner(false);
        if (found.latitude && found.longitude && currentCoords) {
            const distance = calculateDistance(currentCoords.lat, currentCoords.lng, found.latitude, found.longitude);
            const MAX_DISTANCE = 50;
            
            if (distance > MAX_DISTANCE) {
                toast.error(`GEOLOCATION MISMATCH: Scanned unit #${found.serial_number} is registered ${distance.toFixed(1)}m away.`);
                return;
            }
        } else if (!currentCoords) {
            toast.error('GEOLOCATION REQUIRED: Could not verify your position.');
            return;
        }
        onInspectModalOpen(found);
    } else {
        setQrError(`UNRECOGNIZED ASSET: The code "${decodedText}" is not registered.`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                <Flame className="text-orange-500" />
                APAR Compliance Audit
            </h1>
            <p className="text-slate-400 mt-1">Track APAR units by serial number, expiry, location, and status.</p>
            </div>

            <button
            onClick={() => {
              setShowModal(true);
              captureLocation().catch(() => console.warn('Initial GPS capture timed out.'));
            }}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 font-bold"
            >
            <Plus size={20} />
            Register APAR
            </button>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-10 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <span className="font-black uppercase tracking-widest text-xs">Synchronizing Tactical Assets...</span>
                </div>
            ) : detectedAsset ? (
                <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                        <div className="relative w-32 h-32 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-orange-600/40 rotate-12 hover:rotate-0 transition-transform duration-500">
                            <Flame size={64} />
                        </div>
                        <div className="absolute -top-2 -right-2 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg animate-pulse uppercase tracking-tighter">
                            Nearby Detected ({minDistance?.toFixed(1)}m)
                        </div>
                    </div>

                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                            #{detectedAsset.serial_number}
                        </h2>
                        <p className="text-slate-400 font-medium px-4 py-2 bg-slate-800/50 rounded-xl inline-block">
                           {detectedAsset.agent_type} • {detectedAsset.building || 'Main Terminal'} - {detectedAsset.floor || 'Level 1'}
                        </p>
                    </div>

                    <button
                        onClick={() => onInspectModalOpen(detectedAsset)}
                        className="group relative px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl shadow-orange-600/20 hover:scale-105 active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <ClipboardCheck size={24} className="group-hover:rotate-12 transition-transform" />
                            Perform Precision Audit
                        </span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    </button>

                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-3 italic">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Asset spatial lock engaged • Secure Audit Session Active
                    </div>
                </div>
            ) : locationStatus === 'ERROR' ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                        <Navigation size={40} className="rotate-45" />
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">{locationError || 'Spatial Sync Failed'}</h3>
                        <p className="text-slate-500 max-w-sm text-sm italic">
                            {locationError?.includes('BLOCKED') 
                                ? 'Permission access has been denied. Please enable Location Services in your browser settings to continue.'
                                : 'The radar could not lock your GPS position. Please ensure you have a clear view of the sky or move to an open area.'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setLocationError(null);
                            captureLocation();
                        }}
                        className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/20"
                    >
                        <Locate size={18} />
                        Retry Radar Sync
                    </button>
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="relative w-40 h-40">
                        <div className="absolute inset-0 border-4 border-dashed border-slate-800 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-4 border-2 border-orange-500/20 rounded-full animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Navigation size={40} className="text-slate-700 animate-bounce" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-slate-300 uppercase tracking-tight">Scanning for Physical Assets</h3>
                        <p className="text-slate-500 mt-2 max-w-sm text-sm italic">
                            Move within 15 meters of an APAR unit to start the inspection. The radar is searching for the nearest registered coordinates.
                        </p>
                    </div>

                     {/* Kalman Convergence Indicator */}
                     <div className="w-full max-w-xs space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-500">Kalman Filter</span>
                             <span className={kalmanSamples >= 10 ? 'text-emerald-400' : kalmanSamples >= 5 ? 'text-orange-400' : 'text-slate-500'}>
                                 {kalmanSamples === 0 ? 'Awaiting Fix...' : kalmanSamples < 5 ? 'Converging...' : kalmanSamples < 10 ? 'Stabilizing...' : 'High Precision'}
                             </span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                             <div 
                                 className={`h-full rounded-full transition-all duration-500 ${kalmanSamples >= 10 ? 'bg-emerald-500' : kalmanSamples >= 5 ? 'bg-orange-500' : 'bg-slate-600'}`}
                                 style={{ width: `${Math.min((kalmanSamples / 20) * 100, 100)}%` }}
                             />
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                             <div className="text-center">
                                 <div className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Fixes</div>
                                 <div className="text-xs font-bold text-slate-300">{kalmanSamples}</div>
                             </div>
                             <div className="text-center border-x border-slate-800">
                                 <div className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Raw GPS</div>
                                 <div className="text-xs font-bold text-blue-400">{locationAccuracy ? `±${locationAccuracy.toFixed(0)}m` : '–'}</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-[9px] font-black text-slate-600 uppercase mb-0.5">Filtered</div>
                                 <div className={`text-xs font-bold ${filteredAccuracy && filteredAccuracy < 10 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                     {filteredAccuracy ? `±${filteredAccuracy.toFixed(1)}m` : '–'}
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="pt-4 flex flex-col items-center gap-4">
                         <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">— OR —</div>
                         <button
                           onClick={() => setShowQrScanner(true)}
                           className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl transition-all shadow-xl font-black uppercase tracking-[0.2em] text-xs border border-slate-700 group"
                         >
                           <QrCode size={18} className="group-hover:scale-110 transition-transform" />
                           Scan Asset QR Code
                         </button>
                     </div>
                </div>
            )}
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-4xl p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <HistoryIcon size={120} />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <HistoryIcon className="text-orange-500" />
            Recent APAR Audit History
        </h2>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin mb-2" />
                <span className="text-sm italic">Retrieving safety logs...</span>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="pb-4">Unit Serial</th>
                            <th className="pb-4">Audit Date</th>
                            <th className="pb-4 text-center">Result Status</th>
                            <th className="pb-4 text-right italic font-normal lowercase">ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {inspections.length > 0 ? inspections.map((item) => (
                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-4 text-white font-bold tracking-tight">
                                        <div className="w-10 h-10 bg-orange-600/10 rounded-lg flex items-center justify-center text-orange-500">
                                            <Flame size={18} />
                                        </div>
                                        <div>
                                            {item.fire_extinguisher_serial || 'Unknown Unit'}
                                            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter mt-0.5">ID: {item.id.slice(0,8)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-slate-300 text-sm">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-500" />
                                            {formatDate(item.tanggal)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono pl-5">
                                            SEC: {formatTime(item.created_at)}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                                            item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            item.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tighter italic">BY: {item.inspector_name || 'System Analyst'}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <button
                                        onClick={() => onViewReport(item.id)}
                                        className="text-slate-400 hover:text-white transition-all text-xs px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-orange-500/50"
                                    >
                                        View Log
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="py-20 text-center text-slate-600 italic text-sm">
                                    --- No APAR inspection history available ---
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {showModal && (
        <RegisterAparModal
          onClose={() => setShowModal(false)}
          onSubmit={onRegisterSubmit}
          submitting={submitting}
          locationStatus={locationStatus}
          locationAccuracy={locationAccuracy}
          captureLocation={captureLocation}
        />
      )}

      {showInspectModal && selectedApar && (
        <InspectAparModal
          selectedApar={selectedApar}
          onClose={() => setShowInspectModal(false)}
          onSubmit={onInspectSubmit}
          submitting={submitting}
          inspectDate={inspectDate}
          setInspectDate={setInspectDate}
          template={template}
          templateItems={templateItems}
          checklistResults={checklistResults}
          setChecklistResults={setChecklistResults}
        />
      )}

      {showDetailModal && detailData && (
        <AparAuditReportModal
          detailData={detailData}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showQrScanner && (
        <QrScannerModal
          onClose={() => setShowQrScanner(false)}
          onSuccess={handleQrScanSuccess}
          onError={(err) => setQrError(err)}
          qrError={qrError}
          currentCoords={currentCoords}
          filteredAccuracy={filteredAccuracy}
        />
      )}

      {showSuccessModal && lastRegistered && (
        <RegistrationSuccessModal
          lastRegistered={lastRegistered}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}
