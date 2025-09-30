
import React, { useState, useRef } from "react";
import jsQR from "jsqr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface QrCodeScannerProps {
  onScan: (result: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const image = new Image();
        image.src = e.target?.result as string;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(image, 0, 0, image.width, image.height);
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setQrResult(code.data);
            onScan(code.data);
            setShowScanner(false);
          } else {
            toast({
              title: "QR Code não encontrado",
              description: "Nenhum QR Code foi detectado na imagem.",
              variant: "destructive",
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    setShowScanner(true);
    setQrResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      toast({
        title: "Erro de Câmera",
        description:
          "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive",
      });
      setShowScanner(false);
    }
  };

  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowScanner(false);
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
          setQrResult(code.data);
          onScan(code.data);
          stopScan();
          return;
        }
      }
    }
    if (showScanner) {
      requestAnimationFrame(tick);
    }
  };

  return (
    <Dialog open={showScanner} onOpenChange={(open) => !open && stopScan()}>
      <DialogTrigger asChild>
        <Button onClick={startScan}>Ler QR Code</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ler QR Code</DialogTitle>
        </DialogHeader>
        {qrResult ? (
          <div>
            <p>QR Code lido com sucesso:</p>
            <p className="font-bold">{qrResult}</p>
          </div>
        ) : (
          <div>
            <video
              ref={videoRef}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="mt-4 text-center">
              <p>Ou faça upload de uma imagem:</p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeScanner;
