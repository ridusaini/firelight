import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import postcss from 'postcss';
import fs from 'node:fs';
import palette from '../downloads/firelight.json';
import schema from '../resources/palette.schema.json';
import suggestedUses from '../resources/suggested-uses.json';
import { accentTokens, backgroundTokens, foregroundTokens, paletteTokens } from '../src/lib/colour';

const variants = Object.entries(palette.variants);
const colours = variants.flatMap(([variant, data]) =>
  Object.entries(data.colors).map(([token, colour]) => ({ variant, token, colour })));

/* Deliberately not imported from src/lib: these reconvert the hex so the
   published coordinates are checked against a second implementation. */
const channels = (hex: string): number[] => hex.slice(1).match(/../g)!.map(pair => parseInt(pair, 16) / 255);
const linear = (value: number): number => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

function toHsl([r, g, b]: number[]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), chroma = max - min;
  const l = (max + min) / 2;
  let h = 0;
  if (chroma) {
    h = 60 * (max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4);
    if (h < 0) h += 360;
  }
  return { h, s: (chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * l - 1))) * 100, l: l * 100 };
}

function toOklch(rgb: number[]) {
  const [r, g, b] = rgb.map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  let h = Math.atan2(bb, a) * 180 / Math.PI;
  if (h < 0) h += 360;
  return { l: lightness, c: Math.hypot(a, bb), h };
}

const luminance = (hex: string): number => {
  const [r, g, b] = channels(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* Hue is undefined on a neutral colour, hence the chroma guards below. */
const hueDelta = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

test('palette matches its schema, and incomplete or old-shaped colours do not', () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  assert(validate(palette), ajv.errorsText(validate.errors));

  const missing = structuredClone(palette);
  Reflect.deleteProperty(missing.variants.coal.colors, 'rose');
  assert.equal(validate(missing), false, 'a missing colour should fail');

  const outOfRange = structuredClone(palette);
  outOfRange.variants.coal.colors.rose.rgb.r = 256;
  assert.equal(validate(outOfRange), false, 'an out-of-range channel should fail');

  const flat = structuredClone(palette);
  Object.assign(flat.variants.coal.colors, { rose: '#F06B8A' });
  assert.equal(validate(flat), false, 'a bare hex string should fail');
});

test('every variant carries the same tokens, in the same order', () => {
  for (const [variant, data] of variants) {
    assert.deepEqual(Object.keys(data.colors), [...paletteTokens], variant);
  }
});

test('RGB, HSL, and OKLCH agree with the hex they accompany', () => {
  for (const { variant, token, colour } of colours) {
    const where = variant + '.' + token;
    const rgb = channels(colour.hex);

    assert.deepEqual(rgb.map(value => Math.round(value * 255)), [colour.rgb.r, colour.rgb.g, colour.rgb.b], where);

    const hsl = toHsl(rgb);
    assert(Math.abs(hsl.s - colour.hsl.s) < 1e-5, where + ' HSL saturation');
    assert(Math.abs(hsl.l - colour.hsl.l) < 1e-5, where + ' HSL lightness');
    if (hsl.s > 0.5) assert(hueDelta(hsl.h, colour.hsl.h) < 1e-5, where + ' HSL hue');

    const oklch = toOklch(rgb);
    assert(Math.abs(oklch.l - colour.oklch.l) < 1e-5, where + ' OKLCH lightness');
    assert(Math.abs(oklch.c - colour.oklch.c) < 1e-5, where + ' OKLCH chroma');
    if (oklch.c > 0.002) assert(hueDelta(oklch.h, colour.oklch.h) < 1e-3, where + ' OKLCH hue');
  }
});

test('every colour names the CSS variable it is published under', () => {
  for (const { variant, token, colour } of colours) {
    assert.equal(colour.cssVariable, '--fl-' + variant + '-' + token);
  }
});

test('firelight.css publishes exactly the colours in firelight.json', () => {
  const declared = new Map<string, string>();
  postcss.parse(fs.readFileSync('downloads/firelight.css', 'utf8'))
    .walkDecls(decl => { declared.set(decl.prop, decl.value.toUpperCase()); });

  for (const { colour } of colours) {
    assert.equal(declared.get(colour.cssVariable), colour.hex, colour.cssVariable);
  }
  assert.equal(declared.size, colours.length, 'the CSS declares colours the JSON does not');
});

test('defaultVariant names a variant that exists', () => {
  assert(palette.defaultVariant in palette.variants, palette.defaultVariant);
});

/* --- Claims the site states as fact -------------------------------------- */

test('backgrounds run dark to light, and reverse in a light variant', () => {
  for (const [variant, data] of variants) {
    const steps = backgroundTokens.map(token => luminance(data.colors[token].hex));
    const lightening = data.appearance === 'dark';
    for (let i = 1; i < steps.length; i++) {
      assert(lightening ? steps[i] > steps[i - 1] : steps[i] < steps[i - 1],
        variant + ': ' + backgroundTokens[i - 1] + ' to ' + backgroundTokens[i] + ' breaks the ramp');
    }
  }
});

test('every fg shade reaches 4.5:1 against bg1, rising from fg5 to fg0', () => {
  for (const [variant, data] of variants) {
    const ratios = foregroundTokens.map(token => contrast(data.colors.bg1.hex, data.colors[token].hex));
    ratios.forEach((ratio, index) => {
      assert(ratio >= 4.5, variant + '.' + foregroundTokens[index] + ' is only ' + ratio.toFixed(2) + ':1 on bg1');
      if (index) assert(ratio >= ratios[index - 1], variant + ': ' + foregroundTokens[index] + ' has less contrast than ' + foregroundTokens[index - 1]);
    });
  }
});

test('accents stay distinct from bg1 and from each other', () => {
  for (const [variant, data] of variants) {
    const hexes = accentTokens.map(token => data.colors[token].hex);
    assert.equal(new Set(hexes).size, accentTokens.length, variant + ' repeats an accent colour');
    accentTokens.forEach((token, index) => {
      assert(contrast(data.colors.bg1.hex, hexes[index]) > 1.5, variant + '.' + token + ' is nearly invisible on bg1');
    });
  }
});

test('suggested uses only reference real tokens', () => {
  const known = new Set<string>(paletteTokens);
  for (const { token } of suggestedUses.examples) assert(known.has(token), 'unknown example token: ' + token);

  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') assert(known.has(value), 'unknown token at ' + path + ': ' + value);
    else for (const [key, child] of Object.entries(value as object)) walk(child, path + '.' + key);
  };
  walk(suggestedUses.mappings, 'mappings');
});
