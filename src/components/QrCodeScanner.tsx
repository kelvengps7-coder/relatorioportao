import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { X, CameraOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

// Componente de Leitor de QR Code Profissional usando a biblioteca ZXing
const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const { toast } = useToast();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Inicialização e busca por câmeras
  useEffect(() => {
    const initScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices && videoInputDevices.length > 0) {
          setDevices(videoInputDevices);
          // Prioriza a câmera traseira (environment)
          const rearCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('traseira'));
          setSelectedDeviceId(rearCamera ? rearCamera.deviceId : videoInputDevices[0].deviceId);
        } else {
          setError("Nenhuma câmera encontrada.");
        }
      } catch (err) {
        console.error("Erro ao listar câmeras:", err);
        setError("Erro ao acessar câmeras. Verifique as permissões do navegador.");
      }
    };
    initScanner();
  }, []);

  // Lógica de início e parada do scanner
  useEffect(() => {
    if (!selectedDeviceId || !videoRef.current) {
      return;
    }

    const codeReader = codeReaderRef.current;
    const videoElement = videoRef.current;

    const startScan = async () => {
      try {
        await codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
          if (result) {
            // Sucesso na leitura
            onScan(result.getText());
            codeReader.reset(); // Para a câmera
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('Erro de decodificação:', err);
          }
        });
      } catch (err) {
        console.error('Falha crítica ao iniciar o leitor:', err);
        setError('Não foi possível iniciar a câmera selecionada.');
      }
    };

    startScan();

    // Função de limpeza para garantir que a câmera pare ao sair
    return () => {
      codeReader.reset();
    };
  }, [selectedDeviceId, onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99]" onClick={onClose}>
      <div className="relative bg-background p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-background/70 hover:bg-background/90" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Leitor de QR Code</h2>
          <p className="text-sm text-muted-foreground">Aponte para o código QR para escanear.</p>
        </div>

        <div className="overflow-hidden rounded-lg w-full aspect-square bg-slate-900 flex items-center justify-center">
          {error ? (
            <div className="text-center text-red-400 p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-4 border-white/50 rounded-lg pointer-events-none" />
            </div>
          )}
        </div>

        {devices.length > 1 && (
          <div className="mt-4 flex justify-center">
             <select 
                value={selectedDeviceId} 
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-gray-800 text-white p-2 rounded-md"
              >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Câmera ${device.deviceId}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCodeScanner;
