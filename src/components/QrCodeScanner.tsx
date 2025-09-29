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

// Versão Final e Estável do Leitor de QR Code
const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const readerId = "qr-code-reader-element-" + Math.random();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [permissionError, setPermissionError] = useState(false);

  // Efeito para inicializar o scanner e obter a lista de câmeras
  useEffect(() => {
    // Garante que o scanner seja inicializado apenas uma vez
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
    }

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Define a câmera padrão de forma inteligente, mas não inicia o scanner aqui
          if (!selectedCameraId) {
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
            if (isMobile && backCamera) {
              setSelectedCameraId(backCamera.id);
            } else {
              setSelectedCameraId(devices[0].id);
            }
          }
        } else {
          setPermissionError(true);
        }
      })
      .catch(() => {
        setPermissionError(true);
      });

    // Função de limpeza para desmontar o scanner ao sair
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Efeito para iniciar/parar o scanner quando a câmera selecionada mudar
  useEffect(() => {
    if (!selectedCameraId || !scannerRef.current) {
      return;
    }
    
    const scanner = scannerRef.current;

    // Configuração mínima para máxima compatibilidade
    const config = { 
        fps: 10,
        qrbox: getQrboxSize,
    };

    const successCallback = (decodedText: string) => {
        scanner.stop().catch(console.error); 
        onScan(decodedText);
    };
    
    const startScanner = async () => {
      // Sempre para o scanner antes de iniciar para evitar erros de troca
      if (scanner.isScanning) {
        await scanner.stop();
      }

      try {
        // Inicia usando apenas o ID da câmera, a abordagem mais estável
        await scanner.start(
            selectedCameraId, 
            config, 
            successCallback, 
            () => {} // Ignora falhas de decodificação por frame
        );
      } catch (error) {
        console.error("ERRO CRÍTICO AO INICIAR A CÂMERA:", error);
        setPermissionError(true);
      }
    };

    startScanner();

  }, [selectedCameraId, onScan]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-[99] pt-10" // pt-10 para posicionar no topo
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
            {permissionError ? "A permissão da câmera é necessária." : "Aponte a câmera para o código QR."}
          </p>
        </div>
        
        <div className="overflow-hidden rounded-lg w-full aspect-square bg-slate-900 flex items-center justify-center">
          {permissionError ? (
            <div className="text-center text-red-400 p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Falha ao acessar a câmera.</p>
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
