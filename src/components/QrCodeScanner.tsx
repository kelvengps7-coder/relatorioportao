
import React, { useRef, useEffect } from "react";
import jsQR from "jsqr";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  // Função para parar a câmera e o loop de escaneamento
  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  // Loop de escaneamento que roda a cada frame
  const tick = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        // Se um QR code for encontrado, vibra, para a câmera e chama onScan.
        if (code) {
          // Adiciona feedback tátil para o usuário
          if (navigator.vibrate) {
            navigator.vibrate(150);
          }
          stopScan();
          onScan(code.data);
          return;
        }
      }
    }
    // Se nenhum QR code for encontrado, continua o loop.
    animationFrameId.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    // Função para iniciar a câmera
    const startScan = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        toast({
          title: "Erro de Câmera",
          description: "Não foi possível acessar a câmera. Verifique as permissões do seu navegador.",
          variant: "destructive",
        });
        onClose(); // Fecha se houver erro
      }
    };

    startScan();

    // Função de limpeza: garante que a câmera seja desligada ao desmontar o componente
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start md:items-center pt-12 md:pt-0 bg-white/70 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-[90vw] max-w-sm rounded-xl shadow-2xl border border-gray-200 bg-white overflow-hidden animate-in zoom-in-95">
        {/* Camada de Vídeo */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
        />

        {/* Moldura de Leitura Animada */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-[75%] h-[75%] border-4 border-green-500 rounded-lg shadow-inner-strong" />
        </div>
        
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 bg-white/80 rounded-full p-1.5 shadow-md hover:bg-white transition-all"
          aria-label="Fechar leitor de QR code"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default QrCodeScanner;
