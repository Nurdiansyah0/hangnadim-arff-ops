import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Send, 
  AlertTriangle, 
  Truck, 
  Camera, 
  ChevronLeft,
  X,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { useAuth } from '../../store/useAuth';
import { uploadFileInChunks } from '../../lib/upload';
import { ShieldAlert } from 'lucide-react';

interface OperationalContext {
    assigned_vehicle: string | null;
    assigned_vehicle_id: string | null;
}

export default function MaintenanceRequest() {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [opsContext, setOpsContext] = useState<OperationalContext | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Routine',
  });
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchOpsContext();
  }, []);

  const fetchOpsContext = async () => {
    try {
      const res = await api.get('/auth/me/context');
      setOpsContext(res.data);
    } catch (err) {
      console.error('Failed to fetch operational context', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { subject?: string; description?: string } = {};
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length > 100) {
      newErrors.subject = 'Subject must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast.error("Invalid file type. Please upload an image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!opsContext?.assigned_vehicle_id || !user?.personnel_id) {
       toast.error("SYSTEM DENIED: No active vehicle or personnel context found.");
       return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      if (selectedFile) {
        photoUrl = await uploadFileInChunks(selectedFile, (progress) => setUploadProgress(progress));
      }

      // Backend expects a single description field. We prepend the priority and subject for clarity.
      const finalDescription = `[PRIORITY: ${formData.priority}] [${formData.subject.toUpperCase()}] - ${formData.description}`;
      
      await api.post('/maintenance', {
        vehicle_id: opsContext.assigned_vehicle_id,
        maintenance_type: null,
        description: finalDescription,
        performed_by: user.personnel_id,
        performed_at: null,
        cost: null,
        next_due: null,
        photo_url: photoUrl
      });

      setSuccess(true);
      setTimeout(() => navigate('/staff/dashboard'), 2000);
    } catch (err: any) {
      console.error('Server Refused Request:', err);
      const msg = err.response?.data || err.message || 'Transmission failed';
      toast.error(`Server Diagnostic Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormLocked = !opsContext?.assigned_vehicle_id;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Ops</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center text-orange-500 shadow-xl shadow-orange-950/20">
                <Wrench size={32} />
             </div>
             <div>
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Request Maintenance</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Field Equipment & Fleet Support</p>
             </div>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl text-center">
               <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <Send size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 uppercase italic">Request Dispatched</h3>
               <p className="text-slate-400 text-sm">The Technical Team has received the vehicle defect report. Please await technician investigation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Dynamic Vehicle Lock context */}
              {opsContext?.assigned_vehicle_id ? (
                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                              <Truck size={24} />
                          </div>
                          <div>
                              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Active Duty Unit Auto-Lock</div>
                              <div className="text-white font-black text-lg leading-none">{opsContext.assigned_vehicle}</div>
                          </div>
                      </div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20">Locked</div>
                  </div>
              ) : opsContext != null ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                      <AlertTriangle className="text-red-500 shrink-0" size={24} />
                      <div>
                          <div className="text-red-400 font-bold mb-1">NO ACTIVE VEHICLE ASSIGNED</div>
                          <div className="text-[10px] text-red-500/80 uppercase font-bold tracking-widest leading-relaxed">
                            System refused submission. You must check-in to a shift and select an operational vehicle before reporting maintenance tickets.
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-slate-800 animate-pulse h-20 rounded-2xl" />
              )}

              {/* Priority Dropdown */}
              <div className="space-y-2">
                <label htmlFor="priority" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Maintenance Priority</label>
                <div className="relative">
                  <ShieldAlert className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFormLocked ? 'text-slate-700' : 'text-slate-500'}`} size={18} />
                  <select
                    id="priority"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none disabled:opacity-50"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    disabled={isFormLocked || loading}
                    aria-disabled={isFormLocked || loading}
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject / Component Defect</label>
                <div className="relative">
                  <Wrench className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFormLocked ? 'text-slate-700' : 'text-slate-500'}`} size={18} />
                  <input 
                    id="subject"
                    type="text" 
                    placeholder="e.g. Malfunction on foam turret valve"
                    className={`w-full bg-slate-950 border ${errors.subject ? 'border-red-500/50' : 'border-slate-800'} rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50`}
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({...formData, subject: e.target.value});
                      if (errors.subject) setErrors({...errors, subject: undefined});
                    }}
                    disabled={isFormLocked || loading}
                    aria-disabled={isFormLocked || loading}
                  />
                  <div className="absolute right-4 -bottom-5 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                    {formData.subject.length}/100
                  </div>
                </div>
                {errors.subject && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tighter mt-1 ml-1">{errors.subject}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detailed Technical Description</label>
                <div className="relative">
                  <textarea 
                    id="description"
                    rows={4}
                    placeholder="Describe the nature of the malfunction or defect in detail so engineering can understand the scope..."
                    className={`w-full bg-slate-950 border ${errors.description ? 'border-red-500/50' : 'border-slate-800'} rounded-3xl p-6 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all resize-none disabled:opacity-50`}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({...formData, description: e.target.value});
                      if (errors.description) setErrors({...errors, description: undefined});
                    }}
                    disabled={isFormLocked || loading}
                    aria-disabled={isFormLocked || loading}
                  />
                  <div className="absolute right-6 bottom-4 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                    {formData.description.length}/1000
                  </div>
                </div>
                {errors.description && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tighter mt-1 ml-1">{errors.description}</p>}
              </div>

              <div className="space-y-4">
                <input 
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isFormLocked || loading}
                />
                
                {previewUrl && (
                  <div className="relative w-full aspect-video bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden group">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                    {loading && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                          <div 
                            className="bg-orange-500 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-black text-white uppercase tracking-widest">Uploading Chunked Data... {uploadProgress}%</div>
                      </div>
                    )}
                  </div>
                )}

                <div 
                  className={`flex flex-col md:flex-row gap-4 p-4 rounded-3xl transition-all ${isDragging ? 'bg-orange-500/10 border-2 border-dashed border-orange-500/50 scale-[1.02]' : 'bg-transparent border-2 border-transparent'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <button 
                    type="button" 
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={isFormLocked || loading}
                    aria-disabled={isFormLocked || loading}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white hover:border-slate-700 transition-all group disabled:opacity-50"
                  >
                      <Camera size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {selectedFile ? 'Change Photo' : 'Attach Photo'}
                      </span>
                  </button>
                  
                  <button 
                    type="submit"
                    disabled={isFormLocked || loading}
                    aria-disabled={isFormLocked || loading}
                    aria-busy={loading}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/20 transition-all disabled:opacity-50 group"
                  >
                      {loading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Submit Trouble Ticket</span>
                          <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                      )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <AlertTriangle className="absolute -right-12 -bottom-12 w-48 h-48 text-orange-500/5 pointer-events-none" />
      </div>
    </div>
  );
}
