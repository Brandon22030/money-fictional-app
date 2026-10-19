export type Favorite = { id: string; nameKey: string };

export const FAVORITES: Favorite[] = [
  { id: 'amina', nameKey: 'content:favorites.amina' },
  { id: 'koffi', nameKey: 'content:favorites.koffi' },
  { id: 'lea', nameKey: 'content:favorites.lea' },
  { id: 'samuel', nameKey: 'content:favorites.samuel' },
];

/** Returns the favorite with this id, or undefined for any unknown value (free text included). */
export function findFavorite(id: string | undefined): Favorite | undefined {
  if (!id) return undefined;
  return FAVORITES.find((favorite) => favorite.id === id);
}
