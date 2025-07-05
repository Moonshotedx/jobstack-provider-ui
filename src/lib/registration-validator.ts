// Registration number validation utilities
export interface RegistrationValidation {
  type: 'GST' | 'PAN' | 'CIN' | 'TAN' | 'unknown';
  isValid: boolean;
  description: string;
  example: string;
}

// Regex patterns for different registration types
const REGISTRATION_PATTERNS = {
  GST: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    description: 'Valid GST number format',
    example: '07AAACN2082N1Z5',
    length: 15
  },
  PAN: {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    description: 'Valid PAN number format',
    example: 'AAACN2082N',
    length: 10
  },
  CIN: {
    pattern: /^[LUF][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    description: 'Valid CIN number format',
    example: 'L17110DL1995PTC069348',
    length: 21
  },
  TAN: {
    pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
    description: 'Valid TAN number format',
    example: 'DELC08025B',
    length: 10
  }
};

/**
 * Validates a registration number and returns its type and validity
 */
export const validateRegistrationNumber = (value: string): RegistrationValidation => {
  if (!value || value.trim() === '') {
    return {
      type: 'unknown',
      isValid: false,
      description: 'Enter GST, CIN, TAN, PAN or other registration number',
      example: 'e.g., GST: 07AAACN2082N1Z5'
    };
  }

  const cleanValue = value.trim().toUpperCase();

  // Check each pattern
  for (const [type, config] of Object.entries(REGISTRATION_PATTERNS)) {
    if (cleanValue.length === config.length && config.pattern.test(cleanValue)) {
      return {
        type: type as keyof typeof REGISTRATION_PATTERNS,
        isValid: true,
        description: `${config.description} (${type})`,
        example: config.example
      };
    }
  }

  // If no pattern matches, return unknown format
  return {
    type: 'unknown',
    isValid: false,
    description: 'Unknown format - Enter valid GST/CIN/TAN/PAN number',
    example: 'GST: 07AAACN2082N1Z5, PAN: AAACN2082N, CIN: L17110DL1995PTC069348, TAN: DELC08025B'
  };
};

/**
 * Get all supported registration formats for display
 */
export const getSupportedFormats = () => {
  return Object.entries(REGISTRATION_PATTERNS).map(([type, config]) => ({
    type,
    description: config.description,
    example: config.example,
    length: config.length
  }));
};

/**
 * Format registration number display with proper spacing/grouping
 */
export const formatRegistrationNumber = (value: string, type: RegistrationValidation['type']): string => {
  if (!value) return value;
  
  const cleanValue = value.trim().toUpperCase();
  
  switch (type) {
    case 'GST':
      // Format: 07AAACN2082N1Z5 -> 07-AAACN-2082-N1Z5
      if (cleanValue.length >= 15) {
        return `${cleanValue.substr(0, 2)}-${cleanValue.substr(2, 5)}-${cleanValue.substr(7, 4)}-${cleanValue.substr(11, 4)}`;
      }
      break;
    case 'PAN':
      // Format: AAACN2082N -> AAACN-2082-N
      if (cleanValue.length >= 10) {
        return `${cleanValue.substr(0, 5)}-${cleanValue.substr(5, 4)}-${cleanValue.substr(9, 1)}`;
      }
      break;
    case 'CIN':
      // Format: L17110DL1995PTC069348 -> L-17110-DL-1995-PTC-069348
      if (cleanValue.length >= 21) {
        return `${cleanValue.substr(0, 1)}-${cleanValue.substr(1, 5)}-${cleanValue.substr(6, 2)}-${cleanValue.substr(8, 4)}-${cleanValue.substr(12, 3)}-${cleanValue.substr(15, 6)}`;
      }
      break;
    case 'TAN':
      // Format: DELC08025B -> DELC-08025-B
      if (cleanValue.length >= 10) {
        return `${cleanValue.substr(0, 4)}-${cleanValue.substr(4, 5)}-${cleanValue.substr(9, 1)}`;
      }
      break;
  }
  
  return cleanValue;
}; 