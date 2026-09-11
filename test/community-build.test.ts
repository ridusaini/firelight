import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import samples from '../resources/community.samples.json';
const run=promisify(execFile);
for(const [label,entries] of [['empty',[]],['populated',samples.entries]] as const)test('production builds with community data: '+label,async()=>{
  const root=process.cwd();
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'firelight-build-test-'));
  try{
    for(const file of ['src','public','resources','downloads','astro.config.mjs','tsconfig.json','package.json'])await fs.cp(path.join(root,file),path.join(temporary,file),{recursive:true});
    await fs.symlink(path.join(root,'node_modules'),path.join(temporary,'node_modules'),'dir');
    const data={schemaVersion:1,entries};
    await fs.writeFile(path.join(temporary,'resources/community.json'),JSON.stringify(data));
    await run(process.execPath,[path.join(root,'node_modules/astro/bin/astro.mjs'),'build'],{cwd:temporary,timeout:60000});
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(temporary,'dist/community.json'),'utf8')),data);
    const html=await fs.readFile(path.join(temporary,'dist/community/index.html'),'utf8');
    const links:string[]=[];
    const visit=(node:DefaultTreeAdapterTypes.Node)=>{
      if('attrs' in node)for(const attr of node.attrs)if(attr.name==='href')links.push(attr.value);
      if('childNodes' in node)for(const child of node.childNodes)visit(child);
    };
    visit(parse(html));
    for(const entry of entries)assert(links.includes(entry.url),'Missing project link: '+entry.url);
    if(entries.length===0)for(const entry of samples.entries)assert(!links.includes(entry.url),'Sample project leaked into production: '+entry.url);
  }finally{
    await fs.rm(temporary,{recursive:true,force:true});
  }
});
