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
import { Upload, X, Image, Link } from "lucide-react";

interface PublicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publication?: Publication | null;
  onSuccess: () => void;
}

const isValidUrl = (urlString: string): boolean => {
  if (!urlString) return true; // Allow empty URL
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
};

export const PublicationFormDialog = ({ 
  open, 
  onOpenChange, 
  publication, 
  onSuccess 
}: PublicationFormDialogProps) => {
  const { canSave, isVisualizador } = useAuth();
  
  if (isVisualizador) {
    return null;
  }

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    current_stock: 0,
    image_url: "",
    urlDoFabricante: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { logAction, showSuccessMessage } = useAuditLog();

  useEffect(() => {
    if (publication) {
      setFormData({
        code: publication.code || "",
        name: publication.name || "",
        category: publication.category || "",
        current_stock: publication.current_stock || 0,
        image_url: publication.image_url || "",
        urlDoFabricante: publication.urlDoFabricante || ""
      });
      setImagePreview(publication.image_url || null);
    } else {
      setFormData({
        code: "",
        name: "",
        category: "",
        current_stock: 0,
        image_url: "",
        urlDoFabricante: ""
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [publication, open]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Erro", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
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
      const { error: uploadError } = await supabase.storage.from('publication-covers').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('publication-covers').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.category) {
      toast({ title: "Erro", description: "Por favor, preencha os campos obrigatórios (Descrição e Categoria).", variant: "destructive" });
      return;
    }
    if (!isValidUrl(formData.urlDoFabricante)) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL do fabricante válida ou deixe o campo em branco.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile) || imageUrl;
      }

      const publicationData = { ...formData, image_url: imageUrl };

      if (publication) {
        // Editar publicação existente
        const { error } = await supabase.from('publications').update(publicationData).eq('id', publication.id);
        if (error) throw error;
        await logAction('update', 'publications', publication.id, publication, publicationData);
        showSuccessMessage('update', 'Publicação');
      } else {
        // Criar nova publicação - CORRIGIDO
        const { error } = await supabase.from('publications').insert({
          code: publicationData.code,
          name: publicationData.name,
          category: publicationData.category,
          current_stock: publicationData.current_stock,
          image_url: publicationData.image_url,
          urlDoFabricante: publicationData.urlDoFabricante, // Garantir que a URL seja salva
          total_entries: publicationData.current_stock,
          total_exits: 0,
        });
        if (error) throw error;
        await logAction('create', 'publications', null, null, publicationData);
        showSuccessMessage('create', 'Publicação');
      }

      onSuccess();
      onOpenChange(false);
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
          <DialogTitle>{publication ? "Editar Publicação" : "Nova Publicação"}</DialogTitle>
          <DialogDescription>{publication ? "Faça as alterações necessárias." : "Preencha os dados da nova publicação."}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">Descrição *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome da publicação" />
          </div>
          
          <div>
            <Label htmlFor="code">Código</Label>
            <Input id="code" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="Código interno (opcional)" className="font-mono" />
          </div>

          <div>
            <Label htmlFor="urlDoFabricante">URL do Fabricante (QR Code)</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="urlDoFabricante" value={formData.urlDoFabricante} onChange={(e) => setFormData(prev => ({ ...prev, urlDoFabricante: e.target.value }))} placeholder="https://... (opcional)" className="pl-10" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent>
                {PUBLICATION_CATEGORIES.map((category) => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Capa da Publicação</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-20 h-28 object-cover rounded-md border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}><X className="h-4 w-4" /></Button>
                </div>
              ) : null}
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-2"><Upload className="h-4 w-4" />{imagePreview ? "Trocar Imagem" : "Selecionar Imagem"}</Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tamanho máximo: 5MB.</p>
          </div>
          
          <div>
            <Label htmlFor="stock">Estoque Inicial</Label>
            <Input id="stock" type="number" value={formData.current_stock} onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))} min="0" />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !canSave}>{loading ? "Salvando..." : publication ? "Atualizar" : "Criar"} Publicação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
