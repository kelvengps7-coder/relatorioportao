// Configurações globais da aplicação
export const APP_CONFIG = {
  name: 'Publicações Portão',
  version: '1.0.0',
  description: 'Sistema de gerenciamento de estoque e publicações da Congregação Portão',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  itemsPerPage: 50,
  maxSearchResults: 100,
  debounceDelay: 300,
};

// URLs e endpoints
export const ENDPOINTS = {
  supabaseUrl: 'https://styflprrqdnlicnpckjd.supabase.co',
  storageUrl: 'https://styflprrqdnlicnpckjd.supabase.co/storage/v1/object/public',
};

// Mensagens padrão
export const MESSAGES = {
  success: {
    create: 'Item criado com sucesso!',
    update: 'Item atualizado com sucesso!',
    delete: 'Item excluído com sucesso!',
    upload: 'Upload realizado com sucesso!',
  },
  error: {
    generic: 'Ocorreu um erro inesperado. Tente novamente.',
    network: 'Erro de conexão. Verifique sua internet.',
    validation: 'Por favor, verifique os dados inseridos.',
    permission: 'Você não tem permissão para esta ação.',
    notFound: 'Item não encontrado.',
  },
  loading: {
    default: 'Carregando...',
    saving: 'Salvando...',
    uploading: 'Enviando...',
    deleting: 'Excluindo...',
  }
};

// Formatação e validação
export const FORMATS = {
  date: {
    display: 'dd/MM/yyyy',
    displayWithTime: 'dd/MM/yyyy HH:mm',
    iso: 'yyyy-MM-dd',
  },
  currency: 'pt-BR',
  number: 'pt-BR',
};

// Configurações de validação
export const VALIDATION = {
  minPasswordLength: 6,
  maxNameLength: 100,
  maxDescriptionLength: 500,
  maxCodeLength: 20,
};