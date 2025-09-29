// src/components/QrCodeScanner.tsx
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (result: string | null) => void;
  onClose: () => void;
}

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', 
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false // verbose
    );
    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      scanner.clear();
      onScan(decodedText);
    };

    const onScanFailure = (error: any) => {
      // console.warn(`QR error = ${error}`);
    };
    
    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 rounded-full" 
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold mb-4 text-center">Escanear Código QR</h2>
        <div id="qr-reader" className="w-full"></div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Aponte a câmera para o código QR.
        </p>
      </div>
    </div>
  );
};

export default QrCodeScanner;
