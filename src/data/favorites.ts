export type FavoriteIcon = 'star' | 'heart' | 'sun' | 'users';

export type Favorite = { id: string; nameKey: string; icon: FavoriteIcon };

export const FAVORITES: Favorite[] = [
  { id: 'universe', nameKey: 'content:favorites.universe', icon: 'star' },
  { id: 'gratitude', nameKey: 'content:favorites.gratitude', icon: 'heart' },
  { id: 'futureSelf', nameKey: 'content:favorites.futureSelf', icon: 'sun' },
  { id: 'family', nameKey: 'content:favorites.family', icon: 'users' },
];

/** Returns the favorite with this id, or undefined for any unknown value (free text included). */
export function findFavorite(id: string | undefined): Favorite | undefined {
  if (!id) return undefined;
  return FAVORITES.find((favorite) => favorite.id === id);
}
