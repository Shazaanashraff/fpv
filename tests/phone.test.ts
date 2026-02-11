import { toE164Format, isValidE164, maskPhone } from '../src/utils/phone';

describe('Phone Utilities', () => {
  describe('isValidE164', () => {
    it('should return true for valid E.164 numbers', () => {
      expect(isValidE164('+11234567890')).toBe(true);
      expect(isValidE164('+447911123456')).toBe(true);
      expect(isValidE164('+8613912345678')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidE164('1234567890')).toBe(false);
      expect(isValidE164('+1')).toBe(false);
      expect(isValidE164('++11234567890')).toBe(false);
      expect(isValidE164('+1-234-567-890')).toBe(false);
    });
  });

  describe('toE164Format', () => {
    it('should return valid E.164 as-is', () => {
      expect(toE164Format('+11234567890')).toBe('+11234567890');
    });

    it('should convert 10-digit US number', () => {
      expect(toE164Format('1234567890')).toBe('+11234567890');
    });

    it('should convert 11-digit US number starting with 1', () => {
      expect(toE164Format('11234567890')).toBe('+11234567890');
    });

    it('should remove formatting characters', () => {
      expect(toE164Format('(123) 456-7890')).toBe('+11234567890');
      expect(toE164Format('123.456.7890')).toBe('+11234567890');
      expect(toE164Format('123-456-7890')).toBe('+11234567890');
    });

    it('should handle custom country codes', () => {
      expect(toE164Format('7911123456', '+44')).toBe('+447911123456');
    });

    it('should remove leading zeros', () => {
      expect(toE164Format('01234567890', '+1')).toBe('+11234567890');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number correctly', () => {
      const masked = maskPhone('+11234567890');
      expect(masked).toContain('******');
      expect(masked.endsWith('7890')).toBe(true);
    });

    it('should handle short numbers', () => {
      const masked = maskPhone('+123456');
      expect(masked.includes('*')).toBe(true);
    });
  });
});
