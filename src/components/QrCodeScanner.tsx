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

const getQrboxSize = () => {
  const smallerEdge = Math.min(window.innerWidth, window.innerHeight);
  return Math.floor(smallerEdge * 0.7);
};

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const readerId = "qr-code-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [permissionError, setPermissionError] = useState(false);

  // Initialize the scanner and get camera permissions
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
    }

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Set a default camera but don't start it here. The next effect will handle it.
          if (!selectedCameraId) {
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
            if (isMobile && backCamera) {
              setSelectedCameraId(backCamera.id);
            } else {
              setSelectedCameraId(devices[0].id);
            }
          }
        }
      })
      .catch(() => {
        setPermissionError(true);
      });
  }, []);

  // Effect to robustly start and manage the scanner
  useEffect(() => {
    if (!scannerRef.current) return;
    
    const scanner = scannerRef.current;
    
    // Minimal config to avoid "video mode" and improve compatibility
    const config = { fps: 10, qrbox: getQrboxSize };

    const successCallback = (decodedText: string) => {
      scanner.stop().catch(console.error);
      toast({ title: "Sucesso!", description: "QR Code lido. Processando..." });
      onScan(decodedText);
    };
    
    const errorCallback = (errorMessage: string) => {
      // Ignore common errors, but log others for debugging
      if (!errorMessage.includes("No MultiFormat reader")) {
        console.warn(`QR Scanner Error: ${errorMessage}`);
      }
    };

    const startScanner = async () => {
      // Always stop the scanner before starting a new session to prevent errors
      if (scanner.isScanning) {
        await scanner.stop();
      }

      try {
        // --- STRATEGY 1: IDEAL & ROBUST ---
        // On mobile, always prefer the 'environment' facing mode directly.
        // On desktop, or if a specific camera is chosen, use its deviceId.
        const isRearCameraPreferred = isMobile && (!selectedCameraId || cameras.find(c => c.id === selectedCameraId)?.label.toLowerCase().includes('back'));

        if (isRearCameraPreferred) {
          await scanner.start({ facingMode: "environment" }, config, successCallback, errorCallback);
        } else if (selectedCameraId) {
          await scanner.start(selectedCameraId, config, successCallback, errorCallback);
        } else {
           // Don't start if no camera is selected.
           return;
        }
      } catch (error) {
        // --- STRATEGY 2: FALLBACK ---
        // If the ideal method fails, try again with the selected device ID as a last resort.
        console.warn("Primary camera start failed, attempting fallback...", error);
        if (selectedCameraId) {
          try {
            await scanner.start(selectedCameraId, config, successCallback, errorCallback);
          } catch (fallbackError) {
            console.error("Camera start fallback also failed:", fallbackError);
            setPermissionError(true);
          }
        } else {
           setPermissionError(true);
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [selectedCameraId, cameras]); // Rerun when the selected camera or camera list changes

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
