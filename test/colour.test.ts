import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import palette from '../downloads/firelight.json';
import { contrastRatio, copyInk, paletteTokens, paletteValues, variantCss } from '../src/lib/colour';

for (const [variant, data] of Object.entries(palette.variants)) {
  const values = Object.fromEntries(Object.entries(data.colors).map(([token, colour]) => [token, colour.hex]));

  test(variant + ' exports every token and reads back unchanged', () => {
    const css = variantCss(variant, values);
    assert(css, 'a complete variant should export');

    const declared: Record<string, string> = {};
    postcss.parse(css).walkDecls(decl => { declared[decl.prop] = decl.value.toUpperCase(); });
    assert.equal(Object.keys(declared).length, paletteTokens.length);
    for (const token of paletteTokens) assert.equal(declared['--fl-' + variant + '-' + token], values[token], token);

    const styles = { getPropertyValue: (name: string) => declared[name] ?? '' } as CSSStyleDeclaration;
    assert.deepEqual(paletteValues(variant, styles), values);
  });

  test(variant + ' refuses to export or read a partial palette', () => {
    assert.equal(variantCss(variant, { ...values, bg1: '' }), null);

    const declared: Record<string, string> = { ...values };
    const styles = { getPropertyValue: (name: string) => declared[name.replace('--fl-' + variant + '-', '')] ?? '' } as CSSStyleDeclaration;
    delete declared.bg1;
    assert.equal(paletteValues(variant, styles), null);
  });
}

test('a missing palette cannot be exported', () => {
  assert.equal(variantCss('coal', null), null);
});

test('contrast matches known ratios and blends a translucent foreground', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#000000'), 21);
  assert.equal(contrastRatio('#123456', '#123456'), 1);
  assert.equal(contrastRatio('#123456', '#FFFFFF', 0), 1);
  const half = contrastRatio('#000000', '#FFFFFF', 0.5);
  assert(half > 1 && half < 21);
  assert(Math.abs(half - 5.280822809644651) < 1e-10);
});

test('copy labels pick the more readable of black and white', () => {
  assert.equal(copyInk('#FFFFFF'), '#000000');
  assert.equal(copyInk('#000000'), '#FFFFFF');
  assert.equal(copyInk('#777777'), '#000000');
});
