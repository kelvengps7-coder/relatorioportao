import { FORMATS } from './constants';

// Formatação de data
export const formatDate = (date: string | Date, includeTime = false): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Data inválida';
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('pt-BR', options);
};

// Formatação de números
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Formatação de texto para slug
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Capitalizar primeira letra
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Truncar texto
export const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// Formatação de bytes
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};