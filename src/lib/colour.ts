/* Token names and the colour maths the site needs at runtime. The groups below
   are the single source of truth: markup that offers a choice of colours builds
   its options from them. */

export const backgroundTokens = ['bg0', 'bg1', 'bg2', 'bg3', 'bg4', 'bg5'] as const;
export const foregroundTokens = ['fg5', 'fg4', 'fg3', 'fg2', 'fg1', 'fg0'] as const;
export const accentTokens = ['rose', 'ember', 'coral', 'apricot', 'honey', 'fern', 'verdigris', 'cornflower', 'lilac', 'orchid'] as const;
export const diffTokens = ['diff-add', 'diff-remove', 'diff-modify'] as const;

/* Order matters: variantCss emits declarations in this sequence, matching the
   published firelight.css. */
export const paletteTokens = [...backgroundTokens, ...foregroundTokens, ...accentTokens, ...diffTokens] as const;

export function tokenLabel(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function cssVariable(variant: string, token: string): string {
  return '--fl-' + variant + '-' + token;
}

/** One variant's colours from the live stylesheet, or null if any is missing. */
export function paletteValues(variant: string, styles = getComputedStyle(document.documentElement)): Record<string, string> | null {
  const values: Record<string, string> = {};
  for (const token of paletteTokens) {
    const value = styles.getPropertyValue(cssVariable(variant, token)).trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(value)) return null;
    values[token] = value;
  }
  return values;
}

/** A variant as a :root block, or null rather than a half-written palette. */
export function variantCss(variant: string, values: Record<string, string> | null): string | null {
  if (!values || paletteTokens.some(token => !/^#[0-9a-f]{6}$/i.test(values[token] ?? ''))) return null;
  const declarations = paletteTokens.map(token => '  ' + cssVariable(variant, token) + ': ' + values[token].toLowerCase() + ';');
  return ':root {\n' + declarations.join('\n') + '\n}';
}

function rgbChannels(hex: string): number[] {
  return hex.slice(1).match(/../g)!.map(channel => parseInt(channel, 16) / 255);
}

/* Relative luminance per WCAG 2.x. */
function luminance(rgb: number[]): number {
  const channels = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

/** WCAG contrast ratio, 1 to 21. A translucent foreground is blended onto the
    background first, matching what the reader actually sees. */
export function contrastRatio(background: string, foreground: string, opacity = 1): number {
  const bg = rgbChannels(background);
  const blend = rgbChannels(foreground).map((value, index) => value * opacity + bg[index] * (1 - opacity));
  const a = luminance(bg), b = luminance(blend);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Black or white, whichever reads better on the given colour. */
export function copyInk(background: string): string {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#FFFFFF') ? '#000000' : '#FFFFFF';
}
