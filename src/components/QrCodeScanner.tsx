import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { CameraOff, Loader2 } from 'lucide-react';

interface QrCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

const QrCodeScanner = ({ onScanSuccess }: QrCodeScannerProps) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<Html5QrcodeScanner | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (scannerRef.current && !scannerInstance.current) {
      const scanner = new Html5QrcodeScanner(
        scannerRef.current.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          videoConstraints: {
            facingMode: "environment"
          }
        },
        false // verbose
      );

      const handleScanSuccess = (decodedText: string) => {
        if (scannerInstance.current) {
          scannerInstance.current.clear().catch(err => console.error("Error clearing scanner on success:", err));
          scannerInstance.current = null;
        }
        const code = decodedText.split('#').pop() || '';
        onScanSuccess(code);
      };

      const handleScanFailure = (error: string) => {
        // Este callback é chamado em cada frame sem um QR code,
        // então devemos filtrar apenas por erros críticos de permissão.
        const lowerCaseError = error.toLowerCase();
        if (
          lowerCaseError.includes('permission') ||
          lowerCaseError.includes('notallowederror') ||
          lowerCaseError.includes('notfounderror')
        ) {
          setPermissionError("Acesso à câmera negado. Por favor, verifique as permissões do seu navegador para este site.");
          setIsLoading(false);
          if (scannerInstance.current) {
             scannerInstance.current.clear().catch(err => console.error("Error clearing scanner on failure:", err));
             scannerInstance.current = null;
          }
        }
        // Outros erros (como "QR code not found") são ignorados.
      };

      scannerInstance.current = scanner;
      
      try {
        // O método render não retorna uma promessa. Ele é chamado para iniciar o processo.
        scanner.render(handleScanSuccess, handleScanFailure);
        // Se a renderização for chamada sem lançar um erro, podemos assumir que a UI está sendo inicializada.
        setIsLoading(false);
      } catch (err: any) {
        setPermissionError("Falha ao iniciar o leitor de QR code. Verifique se a câmera está funcionando.");
        setIsLoading(false);
        console.error("Erro fatal ao renderizar o scanner:", err);
      }
    }

    // Função de limpeza
    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.clear().catch(error => {
          if (!error.message.includes("not found")) {
            console.error("Falha ao limpar o scanner no cleanup.", error);
          }
        });
        scannerInstance.current = null;
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center bg-muted/30 min-h-[300px] flex items-center justify-center">
      {permissionError ? (
        <div className="flex flex-col items-center justify-center text-destructive">
          <CameraOff className="h-12 w-12 mb-4" />
          <p className="font-semibold">Erro de Acesso</p>
          <p className="text-sm text-center mt-2">{permissionError}</p>
        </div>
      ) : (
        <div className="w-full">
          {isLoading && (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p>Iniciando câmera...</p>
            </div>
          )}
          <div id="reader" ref={scannerRef} className={isLoading ? 'hidden' : ''} />
        </div>
      )}
    </div>
  );
};

export default QrCodeScanner;
