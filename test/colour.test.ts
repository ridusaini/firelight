import test from 'node:test';
import assert from 'node:assert/strict';
import palette from '../downloads/firelight.json';
import { contrastRatio, copyInk, paletteTokens, paletteValues, variantCss } from '../src/lib/colour';
import { copy } from '../src/scripts/clipboard';
import postcss from 'postcss';

for(const [variant,data] of Object.entries(palette.variants)) {
  const values: Record<string,string>={...data.colors,...data.surfaces};
  test(variant+' export contains all 25 exact names and values',()=>{
    const css=variantCss(variant,values);assert(css);
    const declarations: Record<string,string>={};
    postcss.parse(css).walkDecls(decl=>{declarations[decl.prop]=decl.value.toUpperCase()});
    assert.equal(Object.keys(declarations).length,25);
    for(const token of paletteTokens) assert.equal(declarations['--fl-'+variant+'-'+token],values[token]);
    const styles={getPropertyValue:(name:string)=>declarations[name] ?? ''} as CSSStyleDeclaration;
    assert.deepEqual(paletteValues(variant,styles),values);
    delete declarations['--fl-'+variant+'-bg1'];assert.equal(paletteValues(variant,styles),null);
    assert.equal(variantCss(variant,{...values,bg1:''}),null);
  });
}
test('contrast matches known ratios and transparent text',()=>{
  assert.equal(contrastRatio('#000000','#FFFFFF'),21);
  assert.equal(contrastRatio('#FFFFFF','#000000'),21);
  assert.equal(contrastRatio('#123456','#123456'),1);
  assert.equal(contrastRatio('#123456','#FFFFFF',0),1);
  assert(Math.abs(contrastRatio('#000000','#FFFFFF',0.5)-5.280822809644651)<1e-10);
});
test('copy labels choose the more readable black or white text',()=>{
  assert.equal(copyInk('#FFFFFF'),'#000000');
  assert.equal(copyInk('#000000'),'#FFFFFF');
  assert.equal(copyInk('#777777'),'#000000');
});
test('missing palette values cannot be exported',()=>{
  assert.equal(variantCss('coal',null),null);
});
test('clipboard success, permission refusal, and unavailable API',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  try {
    let copied='';
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async(value:string)=>{copied=value}}}});
    assert.equal(await copy('firelight'),true);assert.equal(copied,'firelight');
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async()=>{throw new Error('NotAllowedError')}}}});
    assert.equal(await copy('firelight'),false);
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
    assert.equal(await copy('firelight'),false);
  } finally { if(original)Object.defineProperty(globalThis,'navigator',original);else Reflect.deleteProperty(globalThis,'navigator'); }
});
