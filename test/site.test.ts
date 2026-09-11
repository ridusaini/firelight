import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import postcss from 'postcss';
import palette from '../downloads/firelight.json';
const read=(file:string)=>fs.readFileSync(file,'utf8');
type Node=DefaultTreeAdapterTypes.Node;
const nodes=(node:Node):Node[]=>[node,...('childNodes' in node?node.childNodes:[]).flatMap(nodes)];
const files=new Map<string,string>();
function collect(dir:string){
  for(const entry of fs.readdirSync(path.join('dist',dir),{withFileTypes:true})){
    const file=path.posix.join(dir,entry.name);
    if(entry.isDirectory())collect(file);
    else files.set(file,read(path.join('dist',file)));
  }
}
collect('');
test('published local links and assets resolve under the project path',()=>{
  const check=(value:string,file:string)=>{
    const base=new URL(file,'https://firelight.test/firelight/');
    const url=new URL(value,base);
    if(url.origin!==base.origin)return;
    assert(url.pathname.startsWith('/firelight/'),file+': '+value);
    let target=url.pathname.slice('/firelight/'.length);
    if(!target||target.endsWith('/'))target+='index.html';
    assert(files.has(target),file+': missing '+value);
  };
  for(const [file,source] of files){
    if(file.endsWith('.html'))for(const node of nodes(parse(source))){
      if('attrs' in node)for(const attr of node.attrs)if(['href','src'].includes(attr.name))check(attr.value,file);
    }
    if(file.endsWith('.css'))postcss.parse(source).walkDecls(decl=>{
      for(const match of decl.value.matchAll(/url\(["']?([^"')]+)["']?\)/g))check(match[1],file);
    });
  }
});
test('published downloads match their sources',()=>{
  for(const file of ['firelight.css','firelight.json','LICENSE'])assert.deepEqual(fs.readFileSync('dist/'+file),fs.readFileSync(file==='LICENSE'?file:'downloads/'+file));
});
test('production publishes the real directory without the sample file',()=>{
  assert.deepEqual(JSON.parse(read('dist/community.json')),JSON.parse(read('resources/community.json')));
  assert(!files.has('resources/community.samples.json'));
});
test('all 75 palette values match CSS and JSON', () => {
  const values = new Map<string,string>();
  postcss.parse(read('downloads/firelight.css')).walkDecls(decl => { values.set(decl.prop, decl.value.toUpperCase()); });
  assert.equal(values.size, 75);
  let checked = 0;
  for (const [variant, data] of Object.entries(palette.variants)) {
    for (const [group, metadata] of [['colors', 'metadata'], ['surfaces', 'surfaceMetadata']] as const) {
      for (const [token, hex] of Object.entries(data[group])) {
        const variable = '--fl-' + variant + '-' + token;
        assert.equal((data[metadata] as Record<string,{cssVariable:string}>)[token].cssVariable, variable);
        assert.equal(values.get(variable), hex.toUpperCase(), variable);
        checked++;
      }
    }
  }
  assert.equal(checked, 75);
});
