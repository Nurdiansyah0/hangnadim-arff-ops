import { X, QrCode } from 'lucide-react';
import { QRScannerHandler } from './QRScannerHandler';

interface QrScannerModalProps {
  onClose: () => void;
  onSuccess: (text: string) => void;
  onError: (err: string) => void;
  qrError: string | null;
  currentCoords: { lat: number; lng: number } | null;
  filteredAccuracy: number | null;
}

export function QrScannerModal({
  onClose,
  onSuccess,
  onError,
  qrError,
  currentCoords,
  filteredAccuracy
}: QrScannerModalProps) {
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-4xl p-8 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
                    <QrCode size={32} />
                </div>
                
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Tactical QR Scanner</h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Align the unit QR code within the frame for spatial verification.</p>
                </div>

                <div className="w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-slate-800 relative group">
                    <div id="qr-reader" className="w-full h-full" />
                    
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-64 h-64 border-2 border-blue-500/50 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -translate-x-1 -translate-y-1 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 translate-x-1 -translate-y-1 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -translate-x-1 translate-y-1 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 translate-x-1 translate-y-1 rounded-br-lg" />
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 animate-[scan_2s_ease-in-out_infinite]" />
                        </div>
                    </div>
                </div>

                {qrError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 w-full flex items-center gap-3 text-red-400 text-left">
                        <X className="shrink-0" size={18} />
                        <span className="text-xs font-bold leading-tight">{qrError}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
                    <div className={`w-2 h-2 rounded-full ${currentCoords ? (filteredAccuracy && filteredAccuracy < 20 ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500 animate-pulse') : 'bg-red-500'}`} />
                    GPS Lock: {currentCoords ? (filteredAccuracy && filteredAccuracy < 50 ? `±${filteredAccuracy.toFixed(1)}m` : 'CALIBRATING...') : 'SEARCHING SIGNAL...'}
                </div>
            </div>

            <QRScannerHandler onSuccess={onSuccess} onError={onError} />
        </div>
    </div>
  );
}
