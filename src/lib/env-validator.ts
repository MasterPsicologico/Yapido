'use client';

interface EnvValidationResult {
  isValid: boolean;
  missingKeys: string[];
  warningKeys: string[];
}

const VALID_API_KEY_PREFIXES = {
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': 'AIzaSy',
  'NEXT_PUBLIC_MAPBOX_TOKEN': 'pk.',
  'GEMINI_API_KEY': 'AIzaSy',
};

function isValidKey(key: string, value: string | undefined): boolean {
  if (!value || value.trim() === '') return false;
  
  if (value.includes('YOUR_') || value.includes('placeholder')) return false;
  
  if (value.length < 5) return false;
  
  const expectedPrefix = VALID_API_KEY_PREFIXES[key as keyof typeof VALID_API_KEY_PREFIXES];
  if (expectedPrefix && !value.startsWith(expectedPrefix)) {
    return false;
  }
  
  return true;
}

export function validateEnvironment(): EnvValidationResult {
  const missingKeys: string[] = [];
  const warningKeys: string[] = [];
  
  const privateKeys = ['GEMINI_API_KEY'];
  const publicKeys = ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'NEXT_PUBLIC_MAPBOX_TOKEN'];
  
  privateKeys.forEach(key => {
    const value = process.env[key];
    if (!isValidKey(key, value)) {
      missingKeys.push(key);
    }
  });
  
  publicKeys.forEach(key => {
    const value = process.env[key];
    if (!isValidKey(key, value)) {
      warningKeys.push(key);
    }
  });

  const isValid = missingKeys.length === 0 && warningKeys.length === 0;
  
  return {
    isValid,
    missingKeys,
    warningKeys
  };
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getApiWarningMessage(validation: EnvValidationResult): string | null {
  if (validation.isValid) return null;
  
  if (validation.missingKeys.length > 0) {
    return `Faltan configurar: ${validation.missingKeys.join(', ')}`;
  }
  
  if (validation.warningKeys.length > 0) {
    return null;
  }
  
  return null;
}