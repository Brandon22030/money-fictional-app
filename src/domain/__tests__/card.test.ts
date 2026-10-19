import { existsSync } from 'fs';
import { join } from 'path';

import {
  formatCardNumber,
  generateCardNumber,
  generateCvv,
  generateExpiry,
  isLuhnValid,
} from '@/src/domain/card';

describe('card', () => {
  it('generates 1000 numbers with 16 digits, prefix 8 and invalid Luhn', () => {
    for (let i = 0; i < 1000; i += 1) {
      const number = generateCardNumber();
      expect(number).toMatch(/^8\d{15}$/);
      expect(isLuhnValid(number)).toBe(false);
    }
  });

  it('forces an invalid check digit even when the rng would produce the valid one', () => {
    for (const value of [0, 0.15, 0.5, 0.99]) {
      expect(isLuhnValid(generateCardNumber(() => value))).toBe(false);
    }
  });

  it('validates Luhn on a known number', () => {
    expect(isLuhnValid('4539578763621486')).toBe(true);
    expect(isLuhnValid('4539578763621487')).toBe(false);
    expect(isLuhnValid('abcd')).toBe(false);
  });

  it('formats in groups of 4', () => {
    expect(formatCardNumber('8123456789012345')).toBe('8123 4567 8901 2345');
  });

  it('is idempotent on an already grouped number', () => {
    expect(formatCardNumber('8123 4567 8901 2345')).toBe('8123 4567 8901 2345');
  });

  it('is the only card number formatter in the codebase', () => {
    const duplicate = join(__dirname, '..', '..', 'components', 'card', 'formatCardNumber.ts');
    expect(existsSync(duplicate)).toBe(false);
  });

  it('generates an expiry four years ahead', () => {
    expect(generateExpiry(new Date(2026, 9, 19))).toBe('10/30');
    expect(generateExpiry(new Date(2097, 0, 1))).toBe('01/01');
  });

  it('generates a 3-digit cvv', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCvv()).toMatch(/^\d{3}$/);
    }
  });
});
