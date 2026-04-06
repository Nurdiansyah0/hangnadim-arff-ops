import { useState } from 'react';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/axios';

interface ImageUploadProps {
  onUploadSuccess: (path: string) => void;
  label?: string;
}

export default function ImageUpload({ onUploadSuccess, label = "Upload Document/Photo" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Actual upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError(null);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess(res.data.file_path);
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
        {label}
      </label>

      <div className="relative group">
        {!preview ? (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-800 rounded-3xl cursor-pointer hover:bg-slate-900/50 hover:border-blue-500/50 transition-all gap-3 bg-slate-950/30">
            <div className="p-4 bg-slate-900 rounded-2xl text-slate-500 group-hover:text-blue-500 transition-colors">
              <Upload size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Click or drag to upload</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="relative w-full h-48 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <button 
                 onClick={() => { setPreview(null); setError(null); }}
                 className="p-3 bg-red-600 text-white rounded-xl shadow-xl hover:scale-110 transition-all"
               >
                  <X size={20} />
               </button>
            </div>
            
            {uploading && (
               <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center text-white gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Uploading to secure server...</span>
               </div>
            )}

            {!uploading && !error && (
               <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 size={16} />
               </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center italic">{error}</p>
      )}
    </div>
  );
}
