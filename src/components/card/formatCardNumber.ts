export function formatCardNumber(cardNumber: string): string {
  return cardNumber
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}
