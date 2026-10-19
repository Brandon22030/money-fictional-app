export type Rng = () => number;

const CARD_PREFIX = '8';
const CARD_LENGTH = 16;
const VALIDITY_YEARS = 4;

function randomDigit(rng: Rng): number {
  return Math.min(9, Math.floor(rng() * 10));
}

function luhnSum(digits: string): number {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum;
}

export function isLuhnValid(number: string): boolean {
  const digits = number.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return false;
  return luhnSum(digits) % 10 === 0;
}

export function generateCardNumber(rng: Rng = Math.random): string {
  let body = CARD_PREFIX;
  while (body.length < CARD_LENGTH - 1) {
    body += String(randomDigit(rng));
  }
  const validCheck = (10 - (luhnSum(`${body}0`) % 10)) % 10;
  let check = randomDigit(rng);
  if (check === validCheck) {
    check = (check + 1) % 10;
  }
  return `${body}${check}`;
}

export function formatCardNumber(number: string): string {
  return number.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function generateExpiry(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String((now.getFullYear() + VALIDITY_YEARS) % 100).padStart(2, '0');
  return `${month}/${year}`;
}

export function generateCvv(rng: Rng = Math.random): string {
  return `${randomDigit(rng)}${randomDigit(rng)}${randomDigit(rng)}`;
}
