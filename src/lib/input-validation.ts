export const MAX_STRING_LENGTH = 500;
export const MAX_PRICE = 10000000;
export const MIN_PRICE = 0;
export const MAX_PHONE_LENGTH = 20;
export const MAX_ADDRESS_LENGTH = 200;

export function sanitizeString(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, MAX_STRING_LENGTH);
}

export function sanitizeEmail(email: string | undefined | null): string {
  if (!email || typeof email !== 'string') return '';
  
  const sanitized = email.trim().toLowerCase().substring(0, MAX_STRING_LENGTH);
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

export function sanitizePhone(phone: string | undefined | null): string {
  if (!phone || typeof phone !== 'string') return '';
  
  const sanitized = phone.replace(/[^\d+]/g, '').substring(0, MAX_PHONE_LENGTH);
  
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(sanitized) ? sanitized : '';
}

export function sanitizeAddress(address: string | undefined | null): string {
  if (!address || typeof address !== 'string') return '';
  
  return address
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, MAX_ADDRESS_LENGTH);
}

export function sanitizePrice(price: number | undefined | null): number {
  if (typeof price !== 'number' || isNaN(price)) return 0;
  
  return Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.round(price)));
}

export function sanitizeLatLng(lat: number, lng: number): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (isNaN(lat) || isNaN(lng)) return null;
  
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  
  return { lat: Math.round(lat * 1000000) / 1000000, lng: Math.round(lng * 1000000) / 1000000 };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOrderInput(data: {
  customerId?: string;
  storeId?: string;
  totalPrice?: number;
  address?: string;
  customerPhone?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (!data.customerId || data.customerId.length < 1) {
    errors.push('Customer ID es requerido');
  }
  
  if (!data.storeId || data.storeId.length < 1) {
    errors.push('Store ID es requerido');
  }
  
  const price = sanitizePrice(data.totalPrice);
  if (price < MIN_PRICE || price > MAX_PRICE) {
    errors.push(`Precio debe estar entre ${MIN_PRICE} y ${MAX_PRICE}`);
  }
  
  if (data.address && data.address.length > MAX_ADDRESS_LENGTH) {
    errors.push('Dirección muy larga');
  }
  
  if (data.customerPhone) {
    const phone = sanitizePhone(data.customerPhone);
    if (!phone) {
      errors.push('Teléfono inválido');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateProductInput(data: {
  name?: string;
  price?: number;
  description?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  const name = sanitizeString(data.name);
  if (!name || name.length < 2) {
    errors.push('Nombre debe tener al menos 2 caracteres');
  }
  if (name.length > MAX_STRING_LENGTH) {
    errors.push('Nombre muy largo');
  }
  
  const price = sanitizePrice(data.price);
  if (price < MIN_PRICE || price > MAX_PRICE) {
    errors.push(`Precio debe estar entre ${MIN_PRICE} y ${MAX_PRICE}`);
  }
  
  if (data.description) {
    const desc = sanitizeString(data.description);
    if (desc.length > MAX_STRING_LENGTH * 2) {
      errors.push('Descripción muy larga');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateUserProfileInput(data: {
  displayName?: string;
  email?: string;
  phone?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (data.displayName) {
    const name = sanitizeString(data.displayName);
    if (name.length > 0 && name.length < 2) {
      errors.push('Nombre muy corto');
    }
  }
  
  if (data.email) {
    const email = sanitizeEmail(data.email);
    if (!email) {
      errors.push('Email inválido');
    }
  }
  
  if (data.phone) {
    const phone = sanitizePhone(data.phone);
    if (!phone) {
      errors.push('Teléfono inválido');
    }
  }
  
  return { valid: errors.length === 0, errors };
}