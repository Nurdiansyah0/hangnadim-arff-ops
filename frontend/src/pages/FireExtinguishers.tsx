import { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Loader2, 
  ClipboardCheck, 
  X,
  Navigation, 
  Locate,
  History as HistoryIcon,
  Calendar
} from 'lucide-react';
import { api } from '../lib/axios';

interface FireExtinguisher {
  id: string;
  serial_number: string;
  agent_type: string;
  capacity_kg: number;
  location_description: string | null;
  floor: string | null;
  building: string | null;
  expiry_date: string;
  status: string;
}

interface Inspection {
    id: string;
    vehicle_id: string | null;
    fire_extinguisher_id: string | null;
    tanggal: string;
    status: string;
    created_at: string;
    inspector_name?: string;
    fire_extinguisher_serial?: string;
}

interface InspectionResult {
    id: string;
    item_name?: string;
    category?: string;
    result: string;
    notes: string | null;
    template_item_id: number;
}

interface InspectionDetail {
    inspection: Inspection;
    results: InspectionResult[];
}

export default function FireExtinguishers() {
  const [items, setItems] = useState<FireExtinguisher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Inspection State
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<InspectionDetail | null>(null);
  const [selectedApar, setSelectedApar] = useState<FireExtinguisher | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [checklistResults, setChecklistResults] = useState<Record<number, any>>({});
  const [inspectDate, setInspectDate] = useState('');
  
  // GPS & Proximity State
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [detectedAsset, setDetectedAsset] = useState<any | null>(null);
  const [minDistance, setMinDistance] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'CAPTURING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getLocalISODate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const captureLocation = (force: boolean = false): Promise<{lat: number, lng: number, accuracy: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationStatus('ERROR');
        reject('Geolocation not supported');
        return;
      }

      setLocationStatus('CAPTURING');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setForm(prev => ({ ...prev, latitude, longitude }));
          setCurrentCoords({ lat: latitude, lng: longitude });
          setLocationAccuracy(accuracy);
          setLocationStatus('SUCCESS');
          resolve({ lat: latitude, lng: longitude, accuracy });
        },
        (err) => {
          console.error('GPS Capture Error:', err);
          let errorMsg = 'Unknown spatial error';
          if (err.code === 1) errorMsg = 'SIGNAL BLOCKED (PERMISSION DENIED)';
          else if (err.code === 3) errorMsg = 'SIGNAL TIMEOUT (SATELLITE SEARCH FAILED)';
          
          setLocationError(errorMsg);
          setLocationStatus('ERROR');
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: force ? 0 : 5000
        }
      );
    });
  };

  const [form, setForm] = useState({
    serial_number: '',
    agent_type: 'CO2',
    capacity_kg: '2.0',
    location_description: '',
    floor: '',
    building: '',
    expiry_date: '',
    status: 'READY',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const openRegisterModal = () => {
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const defaultExpiry = oneYearLater.toISOString().split('T')[0];

    setForm({
      serial_number: '',
      agent_type: 'CO2',
      capacity_kg: '2.0',
      location_description: '',
      floor: '',
      building: '',
      expiry_date: defaultExpiry,
      status: 'READY',
      latitude: null,
      longitude: null,
    });
    setShowModal(true);
    captureLocation().catch(() => console.warn('Initial GPS capture timed out.'));
  };

  useEffect(() => {
    fetchData();
    
    // Live Location Tracking for Radar
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracy(pos.coords.accuracy);
        setLocationStatus('SUCCESS');
      },
      (err) => console.warn('Radar tracking error', err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!currentCoords || items.length === 0) return;

    let closest: any = null;
    let shortestDist = Infinity;

    items.forEach((item: any) => {
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

    const PROXIMITY_THRESHOLD = 15; // 15 meters
    if (shortestDist <= PROXIMITY_THRESHOLD) {
      setDetectedAsset(closest);
      setMinDistance(shortestDist);
    } else {
      setDetectedAsset(null);
      setMinDistance(shortestDist);
    }
  }, [currentCoords, items]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, insRes] = await Promise.all([
        api.get('/fire-extinguishers'),
        api.get('/inspections')
      ]);
      setItems(itemsRes.data);
      setInspections(insRes.data.filter((i: Inspection) => i.fire_extinguisher_id !== null));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let finalLat = form.latitude;
      let finalLng = form.longitude;
      
      try {
        const freshPos = await captureLocation(true);
        finalLat = freshPos.lat;
        finalLng = freshPos.lng;
      } catch (gpsErr) {
        console.warn('Final GPS refresh failed', gpsErr);
      }

      await api.post('/fire-extinguishers', {
        serial_number: form.serial_number,
        agent_type: form.agent_type,
        capacity_kg: parseFloat(form.capacity_kg),
        location_description: form.location_description || null,
        floor: form.floor || null,
        building: form.building || null,
        expiry_date: form.expiry_date,
        last_inspection_date: null,
        status: form.status === 'ACTIVE' ? 'READY' : form.status,
        latitude: finalLat,
        longitude: finalLng,
        photo_url: null,
      });
      setShowModal(false);
      setForm({
        serial_number: '',
        agent_type: 'CO2',
        capacity_kg: '2.0',
        location_description: '',
        floor: '',
        building: '',
        expiry_date: getLocalISODate(),
        status: 'READY',
        latitude: null,
        longitude: null,
      });
      fetchData();
      alert('APAR Registered Successfully - Spatial Lock Recorded');
    } catch (err: any) {
      console.error('Registration Error:', err);
      const serverMsg = err.response?.data || err.message || 'Operation failed';
      alert(`Asset Registration Refused: ${serverMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openInspectModal = async (apar: FireExtinguisher) => {
    try {
      setLoading(true);
      setSelectedApar(apar);
      setInspectDate(getLocalISODate());
      
      const templatesRes = await api.get('/inspections/templates');
      const aparTemplate = templatesRes.data.find((t: any) => t.target_type === 'FIRE_EXTINGUISHER');
      
      if (!aparTemplate) {
        alert('No inspection template found for Fire Extinguishers.');
        return;
      }
      setTemplate(aparTemplate);

      const itemsRes = await api.get(`/inspections/templates/${aparTemplate.id}/items`);
      setTemplateItems(itemsRes.data);
      
      const initial: Record<number, any> = {};
      itemsRes.data.forEach((item: any) => {
        initial[item.id] = { result: 'N_A', notes: '' };
      });
      setChecklistResults(initial);
      setShowInspectModal(true);
    } catch (err) {
      alert('Failed to load inspection protocol.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApar) return;

    try {
      setSubmitting(true);
      
      // CAPTURE CURRENT LOCATION FOR AUDIT VERIFICATION (Best Effort)
      const currentLoc = await captureLocation(true).catch((e) => {
          console.warn('Audit GPS lock failed, proceeding without location binding', e);
          return null;
      }); 
      
      const results = templateItems.map(item => ({
        template_item_id: item.id,
        result: checklistResults[item.id]?.result || 'N_A',
        notes: checklistResults[item.id]?.notes || null,
        photo_url: null,
      }));

      await api.post('/inspections', {
        fire_extinguisher_id: selectedApar.id,
        tanggal: getLocalISODate(),
        status: 'SUBMITTED',
        template_id: template?.id,
        latitude: currentLoc?.lat,
        longitude: currentLoc?.lng,
        results,
      });

      setShowInspectModal(false);
      setChecklistResults({});
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data || 'Failed to finalize audit report';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (inspectionId: string) => {
    try {
        const res = await api.get(`/inspections/${inspectionId}`);
        setDetailData(res.data);
        setShowDetailModal(true);
    } catch (err) {
        alert('Failed to fetch inspection details');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
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
            onClick={openRegisterModal}
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
                        onClick={() => openInspectModal(detectedAsset)}
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
                            captureLocation(true);
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

                    <div className="flex items-center gap-6 opacity-40">
                         <div className="flex flex-col items-center">
                            <div className="text-[10px] font-black text-slate-600 uppercase mb-1">Status</div>
                            <div className="text-xs text-orange-400 font-bold uppercase">Polling...</div>
                         </div>
                         <div className="h-8 w-px bg-slate-800" />
                         <div className="flex flex-col items-center">
                            <div className="text-[10px] font-black text-slate-600 uppercase mb-1">GPS Accuracy</div>
                            <div className="text-xs text-blue-400 font-bold uppercase">{locationAccuracy?.toFixed(1) || '0.0'}m</div>
                         </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* NEW: APAR Specific History Log */}
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
                                        onClick={() => handleViewReport(item.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-8">Register New APAR Unit</h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Serial Number</label>
                  <input
                    required
                    placeholder="E.g. APAR-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Agent Type</label>
                  <select
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.agent_type}
                    onChange={(e) => setForm({ ...form, agent_type: e.target.value })}
                  >
                    <option value="CO2">CO2</option>
                    <option value="DCP">DCP</option>
                    <option value="Foam">Foam</option>
                    <option value="Water">Water</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Capacity (kg)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.capacity_kg}
                    onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Expiry Date</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Location description</label>
                  <input
                    placeholder="Hangar area / terminal gate"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.location_description}
                    onChange={(e) => setForm({ ...form, location_description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Building</label>
                  <input
                    placeholder="Main Hangar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Floor</label>
                  <input
                    placeholder="Ground"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Status</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="READY">READY</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className={`p-6 rounded-3xl border transition-all ${
                    locationStatus === 'CAPTURING' ? 'bg-orange-500/5 border-orange-500/20 animate-pulse' :
                    locationStatus === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    locationStatus === 'ERROR' ? 'bg-red-500/5 border-red-500/20' :
                    'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${locationStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                           <Navigation size={20} />
                         </div>
                         <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Spatial Sync</div>
                            <div className="text-white font-bold text-sm">
                              {locationStatus === 'CAPTURING' ? 'Capturing High-Precision GPS...' :
                               locationStatus === 'SUCCESS' ? 'Accuracy Locked' :
                               locationStatus === 'ERROR' ? 'GPS Signal Blocked' : 'Waiting for Device...'}
                            </div>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => captureLocation(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Locate size={14} />
                        Refresh
                      </button>
                    </div>

                    {form.latitude && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                           <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">LATITUDE</div>
                           <div className="text-xs font-mono text-blue-400">{form.latitude.toFixed(8)}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                           <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">LONGITUDE</div>
                           <div className="text-xs font-mono text-blue-400">{form.longitude.toFixed(8)}</div>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                           <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">CONFIDENCE:</div>
                           <div className={`text-[10px] font-bold ${locationAccuracy && locationAccuracy < 10 ? 'text-emerald-500' : 'text-orange-500'}`}>
                             {locationAccuracy ? `+/- ${locationAccuracy.toFixed(1)} meters` : 'Calculating...'}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border border-slate-800 text-slate-500 font-bold uppercase transition-all hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl bg-orange-600 text-white font-bold uppercase shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Register APAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInspectModal && selectedApar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => !submitting && setShowInspectModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 border-b border-slate-800/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600/20 rounded-lg text-orange-500"><ClipboardCheck size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Audit APAR: {selectedApar.serial_number}</h3>
                  <p className="text-sm text-slate-500">Perform periodic safety inspection.</p>
                </div>
              </div>
              <button onClick={() => setShowInspectModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleInspectSubmit} className="flex flex-col flex-1 overflow-hidden">
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
                  onClick={() => setShowInspectModal(false)}
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
      )}

      {/* DETAIL MODAL FOR HISTORY */}
      {showDetailModal && detailData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowDetailModal(false)} />
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
                      <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
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
      )}
    </div>
  );
}
