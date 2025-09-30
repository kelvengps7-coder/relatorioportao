
import React, { useRef, useEffect } from "react";
import jsQR from "jsqr";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { X, Upload } from "lucide-react";

interface QrCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
            image.src = e.target.result;
        }
    }
    reader.readAsDataURL(file);

    image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          onScan(code.data);
        } else {
          toast({
            title: "QR Code não encontrado",
            description: "Nenhum QR Code foi detectado na imagem.",
            variant: "destructive",
          });
        }
    }
  };

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
          onScan(code.data);
          return; 
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
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
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        toast({
          title: "Erro de Câmera",
          description: "Não foi possível acessar a câmera. Verifique as permissões do seu navegador.",
          variant: "destructive",
        });
        onClose();
      }
    };

    startScan();

    return () => {
      stopScan();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative w-full max-w-md p-4 space-y-4">
        <div className="aspect-square bg-black rounded-lg overflow-hidden relative shadow-2xl border-2 border-neutral-700">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
          />
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-white/50 rounded-lg animate-pulse" />
          </div>
        </div>
        
        <div className="text-center text-white">
          <p className="font-semibold text-lg">Aponte a câmera para o QR Code</p>
          <p className="text-sm text-neutral-300">A leitura será feita automaticamente.</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2"/>
            Fazer upload de uma imagem
          </Button>
          <Input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white rounded-full bg-black/50 hover:bg-black/70"
      >
        <X className="h-6 w-6" />
      </Button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default QrCodeScanner;
