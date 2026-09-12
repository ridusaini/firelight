import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import palette from '../downloads/firelight.json';
import schema from '../resources/palette.schema.json';
test('complete palette validates and incomplete or old-shaped colours do not', () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  assert(validate(palette), ajv.errorsText(validate.errors));
  const missing = structuredClone(palette);
  Reflect.deleteProperty(missing.variants.coal.colors, 'rose');
  assert.equal(validate(missing), false);
  const invalid = structuredClone(palette);
  invalid.variants.coal.colors.rose.rgb.r = 256;
  assert.equal(validate(invalid), false);
  const old = structuredClone(palette);
  Object.assign(old.variants.coal.colors, { rose: '#F06B8A' });
  assert.equal(validate(old), false);
});

test('RGB channels match the palette hex values', () => {
  for (const variant of Object.values(palette.variants)) {
    for (const color of Object.values(variant.colors)) {
      const channels = color.hex.slice(1).match(/../g)!.map(value => parseInt(value, 16));
      assert.deepEqual([color.rgb.r, color.rgb.g, color.rgb.b], channels, color.cssVariable);
    }
  }
});
