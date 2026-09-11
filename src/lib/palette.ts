import palette from '../../downloads/firelight.json';
export default palette;
export type Variant = keyof typeof palette.variants;
export const variants = Object.keys(palette.variants) as Variant[];
export const variantNames: Record<Variant, string> = { coal: 'Coal', smoulder: 'Smoulder', ash: 'Ash' };

export const defaultVariant = palette.defaultVariant as Variant;
export const siteVariant: Variant = 'smoulder';
