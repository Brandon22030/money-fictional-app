/** "ÉLISE ADJOVI" -> "Élise Adjovi": first letter of each word (space, hyphen, apostrophe) in upper case. */
export function toTitleCase(value: string, locale: string): string {
  return value
    .toLocaleLowerCase(locale)
    .replace(/(^|[\s'’-])(\p{L})/gu, (_match, sep: string, letter: string) => sep + letter.toLocaleUpperCase(locale));
}
