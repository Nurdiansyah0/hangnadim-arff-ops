import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  User, 
  Truck, 
  Clock, 
  Filter,
  Download,
  AlertTriangle,
  RotateCcw,
  Users,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';

interface RosterEntry {
  id: string;
  assignment_date: string;
  personnel_id: string;
  personnel_name: string;
  team_name: string;
  shift_name: string;
  vehicle_id: string | null;
  vehicle_code: string | null;
  position: string;
  status: string;
}

export default function Roster() {
  const { user } = useAuth();
  const isRestricted = user?.role_id !== 1 && user?.role_id !== 3;

  const [data, setData] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterTeam, setFilterTeam] = useState('ALL');

  useEffect(() => {
    if (isRestricted && user?.shift_team) {
      setFilterTeam(user.shift_team);
    }
  }, [user, isRestricted]);
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<RosterEntry | null>(null);
  const [vehicles, setVehicles] = useState<{id: string, code: string}[]>([]);
  const [updating, setUpdating] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('RESCUEMAN');

  useEffect(() => {
    fetchRoster();
    fetchVehicles();
  }, [month, year]);

  useEffect(() => {
    if (selectedAssignment) {
      setSelectedVehicle(selectedAssignment.vehicle_id);
      setSelectedPosition(selectedAssignment.position);
    }
  }, [selectedAssignment]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicles');
    }
  };

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roster/view', { params: { month, year } });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) return;
    try {
      setUpdating(true);
      await api.patch(`/roster/assignments/${selectedAssignment.id}`, {
        vehicle_id: selectedVehicle,
        position: selectedPosition
      });
      setShowModal(false);
      await fetchRoster();
    } catch (err) {
      alert('Failed to update vehicle assignment.');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm(`Generate automated roster for ${monthNames[month-1]} ${year}? Existing data for this month will be overwritten if collisions occur.`)) return;
    try {
      setGenerating(true);
      await api.post('/roster/generate-monthly', { month, year });
      await fetchRoster();
    } catch (err) {
      alert('Failed to generate roster. Ensure all personnel and shift data are seeded.');
    } finally {
      setGenerating(false);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const filteredData = filterTeam === 'ALL' 
    ? data 
    : data.filter(d => d.team_name === filterTeam);

  // Group by date
  const groupedData: Record<string, RosterEntry[]> = {};
  filteredData.forEach(entry => {
    if (!groupedData[entry.assignment_date]) groupedData[entry.assignment_date] = [];
    groupedData[entry.assignment_date].push(entry);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const dates = showOnlyToday 
    ? Object.keys(groupedData).filter(d => d === todayStr)
    : Object.keys(groupedData).sort();

  return (
    <div className="space-y-6">
      {/* Header section with glassmorphism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-4xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-500 flex items-center justify-center ring-1 ring-blue-500/30 shadow-2xl shadow-blue-900/20">
            <Calendar size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Duty Matrix <span className="text-blue-500">Dashboard</span>
            </h1>
            <p className="text-slate-400 mt-1 font-medium">Automated RACI-based deployments & shift rotation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden p-1">
            <button onClick={prevMonth} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white transition-all rounded-xl">
              <ChevronLeft size={20} />
            </button>
            <div className="px-6 py-2 text-center min-w-[140px]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80 mb-0.5">{year}</div>
              <div className="text-sm font-bold text-white tracking-wide">{monthNames[month - 1]}</div>
            </div>
            <button onClick={nextMonth} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white transition-all rounded-xl">
              <ChevronRight size={20} />
            </button>
          </div>

          {(user?.role_id === 1 || user?.role_id === 3 || user?.role_id === 5) && (
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-2xl p-1 gap-1">
               <button 
                  onClick={() => setShowOnlyToday(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!showOnlyToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white'}`}
               >
                  MONTH
               </button>
               <button 
                  onClick={() => setShowOnlyToday(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${showOnlyToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white'}`}
               >
                  TODAY
               </button>
            </div>
          )}

          {(user?.role_id === 1 || user?.role_id === 3 || user?.role_id === 5) && (
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/40 flex items-center gap-3 font-bold group"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />}
              Generate Roster
            </button>
          )}

          <button className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all border border-slate-700">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-2xl px-5 py-3.5 focus-within:border-blue-500/50 transition-all">
          <Filter size={18} className="text-slate-500" />
          <select 
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className={`bg-transparent border-none text-white text-sm font-bold outline-none flex-1 appearance-none ${isRestricted ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
            disabled={isRestricted}
          >
            {isRestricted && user?.shift_team ? (
              <option value={user.shift_team}>My Team: {user.shift_team}</option>
            ) : (
              <>
                <option value="ALL">All Operational Teams</option>
                <option value="Alpha">Team Alpha</option>
                <option value="Bravo">Team Bravo</option>
                <option value="Charlie">Team Charlie</option>
                <option value="Normal">Administrative (Normal)</option>
              </>
            )}
          </select>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-950/30 px-6 py-3 rounded-full border border-slate-800/50">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Morning
           </div>
           <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Night
           </div>
           <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Normal
           </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-4xl border-2 border-dashed border-slate-800">
          <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
          <p className="font-bold tracking-[0.2em] uppercase text-xs">Syncing Ops Matrix...</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-4xl border-2 border-dashed border-slate-800">
          <AlertTriangle size={48} className="mb-4 text-amber-500/50" />
          <p className="font-bold tracking-tight text-xl text-white">No Roster Data Found</p>
          <p className="text-sm mt-2 text-slate-400 max-w-md text-center">There are no assignments generated for this month yet. Use the 'Generate Roster' button to initialize.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {dates.map(dateStr => {
            const date = new Date(dateStr);
            const isToday = new Date().toDateString() === date.toDateString();
            
            return (
              <div key={dateStr} className={`bg-slate-900/40 border rounded-4xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-900/20 group ${isToday ? 'border-blue-500/50 scale-[1.02] bg-slate-900/60' : 'border-slate-800 hover:border-slate-700'}`}>
                {/* Date Header */}
                <div className={`p-6 border-b flex items-center justify-between ${isToday ? 'bg-blue-600/10 border-blue-500/20' : 'bg-slate-950/20 border-slate-800/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'} shadow-lg`}>
                       <span className="text-[10px] font-black uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                       <span className="text-xl font-black -mt-1">{date.getDate()}</span>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500">{date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                      {isToday && <div className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mt-0.5 animate-pulse">Operational Today</div>}
                    </div>
                  </div>
                  <Clock size={16} className="text-slate-600" />
                </div>

                {/* Assignments List */}
                <div className="p-4 space-y-3">
                   {groupedData[dateStr].map((assignment) => {
                      const isMorning = assignment.shift_name === 'Morning';
                      const isNight = assignment.shift_name === 'Night';

                      return (
                        <div 
                          key={assignment.id} 
                          onClick={() => {
                            if (user?.role_id === 1 || user?.role_id === 3 || user?.role_id === 5) {
                              setSelectedAssignment(assignment);
                              setShowModal(true);
                            }
                          }}
                          className={`p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 hover:border-blue-500/50 transition-all cursor-pointer group/card ${isToday ? 'hover:bg-slate-900' : ''}`}
                        >
                           <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white ${isMorning ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : isNight ? 'bg-purple-600 shadow-lg shadow-purple-900/50' : 'bg-emerald-600 shadow-lg shadow-emerald-900/50'}`}>
                                    {assignment.shift_name[0]}
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-bold text-white leading-none group-hover/card:text-blue-400 transition-colors">{assignment.personnel_name}</h4>
                                    <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mt-2">
                                       Team {assignment.team_name} — {assignment.position}
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/30">
                              {assignment.vehicle_code ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10">
                                   <Truck size={14} />
                                   {assignment.vehicle_code}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                                   <User size={14} />
                                   {assignment.position === 'WATCHROOM' ? 'Watchroom Duty' : 'Unassigned'}
                                </div>
                              )}
                              
                              <div className={`ml-auto text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${assignment.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {assignment.status}
                              </div>
                           </div>
                        </div>
                      );
                   })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Assignment Modal - Premium Redesign */}
      {showModal && selectedAssignment && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => !updating && setShowModal(false)} />
          
          <div className="relative w-full max-w-xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_20px_100px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300">
            {/* Header / Banner */}
            <div className="h-28 bg-linear-to-br from-blue-600 to-indigo-900 relative">
               <div className="absolute inset-0 bg-slate-950/20" />
               <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all border border-white/10"
               >
                  <Users size={18} />
               </button>
            </div>

            {/* Personnel Identity Profile */}
            <div className="px-10 pb-10 -mt-14 relative">
               <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 rounded-4xl bg-slate-900 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-3xl font-black text-white bg-linear-to-tr from-slate-800 to-slate-700">
                    {selectedAssignment.personnel_name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="mt-4 text-xl font-black text-white tracking-tight">{selectedAssignment.personnel_name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                     <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                        Team {selectedAssignment.team_name}
                     </span>
                  </div>
               </div>

               <div className="mt-8 space-y-6">
                  {/* Vehicle Selection Grid */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                       <Truck size={14} /> 1. Select Unit
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                       <button 
                         onClick={() => { setSelectedVehicle(null); setSelectedPosition('WATCHROOM'); }}
                         className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 overflow-hidden ${selectedVehicle === null && selectedPosition === 'WATCHROOM'
                           ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20' 
                           : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'}`}
                       >
                          <ShieldAlert size={20} className={selectedVehicle === null && selectedPosition === 'WATCHROOM' ? 'text-white' : 'text-slate-500'} />
                          <div className={`text-[10px] font-black uppercase tracking-wider ${selectedVehicle === null && selectedPosition === 'WATCHROOM' ? 'text-white' : 'text-slate-300'}`}>Watchroom</div>
                       </button>

                       {vehicles.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => { setSelectedVehicle(v.id); if (selectedPosition === 'WATCHROOM' || selectedPosition === 'RESCUEMAN') setSelectedPosition('DRIVER'); }}
                            className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 overflow-hidden ${selectedVehicle === v.id 
                              ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20' 
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'}`}
                          >
                             <Truck size={20} className={selectedVehicle === v.id ? 'text-white' : 'text-blue-500'} />
                             <div className={`text-[10px] font-black uppercase tracking-wider ${selectedVehicle === v.id ? 'text-white' : 'text-slate-300'}`}>{v.code}</div>
                          </button>
                       ))}

                       <button 
                         onClick={() => { setSelectedVehicle(null); setSelectedPosition('RESCUEMAN'); }}
                         className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 overflow-hidden ${selectedVehicle === null && selectedPosition === 'RESCUEMAN'
                           ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20' 
                           : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'}`}
                       >
                          <User size={20} className={selectedVehicle === null && selectedPosition === 'RESCUEMAN' ? 'text-white' : 'text-slate-500'} />
                          <div className={`text-[10px] font-black uppercase tracking-wider ${selectedVehicle === null && selectedPosition === 'RESCUEMAN' ? 'text-white' : 'text-slate-300'}`}>Standby</div>
                       </button>
                    </div>
                  </div>

                  {/* Position Selection (Only if vehicle is selected) */}
                  {selectedVehicle && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                         <User size={14} /> 2. Set Duty Role
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['DRIVER', 'NOZZLEMAN', 'AST_NOZZLEMAN', 'CREW', 'OSC'].map(pos => (
                          <button
                            key={pos}
                            onClick={() => setSelectedPosition(pos)}
                            className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedPosition === pos ? 'bg-blue-500 border-blue-400 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                          >
                            {pos.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                     <button 
                       onClick={handleUpdateAssignment}
                       disabled={updating}
                       className="w-full py-5 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all flex items-center justify-center gap-3"
                     >
                        <span className="text-sm font-black uppercase tracking-widest">Commit Assignment</span>
                     </button>
                  </div>
               </div>
            </div>

            {updating && (
               <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                  <p className="text-white font-black text-xs uppercase tracking-[0.3em]">Updating Ops Matrix...</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
