import test from 'node:test';
import sampleData from '../resources/community.samples.json';
import assert from 'node:assert/strict';
import { validateCommunity, communityGroups, getCommunity, entryContext, type CommunityEntry, type CommunityDirectory } from '../src/lib/community';
const author = { name: 'Creator', url: 'https://example.com/creator' };
const theme = (): CommunityEntry => ({ id:'example-creator', name:'Example theme', kind:'theme', description:'A test fixture.', url:'https://example.com/theme', authors:[{...author}], app:'Example App', variants:['coal'] });
const project = (): CommunityEntry => ({ id:'example-project', name:'Example project', kind:'project', description:'A project fixture.', url:'https://example.com/project', authors:[{...author}] });
const directory = (...entries: CommunityEntry[]): CommunityDirectory => ({schemaVersion:1,entries});
for (const entries of [[], [theme()], [project()], [theme(),project()]]) {
  test('valid directory with ' + (entries.map(e=>e.kind).join(', ') || 'no entries'),()=>{
    const data=validateCommunity(directory(...entries));
    assert.equal(communityGroups(data).length,new Set(entries.map(e=>e.kind)).size);
  });
}
test('partial variants, multiple creators, optional links and notes',()=>{
  const entry=theme(); entry.variants=['coal','ash']; entry.authors.push({name:'Second',url:'https://codeberg.org/second'});
  entry.links=[{label:'Install',url:'https://example.com/install'}];entry.notes='Editor only.';entry.category='editors';
  assert.equal(validateCommunity(directory(entry)).entries[0],entry);
});
test('same app is allowed and sorted without mutating input',()=>{
  const a={...theme(),name:'Zebra'}, b={...theme(),id:'second',name:'Alpha',url:'https://example.com/second'};
  const data=directory(a,b);
  assert.deepEqual(communityGroups(data)[0].entries,[b,a]);assert.deepEqual(data.entries,[a,b]);
});
test('matching names sort by author then ID',()=>{
  const a=theme(), b={...theme(),id:'second',url:'https://example.com/second',authors:[{...author,name:'Aaron'}]};
  assert.deepEqual(communityGroups(directory(a,b))[0].entries,[b,a]);
  const c={...a,id:'aaa',url:'https://example.com/aaa'};
  assert.deepEqual(communityGroups(directory(a,c))[0].entries,[c,a]);
});
test('sample entries require development and explicit sample mode',()=>{
  assert.deepEqual(getCommunity(true,true),sampleData);
  for(const args of [[false,false],[true,false],[false,true]] as const) assert.deepEqual(getCommunity(...args),getCommunity());
});
for (const [label, mutate] of [
  ['unknown schema version', (data: any) => { data.schemaVersion = 2; }],
  ['unknown field', data => { data.entries[0].stars = 100; }],
  ['missing app', data => { delete data.entries[0].app; }],
  ['missing variants', data => { delete data.entries[0].variants; }],
  ['empty variants', data => { data.entries[0].variants = []; }],
  ['unknown variant', data => { data.entries[0].variants = ['night']; }],
  ['repeated variant', data => { data.entries[0].variants = ['coal', 'coal']; }],
  ['no creators', data => { data.entries[0].authors = []; }],
  ['blank name', data => { data.entries[0].name = '  '; }],
  ['invalid ID', data => { data.entries[0].id = 'Bad ID'; }],
  ['unknown category', data => { data.entries[0].category = 'new-category'; }],
  ['duplicate ID', data => { data.entries.push({ ...theme(), url: 'https://example.com/other' }); }],
  ['duplicate URL', data => { data.entries.push({ ...theme(), id: 'other', url: 'https://EXAMPLE.com/theme/#readme' }); }]
] as [string, (data: any) => void][]) {
  test('rejects ' + label, () => {
    const data = directory(theme());
    mutate(data);
    assert.throws(() => validateCommunity(data));
  });
}

for (const badUrl of ['javascript:alert(1)', 'http://example.com', '//example.com', 'https://user:password@example.com', 'https://example.com/with space', 'https://example.com/\\path']) {
  for (const field of ['project', 'author', 'link']) {
    test('rejects unsafe ' + field + ' URL ' + badUrl, () => {
      const entry = theme();
      if (field === 'project') entry.url = badUrl;
      if (field === 'author') entry.authors[0].url = badUrl;
      if (field === 'link') entry.links = [{ label: 'More', url: badUrl }];
      assert.throws(() => validateCommunity(directory(entry)));
    });
  }
}

test('card context omits app names already present in the title',()=>{
  assert.equal(entryContext({...theme(),name:'firelight for Example App'}),'Coal');
  assert.equal(entryContext({...theme(),name:'Firelight for EXAMPLE-APP'}),'Coal');
  assert.equal(entryContext(theme()),'Example App / Coal');
});
test('card context preserves distinct app names and optional metadata',()=>{
  assert.equal(entryContext({...theme(),name:'Decode',app:'Code'}),'Code / Coal');
  assert.equal(entryContext({...theme(),name:'C++ palette',app:'C'}),'C / Coal');
  assert.equal(entryContext({...theme(),variants:['coal','ash']}),'Example App / Coal, Ash');
  assert.equal(entryContext(project()),'');
});
