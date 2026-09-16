/**
 * Pokémon type colours — the site's ONLY data-encoding palette.
 * These are never used as chrome, backgrounds, or decoration; a type colour
 * appearing on screen always means "this thing is of this type".
 *
 * Label colour is derived, not hand-picked: we compute WCAG relative luminance
 * and pick ink or paper, whichever clears 4.5:1. See labelFor().
 */

export const TYPE_HEX = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
} as const;

export type PokeType = keyof typeof TYPE_HEX;

export const INK = '#14120E';
export const PAPER = '#EFE7D2';

/**
 * Project categories in Sanity ('frontend', 'backend', …) mapped onto the
 * type system, so a project's colour means the same thing everywhere.
 */
export const CATEGORY_TYPE: Record<string, PokeType> = {
  frontend: 'fire',
  backend: 'water',
  fullstack: 'psychic',
  ml: 'dragon',
  ai: 'dragon',
  embedded: 'steel',
  data: 'electric',
  mobile: 'flying',
  devops: 'ground',
  systems: 'rock',
};

export function categoryHex(category?: string): string {
  const t = CATEGORY_TYPE[(category ?? '').toLowerCase()];
  return t ? TYPE_HEX[t] : TYPE_HEX.normal;
}

/** WCAG 2.1 relative luminance. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Crossover between ink and paper on our palette sits at L≈0.169.
 * Every one of the 18 type colours clears 4.5:1 on the side it lands
 * (worst case: poison 4.56:1, fighting 4.61:1).
 */
export function labelFor(hex: string): string {
  return luminance(hex) > 0.169 ? INK : PAPER;
}

export function typeHex(type: string): string {
  const key = type.toLowerCase();
  // Sanity stores project categories ('fullstack', 'ml', ...), not Pokemon type
  // names, so resolve those through CATEGORY_TYPE before giving up.
  return TYPE_HEX[key as PokeType] ?? TYPE_HEX[CATEGORY_TYPE[key]] ?? TYPE_HEX.normal;
}

/** Everything a chip needs, in one call. */
export function chip(type: string) {
  const bg = typeHex(type);
  return { bg, fg: labelFor(bg), label: type.toUpperCase() };
}
