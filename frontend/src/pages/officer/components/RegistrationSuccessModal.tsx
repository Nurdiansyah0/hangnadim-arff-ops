import { ClipboardCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { FireExtinguisher } from '../../../types/fireExtinguisher';

interface RegistrationSuccessModalProps {
  lastRegistered: FireExtinguisher;
  onClose: () => void;
}

export function RegistrationSuccessModal({ lastRegistered, onClose }: RegistrationSuccessModalProps) {
  const downloadQR = () => {
    const svg = document.getElementById('qr-download');
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${lastRegistered.serial_number}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-4xl p-10 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <ClipboardCheck size={40} />
            </div>
            
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Registration Success</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">Asset spatial lock engaged. Please print and affix the QR code to the unit.</p>

            <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl mb-8">
                <QRCodeSVG 
                    id="qr-download"
                    value={lastRegistered.serial_number} 
                    size={180}
                    level="H"
                    includeMargin={false}
                />
            </div>

            <div className="text-xl font-black text-white uppercase tracking-tighter mb-8">
                #{lastRegistered.serial_number}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={downloadQR}
                    className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-slate-700"
                >
                    Download PNG
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-600/20"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
  );
}
