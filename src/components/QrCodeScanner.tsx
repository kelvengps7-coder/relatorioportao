import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, CameraOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const getQrboxSize = () => {
  const smallerEdge = Math.min(window.innerWidth, window.innerHeight);
  return Math.floor(smallerEdge * 0.75); // Use 75% for a larger scanning area
};

// Definitive test implementation of the QR Code Scanner
const QrCodeScanner = ({ onScan, onClose }: QrCodeScannerProps) => {
  const readerId = "qr-code-reader-element";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const [status, setStatus] = useState("Iniciando...");
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Ensure this effect runs only once to prevent re-renders from causing issues
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
    }

    const scanner = scannerRef.current;

    // Minimal and highly compatible configuration
    const config = { 
        fps: 10,
        qrbox: getQrboxSize,
    };

    const successCallback = (decodedText: string) => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
      toast({ title: "Sucesso!", description: "QR Code lido. Processando..." });
      onScan(decodedText);
    };

    const startScanner = async () => {
      // Always ensure cleanup happens before a new start attempt
      if (scanner.isScanning) {
        await scanner.stop();
      }
      
      // --- TEST 1: Attempt to start the rear camera directly ---
      setStatus("Procurando câmera traseira...");
      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          successCallback,
          () => {} // Ignore per-frame scan failures
        );
        setStatus("Leitor Ativo");
        return; // Success, exit the function
      } catch (error) {
        console.warn("Falha ao iniciar câmera traseira (environment):", error);
        
        // --- TEST 2: Fallback to ANY available camera if the rear fails ---
        setStatus("Câmera traseira não encontrada. Tentando qualquer câmera disponível...");
        try {
          // This is the most basic request, asking for any camera without specifying which one.
          await scanner.start(
            {}, // An empty constraint object asks for any camera
            config,
            successCallback,
            () => {}
          );
          setStatus("Leitor Ativo");
        } catch (finalError) {
          console.error("ERRO CRÍTICO: Nenhuma câmera funcional encontrada.", finalError);
          setStatus("Falha ao acessar a câmera. Verifique as permissões.");
          setPermissionError(true);
          toast({
              title: "Erro de Câmera",
              description: "Não foi possível iniciar nenhuma câmera. Por favor, verifique as permissões do seu navegador.",
              variant: "destructive"
          });
        }
      }
    };

    startScanner();

    // Cleanup function on component unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []); // Empty dependency array ensures this runs only ONCE

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
            Aponte a câmera para o código QR.
          </p>
        </div>
        
        <div className="overflow-hidden rounded-lg w-full aspect-square bg-slate-900 flex items-center justify-center">
          {permissionError ? (
            <div className="text-center text-red-400 p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">{status}</p>
              <p className="text-xs text-muted-foreground mt-1">Por favor, libere o acesso nas configurações do seu navegador e recarregue a página.</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <div id={readerId} className="w-full h-full" />
              <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs text-center p-2 rounded-md">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Status: {status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCodeScanner;
