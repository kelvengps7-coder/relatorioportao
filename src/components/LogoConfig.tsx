import { useState, useRef, useEffect } from "react";
import { Upload, RotateCcw, Eye, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { OptimizedImage } from "./OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LogoConfigProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_LOGO = (
  <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" fill="#8DB0D9"/>
    <path d="M12 8h24v8h-2v4h2v20H12V20h2v-4h-2V8zm4 4v4h4V12h-4zm8 0v4h4V12h-4zm8 0v4h4V12h-4zm-16 8v16h16V20H16z" fill="white"/>
  </svg>
);

export const LogoConfig = ({ isOpen, onOpenChange }: LogoConfigProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Buscar logo atual do Supabase
  useEffect(() => {
    const fetchCurrentLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('system_logo_url')
          .eq('role', 'admin')
          .not('system_logo_url', 'is', null)
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar logo:', error);
          setCurrentLogo(null);
        } else if (data && data.system_logo_url) {
          console.log('Logo atual encontrado:', data.system_logo_url);
          setCurrentLogo(data.system_logo_url);
        } else {
          console.log('Nenhum logo personalizado encontrado');
          setCurrentLogo(null);
        }
      } catch (error) {
        console.error('Erro ao buscar logo:', error);
        setCurrentLogo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentLogo();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Apenas arquivos PNG, JPG ou SVG são permitidos.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro", 
        description: "O arquivo deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `system-logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('system-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('system-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload do logo:', error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !isAdmin) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadLogo(selectedFile);
      
      if (uploadedUrl) {
        // Atualizar perfil admin com novo logo
        const { error } = await supabase
          .from('profiles')
          .update({ system_logo_url: uploadedUrl })
          .eq('user_id', user.id);

        if (error) throw error;

        setCurrentLogo(uploadedUrl);
        clearSelection();
        
        toast({
          title: "Sucesso",
          description: "Logo atualizado com sucesso!",
        });
      } else {
        throw new Error('Falha no upload da imagem');
      }
    } catch (error: any) {
      console.error('Erro ao salvar logo:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar o logo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreDefault = async () => {
    if (!user || !isAdmin) return;

    try {
      // Remove logo do perfil admin
      const { error } = await supabase
        .from('profiles')
        .update({ system_logo_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentLogo(null);
      clearSelection();
      
      toast({
        title: "Sucesso",
        description: "Logo padrão restaurado!",
      });
    } catch (error: any) {
      console.error('Erro ao restaurar logo:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao restaurar logo padrão.",
        variant: "destructive",
      });
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Configuração do Logo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isAdmin && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <p className="text-sm text-yellow-800">
                  Apenas administradores podem alterar o logo do sistema.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Logo Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo Atual</CardTitle>
              <CardDescription>
                Este é o logo que aparece no cabeçalho do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-4 bg-muted/30">
                  <div className="w-12 h-12 bg-muted animate-pulse rounded"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 bg-muted/30">
                  <div className="w-12 h-12 overflow-hidden">
                    {currentLogo ? (
                      <OptimizedImage 
                        src={currentLogo} 
                        alt="Logo atual" 
                        className="w-full h-full object-cover"
                        objectFit="cover"
                      />
                    ) : (
                      <div className="bg-[#8DB0D9] w-full h-full">
                        {DEFAULT_LOGO}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {currentLogo && (
                <div className="mt-3 flex justify-center">
                  <Badge variant="outline" className="text-xs">
                    Logo personalizado ativo
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Upload de Novo Logo */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alterar Logo</CardTitle>
                <CardDescription>
                  Faça upload de um novo logo em PNG, JPG ou SVG (máximo 2MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher Arquivo
                  </Button>
                  {selectedFile && (
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

              {selectedFile && (
                <>
                  <div className="text-sm text-muted-foreground">
                    <strong>Arquivo selecionado:</strong> {selectedFile.name}
                  </div>
                  
                  {/* Preview */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Pré-visualização
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center p-4">
                        <div className="w-12 h-12 overflow-hidden">
                          {previewUrl && (
                            <OptimizedImage
                              src={previewUrl}
                              alt="Preview do logo"
                              className="w-full h-full object-cover"
                              objectFit="cover"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handleUpload}
                    disabled={isUploading || loading}
                    className="w-full"
                  >
                    {isUploading ? "Salvando..." : "Aplicar Logo"}
                  </Button>
                </>
              )}
              </CardContent>
            </Card>
          )}

          {/* Restaurar Padrão */}
          {currentLogo && isAdmin && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Restaurar Logo Padrão</CardTitle>
                  <CardDescription>
                    Voltar ao logo original do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    onClick={handleRestoreDefault}
                    className="w-full"
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Logo Padrão
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};