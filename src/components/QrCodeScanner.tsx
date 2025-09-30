
import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { X, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const isMobile = useIsMobile();

  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
  };

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

        if (code) {
          stopScan();
          if (navigator.vibrate) navigator.vibrate(120);
          setShowSuccessMessage(true);
          setTimeout(() => onScan(code.data), 1500);
          return;
        }
      }
    }
    
    if (animationFrameId.current !== undefined) {
      animationFrameId.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => {
    const startScan = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(tick);

          if (scannerContainerRef.current && !isMobile) {
            scannerContainerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        toast({
          title: "Erro de Câmera",
          description: "Não foi possível acessar a câmera.",
          variant: "destructive",
        });
        onClose();
      }
    };

    startScan();
    return () => stopScan();
  }, [isMobile, onClose]);

  const containerClasses = isMobile
    ? "absolute top-full left-0 right-0 mt-4 z-50"
    : "fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm animate-in fade-in-0";

  return (
    <div ref={scannerContainerRef} className={containerClasses}>
      <div className="relative w-full max-w-sm rounded-xl bg-transparent overflow-hidden animate-in zoom-in-95">
        {!showSuccessMessage && (
          <>
            <video
              ref={videoRef}
              className="w-full h-auto object-cover rounded-lg"
              playsInline
            />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className="w-[80%] aspect-square rounded-lg relative overflow-hidden">
                {/* Overlay with cutout */}
                <div className="absolute inset-0" style={{ boxShadow: '0 0 0 100vmax rgba(0,0,0,0.5)' }}></div>
                
                {/* Corner Borders */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                
                {/* Scanning Laser */}
                <div className="scanner-laser"></div>
              </div>
              <p className="text-white text-center mt-4 text-lg font-semibold">
                Aponte a câmera para o QR Code
              </p>
            </div>
          </>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 bg-white/80 rounded-full p-1.5 shadow-md hover:bg-white transition-all"
          aria-label="Fechar leitor de QR code"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {showSuccessMessage && (
          <div className="flex flex-col items-center justify-center bg-green-500 text-white w-full py-12 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-xl font-bold">QR Code Lido!</h3>
              <p className="text-sm">Processando...</p>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default QrCodeScanner;
