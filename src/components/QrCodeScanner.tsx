import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CameraOff, SwitchCamera } from 'lucide-react';
import { isMobile } from 'react-device-detect';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const getQrboxSize = () => {
  const smallerEdge = Math.min(window.innerWidth, window.innerHeight);
  return Math.floor(smallerEdge * 0.7);
};

// Implementação Final e Definitiva do Leitor de QR Code
const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  // ID estático para o elemento do DOM para garantir estabilidade
  const readerId = "qr-code-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Configuração mínima e estável para a câmera
  const scannerConfig = { 
      fps: 10,
      qrbox: getQrboxSize,
  };

  // Callback de sucesso que para o scanner e envia o resultado
  const onScanSuccess = (decodedText: string) => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().then(() => {
        onScan(decodedText);
      }).catch(console.error);
    }
  };

  // Efeito principal que roda UMA VEZ para inicializar tudo
  useEffect(() => {
    // Cria a instância do scanner
    scannerRef.current = new Html5Qrcode(readerId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
    });

    // Busca as câmeras e inicia a padrão
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          const initialCameraId = (isMobile && backCamera) ? backCamera.id : devices[0].id;
          
          setSelectedCameraId(initialCameraId);

          // Inicia o scanner com a câmera padrão
          scannerRef.current?.start(initialCameraId, scannerConfig, onScanSuccess, () => {})
            .catch(err => {
              console.error("Falha ao iniciar a câmera inicial:", err);
              setError("Não foi possível iniciar a câmera. Verifique as permissões.");
            });
        } else {
          setError("Nenhuma câmera encontrada.");
        }
      })
      .catch(() => {
        setError("Não foi possível acessar as câmeras. Verifique as permissões do navegador.");
      });

    // Função de limpeza para garantir que a câmera pare ao desmontar o componente
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez

  // Função manual e segura para trocar de câmera
  const handleCameraChange = (newCameraId: string) => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().then(() => {
        setSelectedCameraId(newCameraId);
        scannerRef.current?.start(newCameraId, scannerConfig, onScanSuccess, () => {})
          .catch(err => {
            console.error("Falha ao trocar de câmera:", err);
            setError("Não foi possível trocar para esta câmera.");
          });
      }).catch(console.error);
    }
  };

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
