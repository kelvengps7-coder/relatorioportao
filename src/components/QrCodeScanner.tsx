import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, CameraOff } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

// Função para calcular o tamanho da área de leitura (qrbox) de forma responsiva
const getQrboxSize = () => {
  const smallerEdge = Math.min(window.innerWidth, window.innerHeight);
  const qrboxSize = Math.floor(smallerEdge * 0.7); // 70% do menor lado da tela
  return qrboxSize;
};

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const readerId = "qr-code-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // A instância do scanner é criada aqui para garantir que o elemento DOM exista.
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
    }
    const scanner = scannerRef.current;
    
    let isScanning = true;
    setPermissionError(false);

    const startCamera = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
          const lastUsedCameraId = localStorage.getItem('lastUsedCameraId');
          const camera = cameras.find(c => c.id === lastUsedCameraId) || cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[0];
          
          await scanner.start(
            camera.id,
            {
              fps: 30,
              qrbox: getQrboxSize(), // Executa a função para obter o valor
              aspectRatio: 1.0,
              disableFlip: false,
            },
            (decodedText) => {
              if (isScanning) {
                isScanning = false;
                onScan(decodedText);
                localStorage.setItem('lastUsedCameraId', camera.id);
              }
            },
            () => { /* Ignorar falhas de varredura contínua */ }
          );
        } else {
          throw new Error("Nenhuma câmera foi encontrada.");
        }
      } catch (err) {
        console.error("Falha ao iniciar o leitor de QR code:", err);
        setPermissionError(true);
      }
    };

    startCamera();

    return () => {
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().catch(error => {
          console.error("Erro ao parar o leitor de QR code:", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-[99]"
      onClick={onClose}
    >
      <div 
        className="relative bg-background p-6 rounded-2xl shadow-lg w-full max-w-sm mt-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3 z-[101]">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 bg-background/70 hover:bg-background/90 backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Leitor de QR Code</h2>
          <p className="text-sm text-muted-foreground">
            {permissionError ? "A permissão da câmera é necessária." : "Posicione o código na área de leitura."}
          </p>
        </div>
        
        <div className="overflow-hidden rounded-lg w-full aspect-square bg-slate-900 flex items-center justify-center">
          {permissionError ? (
            <div className="text-center text-red-400">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm font-medium">Não foi possível acessar a câmera.</p>
              <p className="text-xs text-muted-foreground mt-1">Por favor, libere o acesso nas configurações do seu navegador.</p>
            </div>
          ) : (
            <div id={readerId} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCodeScanner;
