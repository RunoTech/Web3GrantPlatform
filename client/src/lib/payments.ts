/**
 * Payment utilities for Virtual POS system
 * Handles BIN checking, Luhn validation, and card brand detection
 */

export interface CardBrand {
  name: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  cvvLength: 3 | 4;
  cardLengths: number[];
  logo?: string;
  color: string;
}

export interface CardValidation {
  isValid: boolean;
  brand: CardBrand;
  errors: string[];
}

/**
 * Luhn algorithm implementation for credit card validation
 */
export function luhnCheck(cardNumber: string): boolean {
  // Remove all non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 12 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  // Process digits from right to left
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card brand based on BIN (Bank Identification Number)
 */
export function detectBrand(cardNumber: string): CardBrand {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const prefix = cleanNumber.substring(0, 6); // First 6 digits for BIN
  const prefixInt = parseInt(prefix, 10);

  // Visa: starts with 4
  if (/^4/.test(cleanNumber)) {
    return {
      name: 'visa',
      cvvLength: 3,
      cardLengths: [13, 16, 17, 18, 19],
      color: '#1A1F71',
    };
  }

  // Mastercard: 5100-5599, 2221-2720
  if (/^5[1-5]/.test(cleanNumber) || (prefixInt >= 222100 && prefixInt <= 272099)) {
    return {
      name: 'mastercard',
      cvvLength: 3,
      cardLengths: [16],
      color: '#EB001B',
    };
  }

  // American Express: 34, 37
  if (/^3[47]/.test(cleanNumber)) {
    return {
      name: 'amex',
      cvvLength: 4,
      cardLengths: [15],
      color: '#006FCF',
    };
  }

  // Discover: 6011, 622126-622925, 644-649, 65
  if (/^6011/.test(cleanNumber) || 
      (prefixInt >= 622126 && prefixInt <= 622925) || 
      /^64[4-9]/.test(cleanNumber) || 
      /^65/.test(cleanNumber)) {
    return {
      name: 'discover',
      cvvLength: 3,
      cardLengths: [16, 17, 18, 19],
      color: '#FF6000',
    };
  }

  return {
    name: 'unknown',
    cvvLength: 3,
    cardLengths: [12, 13, 14, 15, 16, 17, 18, 19],
    color: '#6B7280',
  };
}

/**
 * Comprehensive card validation
 */
export function validateCard(cardNumber: string, expiryMonth: string, expiryYear: string, cvv: string): CardValidation {
  const errors: string[] = [];
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const brand = detectBrand(cleanNumber);

  // Card number validation
  if (!cleanNumber || cleanNumber.length < 12 || cleanNumber.length > 19) {
    errors.push('Kart numarası 12-19 haneli olmalıdır');
  } else if (!brand.cardLengths.includes(cleanNumber.length)) {
    errors.push(`${brand.name.toUpperCase()} kartları ${brand.cardLengths.join(' veya ')} haneli olmalıdır`);
  } else if (!luhnCheck(cleanNumber)) {
    errors.push('Geçersiz kart numarası');
  }

  // Expiry validation with NaN handling
  const expMonth = parseInt(expiryMonth, 10);
  const expYear = parseInt(expiryYear, 10);
  
  if (isNaN(expMonth) || isNaN(expYear)) {
    errors.push('Geçersiz son kullanma tarihi');
  } else {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const fullExpYear = expYear < 100 ? 2000 + expYear : expYear;

    if (expMonth < 1 || expMonth > 12) {
      errors.push('Geçersiz ay (01-12)');
    }

    if (fullExpYear < currentYear || (fullExpYear === currentYear && expMonth < currentMonth)) {
      errors.push('Kartın süresi dolmuş');
    }
    
    if (fullExpYear > currentYear + 20) {
      errors.push('Geçersiz yıl');
    }
  }

  // CVV validation
  const cleanCvv = cvv.replace(/\D/g, '');
  if (!cleanCvv || cleanCvv.length !== brand.cvvLength) {
    errors.push(`CVV ${brand.cvvLength} haneli olmalıdır`);
  }

  return {
    isValid: errors.length === 0,
    brand,
    errors,
  };
}

/**
 * Format card number for display (masking)
 */
export function formatCardNumber(cardNumber: string, mask: boolean = false): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (mask && cleanNumber.length > 4) {
    const lastFour = cleanNumber.slice(-4);
    const maskedPart = '•'.repeat(cleanNumber.length - 4);
    return `${maskedPart}${lastFour}`.replace(/(.{4})/g, '$1 ').trim();
  }

  // Format with spaces every 4 digits
  return cleanNumber.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Format expiry date
 */
export function formatExpiryDate(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length >= 2) {
    return `${cleanValue.substring(0, 2)}/${cleanValue.substring(2, 4)}`;
  }
  return cleanValue;
}

/**
 * Get BIN information (first 6-8 digits)
 */
export function getBinInfo(cardNumber: string) {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const bin = cleanNumber.substring(0, 8);
  const brand = detectBrand(cleanNumber);
  
  return {
    bin: bin.substring(0, 6), // First 6 digits as standard BIN
    extendedBin: bin, // First 8 digits for more accurate detection
    brand: brand.name,
    cvvLength: brand.cvvLength,
    last4: cleanNumber.length > 4 ? cleanNumber.slice(-4) : '',
  };
}

/**
 * Test card numbers for different brands (for testing purposes)
 */
export const TEST_CARDS = {
  visa: {
    valid: ['4532015112830366', '4556737586899855', '4716359518345659'],
    invalid: ['4532015112830365'] // Fails Luhn check
  },
  mastercard: {
    valid: ['5555555555554444', '5105105105105100', '2223003122003222'],
    invalid: ['5555555555554443'] // Fails Luhn check
  },
  amex: {
    valid: ['378282246310005', '371449635398431', '340000000000009'],
    invalid: ['378282246310004'] // Fails Luhn check
  },
  discover: {
    valid: ['6011111111111117', '6011000990139424', '6011981111111113'],
    invalid: ['6011111111111116'] // Fails Luhn check
  }
};