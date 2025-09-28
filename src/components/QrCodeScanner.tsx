import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

const QrCodeScanner = ({ onScanSuccess, onScanFailure }: QrCodeScannerProps) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scannerRef.current) {
      scannerInstance.current = new Html5QrcodeScanner(
        scannerRef.current.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        false
      );

      const handleScanSuccess = (decodedText: string) => {
        scannerInstance.current?.clear();
        const code = decodedText.split('#').pop() || '';
        onScanSuccess(code);
      };

      const handleScanFailure = (error: string) => {
        if (onScanFailure) {
          onScanFailure(error);
        }
      };

      scannerInstance.current.render(handleScanSuccess, handleScanFailure);
    }

    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id="reader" ref={scannerRef} />;
};

export default QrCodeScanner;
