import { z } from 'zod';

// E.164 format regex: +[country code][number], 7-15 digits total
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

// Common phone number patterns to clean
const PHONE_CLEAN_REGEX = /[\s\-\(\)\.]/g;

/**
 * Validates if a phone number is in E.164 format
 */
export const isValidE164 = (phone: string): boolean => {
  return E164_REGEX.test(phone);
};

/**
 * Converts a phone number to E.164 format
 * Assumes US/Canada (+1) if no country code provided
 */
export const toE164Format = (phone: string, defaultCountryCode = '+1'): string => {
  // Remove all formatting characters
  let cleaned = phone.replace(PHONE_CLEAN_REGEX, '');

  // If already in E.164 format, return as is
  if (isValidE164(cleaned)) {
    return cleaned;
  }

  // If starts with +, it might be invalid E.164
  if (cleaned.startsWith('+')) {
    // Remove the + and try to reformat
    cleaned = cleaned.substring(1);
  }

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  // If it looks like a 10-digit US number, add +1
  if (/^\d{10}$/.test(cleaned)) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // If it looks like a 11-digit US number starting with 1
  if (/^1\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // For other cases, add the default country code
  return `${defaultCountryCode}${cleaned}`;
};

/**
 * Masks a phone number for display (e.g., +1******1234)
 */
export const maskPhone = (phone: string): string => {
  if (phone.length < 8) {
    return phone.substring(0, 2) + '*'.repeat(phone.length - 2);
  }
  const visible = 4;
  const prefix = phone.substring(0, phone.length - visible - 6);
  const suffix = phone.substring(phone.length - visible);
  return `${prefix}${'*'.repeat(6)}${suffix}`;
};

/**
 * Zod schema for phone number validation
 */
export const phoneSchema = z.string()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .refine(
    (phone) => {
      const cleaned = phone.replace(PHONE_CLEAN_REGEX, '');
      return /^\+?\d{7,15}$/.test(cleaned);
    },
    { message: 'Invalid phone number format' }
  );

/**
 * Zod schema for E.164 format (after conversion)
 */
export const e164Schema = z.string()
  .regex(E164_REGEX, 'Phone number must be in E.164 format');
