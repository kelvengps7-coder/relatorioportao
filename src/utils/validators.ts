import { VALIDATION, APP_CONFIG } from './constants';

// Validação de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de senha
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < VALIDATION.minPasswordLength) {
    return {
      valid: false,
      message: `A senha deve ter pelo menos ${VALIDATION.minPasswordLength} caracteres`
    };
  }
  
  return { valid: true };
};

// Validação de arquivo de imagem
export const isValidImageFile = (file: File): { valid: boolean; message?: string } => {
  // Verificar tipo
  if (!APP_CONFIG.supportedImageTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'Formato de arquivo não suportado. Use JPG, PNG, GIF ou WebP.'
    };
  }
  
  // Verificar tamanho
  if (file.size > APP_CONFIG.maxFileSize) {
    return {
      valid: false,
      message: `O arquivo deve ter no máximo ${APP_CONFIG.maxFileSize / (1024 * 1024)}MB.`
    };
  }
  
  return { valid: true };
};

// Validação de código de publicação
export const isValidPublicationCode = (code: string): boolean => {
  if (!code.trim()) return true; // Código é opcional
  
  const codeRegex = /^[A-Za-z0-9\-_]{1,20}$/;
  return codeRegex.test(code);
};

// Validação de quantidade/estoque
export const isValidQuantity = (quantity: string | number): boolean => {
  const num = typeof quantity === 'string' ? parseInt(quantity) : quantity;
  return !isNaN(num) && num >= 0;
};

// Validação de texto obrigatório
export const isValidRequiredText = (text: string, maxLength?: number): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (maxLength && trimmed.length > maxLength) return false;
  return true;
};