import test from 'node:test';
import assert from 'node:assert/strict';
import sampleData from '../resources/community.samples.json';
import realData from '../resources/community.json';
import { validateCommunity, communityGroups, getCommunity, entryContext, type CommunityEntry, type CommunityDirectory } from '../src/lib/community';

const author = { name: 'Creator', url: 'https://example.com/creator' };

const theme = (): CommunityEntry => ({
  id: 'example-creator', name: 'Example theme', kind: 'theme',
  description: 'A test fixture.', url: 'https://example.com/theme',
  authors: [{ ...author }], app: 'Example App', variants: ['coal']
});

const project = (): CommunityEntry => ({
  id: 'example-project', name: 'Example project', kind: 'project',
  description: 'A project fixture.', url: 'https://example.com/project',
  authors: [{ ...author }]
});

const directory = (...entries: CommunityEntry[]): CommunityDirectory => ({ schemaVersion: 1, entries });

/* --- The data that actually ships ---------------------------------------- */

test('the published directory and the sample directory are both valid', () => {
  assert.doesNotThrow(() => validateCommunity(realData));
  assert.doesNotThrow(() => validateCommunity(sampleData));
});

test('samples are only served in development, and only when asked for', () => {
  assert.deepEqual(getCommunity(true, true), sampleData);
  for (const args of [[false, false], [true, false], [false, true]] as const) {
    assert.deepEqual(getCommunity(...args), realData);
  }
});

/* --- Accepted shapes ------------------------------------------------------ */

for (const entries of [[], [theme()], [project()], [theme(), project()]]) {
  test('accepts a directory with ' + (entries.map(entry => entry.kind).join(', ') || 'no entries'), () => {
    const data = validateCommunity(directory(...entries));
    assert.equal(communityGroups(data).length, new Set(entries.map(entry => entry.kind)).size);
  });
}

test('accepts partial variants, several creators, and optional links and notes', () => {
  const entry = theme();
  entry.variants = ['coal', 'ash'];
  entry.authors.push({ name: 'Second', url: 'https://codeberg.org/second' });
  entry.links = [{ label: 'Install', url: 'https://example.com/install' }];
  entry.notes = 'Editor only.';
  entry.category = 'editors';
  assert.equal(validateCommunity(directory(entry)).entries[0], entry);
});

/* --- Rejected shapes ------------------------------------------------------ */

const rejections: [string, (data: any) => void][] = [
  ['unknown schema version', data => { data.schemaVersion = 2; }],
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
];

for (const [label, mutate] of rejections) {
  test('rejects ' + label, () => {
    const data = directory(theme());
    mutate(data);
    assert.throws(() => validateCommunity(data));
  });
}

const unsafeUrls = [
  'javascript:alert(1)',
  'http://example.com',
  '//example.com',
  'https://user:password@example.com',
  'https://example.com/with space',
  'https://example.com/\\path'
];

for (const url of unsafeUrls) {
  for (const field of ['project', 'author', 'link'] as const) {
    test('rejects unsafe ' + field + ' URL ' + url, () => {
      const entry = theme();
      if (field === 'project') entry.url = url;
      if (field === 'author') entry.authors[0].url = url;
      if (field === 'link') entry.links = [{ label: 'More', url }];
      assert.throws(() => validateCommunity(directory(entry)));
    });
  }
}

/* --- Ordering ------------------------------------------------------------- */

test('entries sort by name without mutating the source data', () => {
  const first = { ...theme(), name: 'Zebra' };
  const second = { ...theme(), id: 'second', name: 'Alpha', url: 'https://example.com/second' };
  const data = directory(first, second);
  assert.deepEqual(communityGroups(data)[0].entries, [second, first]);
  assert.deepEqual(data.entries, [first, second], 'communityGroups must not reorder its input');
});

test('matching names fall back to creator, then to ID', () => {
  const base = theme();
  const byAuthor = { ...theme(), id: 'second', url: 'https://example.com/second', authors: [{ ...author, name: 'Aaron' }] };
  assert.deepEqual(communityGroups(directory(base, byAuthor))[0].entries, [byAuthor, base]);

  const byId = { ...base, id: 'aaa', url: 'https://example.com/aaa' };
  assert.deepEqual(communityGroups(directory(base, byId))[0].entries, [byId, base]);
});

/* --- Derived labels ------------------------------------------------------- */

test('an app name already in the title is not repeated beside it', () => {
  assert.equal(entryContext({ ...theme(), name: 'firelight for Example App' }), 'Coal');
  assert.equal(entryContext({ ...theme(), name: 'Firelight for EXAMPLE-APP' }), 'Coal');
  assert.equal(entryContext(theme()), 'Example App / Coal');
});

test('a distinct app name is kept, even when one name contains the other', () => {
  assert.equal(entryContext({ ...theme(), name: 'Decode', app: 'Code' }), 'Code / Coal');
  assert.equal(entryContext({ ...theme(), name: 'C++ palette', app: 'C' }), 'C / Coal');
  assert.equal(entryContext({ ...theme(), variants: ['coal', 'ash'] }), 'Example App / Coal, Ash');
  assert.equal(entryContext(project()), '');
});
