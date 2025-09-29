import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, CameraOff } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "qr-code-reader-element";
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Inicializa a instância do scanner apenas uma vez
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false 
      });
    }
    const scanner = scannerRef.current;

    let isScanning = true;
    setPermissionError(false); // Reseta o erro ao tentar abrir

    const startCamera = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (isScanning) {
              isScanning = false; 
              onScan(decodedText);
            }
          },
          () => { /* Ignorar falhas de varredura contínua */ }
        );
      } catch (err) {
        console.error("Falha ao iniciar o leitor de QR code:", err);
        setPermissionError(true); // Ativa o estado de erro de permissão
      }
    };

    startCamera();

    return () => {
      // Garante que a câmera pare quando o componente for desmontado
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().catch(error => {
          console.error("Erro ao parar o leitor de QR code:", error);
        });
      }
    };
  }, [onScan]);

  return (
    // Camada de fundo para fechar ao clicar fora
    <div 
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-[99]"
      onClick={onClose}
    >
      {/* Contêiner do modal */}
      <div 
        className="relative bg-background p-6 rounded-2xl shadow-lg w-full max-w-sm mt-10"
        onClick={(e) => e.stopPropagation()} // Impede que cliques dentro do modal o fechem
      >
        {/* Botão de fechar */}
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
        
        {/* Contêiner da câmera ou do erro */}
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
