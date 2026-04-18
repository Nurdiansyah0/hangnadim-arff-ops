import { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerHandlerProps {
  onSuccess: (text: string) => void;
  onError: (err: string) => void;
}

export function QRScannerHandler({ onSuccess, onError }: QRScannerHandlerProps) {
    useEffect(() => {
        const scanner = new Html5Qrcode("qr-reader");
        
        const startScanner = async () => {
            try {
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        onSuccess(decodedText);
                    },
                    undefined
                );
            } catch (err) {
                console.error("Failed to start QR scanner", err);
                onError("Camera access denied or hardware not found.");
            }
        };

        startScanner();

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(err => console.error("Error stopping scanner", err));
            }
        };
    }, [onSuccess, onError]);

    return null;
}
