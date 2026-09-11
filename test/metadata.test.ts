import test from 'node:test';
import assert from 'node:assert/strict';
import palette from '../downloads/firelight.json';

function coordinates(hex:string){
  const rgb=hex.slice(1).match(/../g)!.map(value=>parseInt(value,16));
  const [r,g,b]=rgb.map(value=>value/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,light=(max+min)/2;
  let hue=0;
  if(delta)hue=((max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4)*60+360)%360;
  const saturation=delta?delta/(1-Math.abs(2*light-1)):0;
  const linear=[r,g,b].map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
  const multiply=(weights:number[])=>weights.reduce((sum,value,index)=>sum+value*linear[index],0);
  const l=Math.cbrt(multiply([0.4122214708,0.5363325363,0.0514459929]));
  const m=Math.cbrt(multiply([0.2119034982,0.6806995451,0.1073969566]));
  const s=Math.cbrt(multiply([0.0883024619,0.2817188376,0.6299787005]));
  const L=0.2104542553*l+0.793617785*m-0.0040720468*s;
  const a=1.9779984951*l-2.428592205*m+0.4505937099*s;
  const bLab=0.0259040371*l+0.7827717662*m-0.808675766*s;
  return {rgb,hsl:[hue,saturation*100,light*100],oklch:[L,Math.hypot(a,bLab),(Math.atan2(bLab,a)*180/Math.PI+360)%360],luminance:multiply([0.2126,0.7152,0.0722])};
}
const numbers=(value:string)=>value.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
for(const [variant,data] of Object.entries(palette.variants))test(variant+' colour metadata agrees with hex values',()=>{
  const background=coordinates(data.colors.bg1).luminance;
  for(const [group,metadata] of [['colors','metadata'],['surfaces','surfaceMetadata']] as const){
    for(const [token,hex] of Object.entries(data[group])){
      const expected=coordinates(hex);
      const meta=(data[metadata] as Record<string,{rgb:string,hsl:string,oklch:string,contrast:number}>)[token];
      const label=variant+' '+token;
      assert.deepEqual(numbers(meta.rgb),expected.rgb,label+' RGB');
      for(const [format,tolerances] of [['hsl',[0.5,0.5,0.5]],['oklch',[0.0005,0.0005,0.05]]] as const){
        const actual=numbers(meta[format]);
        assert.equal(actual.length,3,label+' '+format);
        actual.forEach((value,index)=>{
          let difference=Math.abs(value-expected[format][index]);
          if((format==='hsl'&&index===0)||(format==='oklch'&&index===2)){
            if(expected.oklch[1]<1e-7)return;
            difference=Math.min(difference,360-difference);
          }
          assert(difference<=tolerances[index]+1e-6,label+' '+format+' channel '+index+': '+value+' vs '+expected[format][index]);
        });
      }
      const ratio=(Math.max(background,expected.luminance)+0.05)/(Math.min(background,expected.luminance)+0.05);
      assert(Math.abs(meta.contrast-ratio)<=0.005+1e-6,label+' contrast');
    }
  }
});
