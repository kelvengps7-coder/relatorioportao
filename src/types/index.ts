export interface Publication {
  id: number;
  code: string;
  name: string;
  category: string;
  current_stock: number;
  image_url?: string;
  urlDoFabricante?: string; // Campo único para a URL do QR Code
}

export interface StockMovement {
  id: number;
  publication_id: number;
  type: 'entrada' | 'saida';
  quantity: number;
  responsible: string;
  created_at: string;
  publications: {
    name: string;
    code: string;
  };
}

export interface Pedido {
  id: number;
  publicacao_id: number;
  quantidade: number;
  solicitante: string;
  created_at: string;
  retirado_por?: string;
  retirado_em?: string;
  publicacoes: {
    name: "string";
    code: "string";
    current_stock: "number";
  }
}
