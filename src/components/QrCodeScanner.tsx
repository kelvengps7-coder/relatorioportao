import { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (result: string | null) => void;
  onClose: () => void;
}

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  useEffect(() => {
    const qrCodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        // Use a câmera traseira por padrão em dispositivos móveis
        supportedScanTypes: [],
        facingMode: 'environment',
      },
      false, // verbose
    );

    const onScanSuccess = (decodedText: string) => {
      if (qrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
        qrCodeScanner.clear();
      }
      onScan(decodedText);
    };

    const onScanFailure = () => {
      // Ignorar falhas para evitar logs desnecessários
    };

    qrCodeScanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (qrCodeScanner && qrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
        qrCodeScanner.clear().catch((error) => {
          console.error('Falha ao limpar o leitor de QR code.', error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="relative bg-background p-6 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <h2 className="text-xl font-bold mb-2 text-center">Leitor de QR Code</h2>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Centralize o código QR na área de leitura.
        </p>
        <div className="overflow-hidden rounded-lg w-full">
          <div id="qr-reader"></div>
        </div>
      </div>
    </div>
  );
};

export default QrCodeScanner;
