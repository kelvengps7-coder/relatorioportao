import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CameraOff, SwitchCamera } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

// Interface para a nossa lista de câmeras simplificada
interface SimplifiedCamera {
  id: string;
  label: string;
}

const getQrboxSize = () => {
  const smallerEdge = Math.min(window.innerWidth, window.innerHeight);
  return Math.floor(smallerEdge * 0.7);
};

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const readerId = "qr-code-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [cameras, setCameras] = useState<SimplifiedCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Efeito principal que gerencia o ciclo de vida do scanner
  useEffect(() => {
    scannerRef.current = new Html5Qrcode(readerId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
    });

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          // --- LÓGICA DE FILTRAGEM INTELIGENTE ---
          const frontCamera = devices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('frontal'));
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));

          const simplifiedCameras: SimplifiedCamera[] = [];
          if (backCamera) simplifiedCameras.push({ id: backCamera.id, label: 'Câmera Traseira' });
          if (frontCamera) simplifiedCameras.push({ id: frontCamera.id, label: 'Câmera Frontal' });
          
          setCameras(simplifiedCameras);
          
          // --- PRIORIDADE TRASEIRA GARANTIDA ---
          const initialCameraId = backCamera?.id || simplifiedCameras[0]?.id;
          if (initialCameraId) {
            setSelectedCameraId(initialCameraId);
          } else {
            setError("Nenhuma câmera compatível encontrada.");
          }
        } else {
          setError("Nenhuma câmera encontrada.");
        }
      })
      .catch(() => {
        setError("Não foi possível acessar as câmeras. Verifique as permissões.");
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Efeito para iniciar e trocar a câmera
  useEffect(() => {
    if (!selectedCameraId || !scannerRef.current) return;

    const scanner = scannerRef.current;
    
    // Para a câmera antes de iniciar uma nova
    if (scanner.isScanning) {
      scanner.stop();
    }
    
    scanner.start(
      selectedCameraId, 
      { fps: 10, qrbox: getQrboxSize }, 
      (decodedText) => {
        onScan(decodedText);
      }, 
      (errorMessage) => {
        // Log de depuração para entender falhas de leitura
        console.debug("QR Scanner Error:", errorMessage);
      }
    ).catch(() => {
      setError("Não foi possível iniciar esta câmera.");
    });

  }, [selectedCameraId]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-[99] pt-10"
      onClick={onClose}
    >
      <div 
        className="relative bg-background p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-background/70 hover:bg-background/90" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Leitor de QR Code</h2>
          <p className="text-sm text-muted-foreground">
            {error || "Aponte a câmera para o código QR."}
          </p>
        </div>
        
        <div className="overflow-hidden rounded-lg w-full aspect-square bg-slate-900 flex items-center justify-center">
          {error ? (
            <div className="text-center text-red-400 p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <div id={readerId} className="w-full h-full" />
          )}
        </div>
        
        {cameras.length > 1 && !error && (
          <div className="mt-4">
            <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <SwitchCamera className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trocar câmera" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {cameras.map(camera => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCodeScanner;
