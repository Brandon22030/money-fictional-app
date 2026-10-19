export const AFFIRMATION_KEYS: string[] = Array.from(
  { length: 31 },
  (_, index) => `content:affirmations.a${String(index + 1).padStart(2, '0')}`,
);

const MS_PER_DAY = 86_400_000;

export function getAffirmationOfTheDay(date: Date = new Date()): string {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
  return AFFIRMATION_KEYS[dayNumber % AFFIRMATION_KEYS.length];
}
