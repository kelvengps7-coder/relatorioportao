import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CameraOff, SwitchCamera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isMobile } from 'react-device-detect';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

// Calculates a responsive size for the QR code scanning box
const getQrboxSize = () => {
  const smallerEdge = Math.min(window.innerWidth, window.innerHeight);
  return Math.floor(smallerEdge * 0.7); // Use 70% of the smallest screen dimension
};

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const readerId = "qr-code-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [permissionError, setPermissionError] = useState(false);

  // Effect to initialize the scanner instance once on mount
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false, // Keep console output clean
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
    }
  }, []);

  // Effect to get camera permissions and list available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Default to the back camera on mobile, otherwise the first in the list
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          if (isMobile && backCamera) {
            setSelectedCameraId(backCamera.id);
          } else {
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch(() => {
        // Handle cases where camera permission is denied
        setPermissionError(true);
      });
  }, []);

  // Effect to start and manage the camera stream
  useEffect(() => {
    if (!selectedCameraId || !scannerRef.current) {
      return;
    }
    
    const scanner = scannerRef.current;
    
    // **DEFINITIVE FIX:** This is the most compatible configuration.
    // By NOT providing 'videoConstraints', we let the browser choose the best
    // settings, which avoids the "video recording mode" bug on mobile devices.
    const config = {
      fps: 10, // A lower FPS is often more stable for scanning
      qrbox: getQrboxSize,
    };

    // Stop scanning if the component is re-rendered or camera changes
    if (scanner.isScanning) {
      scanner.stop().catch(console.error);
    }
    
    scanner.start(
      selectedCameraId,
      config,
      (decodedText) => {
        // Success callback
        scanner.stop().catch(console.error);
        toast({ title: "Sucesso!", description: "QR Code lido. Processando..." });
        onScan(decodedText);
      },
      () => { /* Ignore scan failure callback */ }
    ).catch((error) => {
      console.error("Falha ao iniciar a câmera:", error);
      toast({
          title: "Erro de Câmera",
          description: "Não foi possível iniciar a câmera. Verifique as permissões do navegador.",
          variant: "destructive"
      });
      setPermissionError(true);
    });

    // Cleanup function to ensure the camera is stopped on component unmount
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [selectedCameraId, onScan, toast]);

  const handleCameraChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-[99]"
      onClick={onClose}
    >
      <div 
        className="relative bg-background p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-md mt-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3 z-[101]">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-background/70 hover:bg-background/90" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Leitor de QR Code</h2>
          <p className="text-sm text-muted-foreground">
            {permissionError ? "A permissão da câmera é necessária." : "Aponte a câmera para o código QR."}
          </p>
        </div>
        
        <div className="overflow-hidden rounded-lg w-full aspect-square bg-slate-900 flex items-center justify-center">
          {permissionError ? (
            <div className="text-center text-red-400 p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Não foi possível acessar a câmera.</p>
              <p className="text-xs text-muted-foreground mt-1">Por favor, libere o acesso nas configurações do seu navegador.</p>
            </div>
          ) : (
            <div id={readerId} className="w-full h-full" />
          )}
        </div>
        
        {cameras.length > 1 && !permissionError && (
          <div className="mt-4">
            <Select value={selectedCameraId} onValueChange={handleCameraChange}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <SwitchCamera className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trocar câmera" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {cameras.map(camera => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.label || `Câmera ${camera.id}`}
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