import { describe, it, expect } from 'vitest';

function normalizePhoneDigits(phoneStr?: string | null): string {
  if (!phoneStr) return '';
  let digits = phoneStr.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    digits = '0' + digits.slice(3);
  }
  return digits;
}

function phonesMatch(phoneA?: string | null, phoneB?: string | null): boolean {
  if (!phoneA || !phoneB) return false;
  const rawA = phoneA.replace(/\s+/g, '').replace(/-/g, '').trim();
  const rawB = phoneB.replace(/\s+/g, '').replace(/-/g, '').trim();
  if (rawA === rawB) return true;

  const normA = normalizePhoneDigits(phoneA);
  const normB = normalizePhoneDigits(phoneB);
  if (normA && normB && normA === normB) return true;

  const last10A = normA.slice(-10);
  const last10B = normB.slice(-10);
  if (last10A.length === 10 && last10A === last10B) return true;

  return false;
}

describe('Phone Normalization & Matching Utilities', () => {
  it('should normalize international Nigerian numbers (+234) to local leading zero', () => {
    expect(normalizePhoneDigits('+2348000000000')).toBe('08000000000');
    expect(normalizePhoneDigits('08000000000')).toBe('08000000000');
  });

  it('should accurately match different phone representations for the same user', () => {
    expect(phonesMatch('08000000000', '+2348000000000')).toBe(true);
    expect(phonesMatch('080 0000 0000', '080-0000-0000')).toBe(true);
    expect(phonesMatch('08000000000', '08111111111')).toBe(false);
  });
});
