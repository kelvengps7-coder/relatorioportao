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

  // Initialize the scanner instance
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
    }
  }, []);

  // Get available cameras and set a preferred default
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer the back camera on mobile, otherwise the first camera
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          if (isMobile && backCamera) {
            setSelectedCameraId(backCamera.id);
          } else {
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch(() => {
        setPermissionError(true);
      });
  }, []);

  // Start and stop the scanner when the selected camera changes
  useEffect(() => {
    if (!selectedCameraId || !scannerRef.current) {
      return;
    }
    
    const scanner = scannerRef.current;
    let isScanning = true;

    const startScanner = async () => {
      // Simplified configuration to be more compatible with mobile browsers
      const config = {
        fps: 15,
        qrbox: getQrboxSize,
        aspectRatio: 1.0,
      };

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }

        // First attempt: Use flexible constraints
        await scanner.start(
          selectedCameraId,
          {
            ...config,
            // This is the key change: flexible constraints instead of rigid ones
            videoConstraints: {
              facingMode: "environment"
            }
          },
          (decodedText) => {
            if (isScanning) {
              isScanning = false;
              scanner.stop().catch(console.error);
              toast({ title: "Sucesso!", description: "QR Code lido. Processando..." });
              onScan(decodedText);
            }
          },
          () => { /* Ignore scan failure */ }
        );
      } catch (error) {
        console.warn("Falha ao iniciar com 'environment', tentando fallback:", error);
        
        // Fallback attempt: If the first one fails, try starting with minimal constraints
        try {
          if (scanner.isScanning) await scanner.stop();
          
          await scanner.start(
              selectedCameraId,
              config, // Start without specific videoConstraints
              (decodedText) => {
                  if (isScanning) {
                      isScanning = false;
                      scanner.stop().catch(console.error);
                      toast({ title: "Sucesso!", description: "QR Code lido. Processando..." });
                      onScan(decodedText);
                    }
                },
                () => { /* Ignore scan failure */ }
          );
        } catch (fallbackError) {
          console.error("Falha no fallback da câmera:", fallbackError);
          toast({
              title: "Erro de Câmera",
              description: "Não foi possível iniciar a câmera. Verifique as permissões do navegador.",
              variant: "destructive"
          });
          setPermissionError(true);
        }
      }
    };

    startScanner();

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [selectedCameraId, onScan, toast]);

  const handleCameraChange = (newCameraId: string) => {
    if (scannerRef.current) {
      setSelectedCameraId(newCameraId);
    }
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