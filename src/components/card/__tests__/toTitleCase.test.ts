import { toTitleCase } from '../toTitleCase';

describe('toTitleCase', () => {
  it('capitalizes each word of an upper-case holder name (fr)', () => {
    expect(toTitleCase('ÉLISE ADJOVI', 'fr')).toBe('Élise Adjovi');
  });

  it('handles hyphens and apostrophes', () => {
    expect(toTitleCase("JEAN-MARC D'ALMEIDA", 'fr')).toBe("Jean-Marc D'Almeida");
  });

  it('works in English and keeps an empty string empty', () => {
    expect(toTitleCase('MARY ANN LEE', 'en')).toBe('Mary Ann Lee');
    expect(toTitleCase('', 'fr')).toBe('');
  });
});
