import data from '../../resources/suggested-uses.json';
import palette, { defaultVariant } from './palette';

type Token = keyof typeof palette.variants.coal.colors;
export const usage = data;
export const suggestedUses = data.examples.map(entry => {
  if (!(entry.token in palette.variants[defaultVariant].colors)) throw new Error('Unknown suggested-use token: ' + entry.token);
  return { ...entry, token: entry.token as Token };
});
