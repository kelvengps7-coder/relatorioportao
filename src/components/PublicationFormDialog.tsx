import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Publication, PUBLICATION_CATEGORIES } from "@/types";
import { Upload, X, Image } from "lucide-react";

interface PublicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication?: Publication | null;
  onSuccess: () => void;
}


export const PublicationFormDialog = ({ 
  open, 
  onOpenChange, 
  publication, 
  onSuccess 
}: PublicationFormDialogProps) => {
  const { canSave, isVisualizador } = useAuth();
  
  // Bloquear completamente para visualizadores
  if (isVisualizador) {
    return null;
  }
  const [formData, setFormData] = useState({
    code: publication?.code || "",
    name: publication?.name || "",
    category: publication?.category || "",
    current_stock: publication?.current_stock || 0,
    image_url: publication?.image_url || ""
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { logAction, showSuccessMessage, showErrorMessage } = useAuditLog();

  // Atualizar formData quando publication mudar
  useEffect(() => {
    if (publication) {
      setFormData({
        code: publication.code || "",
        name: publication.name || "",
        category: publication.category || "",
        current_stock: publication.current_stock || 0,
        image_url: publication.image_url || ""
      });
      setImagePreview(publication.image_url || null);
    } else {
      setFormData({
        code: "",
        name: "",
        category: "",
        current_stock: 0,
        image_url: ""
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [publication]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive"
        });
        return;
      }

      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `publication-cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('publication-covers')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('publication-covers')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload da nova imagem se houver
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast({
            title: "Aviso",
            description: "Erro ao fazer upload da imagem. Publicação será salva sem a capa.",
            variant: "destructive"
          });
        }
      }

      if (publication) {
        // Editar publicação existente
        const { error } = await supabase
          .from('publications')
          .update({
            code: formData.code,
            name: formData.name,
            category: formData.category,
            current_stock: formData.current_stock,
            image_url: imageUrl
          })
          .eq('id', publication.id);

        if (error) throw error;

        await logAction('update', 'publications', publication.id, publication, { ...formData, image_url: imageUrl });
        showSuccessMessage('update', 'Publicação');
      } else {
        // Criar nova publicação
        const { error } = await supabase
          .from('publications')
          .insert({
            code: formData.code,
            name: formData.name,
            category: formData.category,
            current_stock: formData.current_stock,
            total_entries: formData.current_stock,
            total_exits: 0,
            image_url: imageUrl
          });

        if (error) throw error;

        await logAction('create', 'publications', null, null, { ...formData, image_url: imageUrl });
        showSuccessMessage('create', 'Publicação');
      }

      onSuccess();
      onOpenChange(false);
      setFormData({ code: "", name: "", category: "", current_stock: 0, image_url: "" });
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Erro ao salvar publicação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar publicação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {publication ? "Editar Publicação" : "Nova Publicação"}
          </DialogTitle>
          <DialogDescription>
            {publication 
              ? "Faça as alterações necessárias nos dados da publicação." 
              : "Preencha os dados da nova publicação."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Descrição *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da publicação"
            />
          </div>
          
          <div>
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Código da publicação (opcional)"
              className="font-mono"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {PUBLICATION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Capa da Publicação</Label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview da capa" 
                    className="w-24 h-32 object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  {imagePreview ? <Image className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {imagePreview ? "Trocar Imagem" : "Selecionar Imagem"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="stock">Estoque Inicial</Label>
            <Input
              id="stock"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
            <Button onClick={handleSubmit} disabled={loading || !canSave}>
              {loading ? "Salvando..." : publication ? "Atualizar" : "Criar"} Publicação
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};