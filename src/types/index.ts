// Central type definitions for the application

export type UserRole = 'admin' | 'servo de balcao' | 'visualizador';

export interface Publication {
  id: string;
  code: string;
  name: string;
  current_stock: number;
  category: string;
  total_entries: number;
  total_exits: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: string;
  publication_id: string;
  type: string;
  quantity: number;
  motivo?: string;
  created_at: string;
  publications?: Publication;
}

export interface Pedido {
  id: string;
  irmao: string;
  publicacao_id: string;
  quantidade: number;
  data_pedido: string;
  enviado: boolean;
  entregue: boolean;
  created_at: string;
  updated_at: string;
  publications?: Publication;
}

export interface PublicationFormData {
  code: string;
  name: string;
  category: string;
  current_stock: number;
  image_url?: string;
}

export const PUBLICATION_CATEGORIES = [
  'Bíblias',
  'Brochuras e Livretos',
  'CARTAZ',
  'Formulários',
  'Kit de Ferramentas de Ensino',
  'Livros',
  'Revistas — Despertai!',
  'Revistas — Sentinela'
] as const;

export type PublicationCategory = typeof PUBLICATION_CATEGORIES[number];