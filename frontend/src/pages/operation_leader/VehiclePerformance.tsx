import { useState, useEffect } from 'react';
import {
    Gauge,
    Wind,
    Droplets,
    StopCircle,
    Plus,
    History,
    Calendar,
    ClipboardCheck,
    Loader2,
    ShieldCheck,
    Search,
    ChevronRight,
    Car
} from 'lucide-react';
import { api } from '../../lib/axios';

interface PerformanceTest {
    id: string;
    vehicle_id: string;
    vehicle_code?: string;
    inspector_name?: string;
    test_date: string;
    top_speed_kmh: number;
    discharge_range_m: number;
    discharge_rate_lpm: number;
    stopping_distance_m: number;
    remarks: string | null;
    status: string;
}

interface Vehicle {
    id: string;
    code: string;
    name: string;
}

export default function VehiclePerformance() {
    const [tests, setTests] = useState<PerformanceTest[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [topSpeed, setTopSpeed] = useState('');
    const [range, setRange] = useState('');
    const [rate, setRate] = useState('');
    const [distance, setDistance] = useState('');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [testRes, vehicleRes] = await Promise.all([
                api.get('/performance/vehicle'),
                api.get('/vehicles')
            ]);
            setTests(testRes.data);
            setVehicles(vehicleRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/performance/vehicle', {
                vehicle_id: selectedVehicle,
                test_date: new Date().toISOString(),
                top_speed_kmh: parseFloat(topSpeed),
                discharge_range_m: parseFloat(range),
                discharge_rate_lpm: parseFloat(rate),
                stopping_distance_m: parseFloat(distance),
                remarks: remarks,
                status: 'PASS' // Logic can be added here for automatic PASS/FAIL
            });
            setShowModal(false);
            fetchData();
            // Reset form
            setSelectedVehicle('');
            setTopSpeed('');
            setRange('');
            setRate('');
            setDistance('');
            setRemarks('');
        } catch (err) {
            alert('Failed to save performance test');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-1">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter italic uppercase">
                        <Gauge className="text-blue-500" size={40} />
                        Vehicle Performance Test
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium italic">
                        Standardized operational capability verification for ARFF fleet
                    </p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-xl shadow-blue-900/30 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    New Performance Test
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Avg Top Speed', value: '82.4', unit: 'KM/H', icon: Gauge, color: 'text-blue-400' },
                    { label: 'Avg Range', value: '75.2', unit: 'METERS', icon: Wind, color: 'text-emerald-400' },
                    { label: 'Avg Rate', value: '4200', unit: 'L/MIN', icon: Droplets, color: 'text-cyan-400' },
                    { label: 'Total Tests', value: tests.length, unit: 'SESSIONS', icon: ClipboardCheck, color: 'text-purple-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon size={100} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{stat.value}</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">{stat.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: History */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-950/20">
                    <div className="flex items-center gap-3">
                        <History className="text-blue-500" size={24} />
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Test History Log</h2>
                    </div>
                    
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by vehicle or inspector..."
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-950/40 border-b border-slate-800/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Vehicle</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Speed (KM/H)</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Range (M)</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Rate (L/M)</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Brake (M)</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-blue-500" size={40} />
                                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Test Data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : tests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-slate-600 italic">No performance tests recorded yet.</td>
                                </tr>
                            ) : (
                                tests.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                    <Car size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-black uppercase tracking-tight">{test.vehicle_code}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2 mt-1">
                                                        <Calendar size={12} /> {new Date(test.test_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-white font-black">{test.top_speed_kmh}</span>
                                                <span className="text-[10px] text-slate-600 font-bold uppercase">KM/H</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-white font-black">{test.discharge_range_m}</span>
                                                <span className="text-[10px] text-slate-600 font-bold uppercase">M</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-white font-black">{test.discharge_rate_lpm}</span>
                                                <span className="text-[10px] text-slate-600 font-bold uppercase">LPM</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-white font-black">{test.stopping_distance_m}</span>
                                                <span className="text-[10px] text-slate-600 font-bold uppercase">M</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                test.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                                {test.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-slate-600 hover:text-white transition-colors">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">New Performance Record</h3>
                                    <p className="text-slate-400 text-sm mt-1">Enter verified metrics from the field test</p>
                                </div>
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 transition-colors"
                                >
                                    <Plus className="rotate-45" size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Armada / Vehicle</label>
                                        <select
                                            required
                                            value={selectedVehicle}
                                            onChange={(e) => setSelectedVehicle(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none font-medium"
                                        >
                                            <option value="">Select Vehicle</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.code} - {v.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Top Speed (KM/H)</label>
                                        <div className="relative">
                                            <Gauge className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                                            <input 
                                                required type="number" step="0.1"
                                                value={topSpeed} onChange={(e) => setTopSpeed(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl pl-16 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-black"
                                                placeholder="0.0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Discharge Range (Meters)</label>
                                        <div className="relative">
                                            <Wind className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                                            <input 
                                                required type="number" step="1"
                                                value={range} onChange={(e) => setRange(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl pl-16 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-black"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Discharge Rate (L/Min)</label>
                                        <div className="relative">
                                            <Droplets className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                                            <input 
                                                required type="number" step="1"
                                                value={rate} onChange={(e) => setRate(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl pl-16 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-black"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Stopping Distance (Meters)</label>
                                        <div className="relative">
                                            <StopCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                                            <input 
                                                required type="number" step="0.1"
                                                value={distance} onChange={(e) => setDistance(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl pl-16 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-black"
                                                placeholder="0.0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Remarks & Observations</label>
                                        <textarea 
                                            rows={3}
                                            value={remarks} onChange={(e) => setRemarks(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-medium"
                                            placeholder="Additional field test remarks..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/30"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Save Performance Record</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
