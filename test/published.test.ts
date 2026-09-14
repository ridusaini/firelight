/* The built site in dist/, which `pretest` produces.

   It deploys under /firelight/ rather than a domain root, so a wrong path works
   in dev and 404s in production. */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import postcss from 'postcss';
import config from '../astro.config.mjs';

const base = config.base!.replace(/\/?$/, '/');

const published = new Map<string, string>();
(function collect(dir: string) {
  for (const entry of fs.readdirSync(path.join('dist', dir), { withFileTypes: true })) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else published.set(file, fs.readFileSync(path.join('dist', file), 'utf8'));
  }
})('');

type Node = DefaultTreeAdapterTypes.Node;
const descendants = (node: Node): Node[] => [node, ...('childNodes' in node ? node.childNodes : []).flatMap(descendants)];

test('every local link and asset resolves to a file that was published', () => {
  const origin = 'https://firelight.test';
  let checked = 0;

  const resolve = (value: string, from: string) => {
    const context = new URL(from, origin + base);
    const url = new URL(value, context);
    if (url.origin !== context.origin) return; // external, not ours to verify
    checked++;
    assert(url.pathname.startsWith(base), from + ' points outside ' + base + ': ' + value);
    let target = url.pathname.slice(base.length);
    if (!target || target.endsWith('/')) target += 'index.html';
    assert(published.has(target), from + ' points at a file that was not published: ' + value);
  };

  for (const [file, source] of published) {
    if (file.endsWith('.html')) {
      for (const node of descendants(parse(source))) {
        if (!('attrs' in node)) continue;
        for (const attr of node.attrs) {
          if (attr.name === 'href' || attr.name === 'src') resolve(attr.value, file);
        }
      }
    }
    if (file.endsWith('.css')) {
      postcss.parse(source).walkDecls(decl => {
        for (const match of decl.value.matchAll(/url\(["']?([^"')]+)["']?\)/g)) resolve(match[1], file);
      });
    }
  }

  assert(checked > 40, 'only ' + checked + ' local references found; the walk is not reaching the pages');
});

test('the published downloads are byte-identical to their sources', () => {
  const downloads = [['firelight.css', 'downloads/firelight.css'], ['firelight.json', 'downloads/firelight.json'], ['LICENSE', 'LICENSE']];
  for (const [name, source] of downloads) {
    assert.deepEqual(fs.readFileSync('dist/' + name), fs.readFileSync(source), name + ' does not match ' + source);
  }
});

test('every listed project appears on the community page', () => {
  const { entries } = JSON.parse(fs.readFileSync('resources/community.json', 'utf8'));
  const page = published.get('community/index.html')!;
  for (const entry of entries) {
    assert(page.includes(entry.url), entry.id + ' is in the directory but not on the page');
    assert(page.includes(entry.name), entry.id + ' is listed but its name is not rendered');
  }
});

test('production ships the real community directory and no development data', () => {
  const real = JSON.parse(fs.readFileSync('resources/community.json', 'utf8'));
  assert.deepEqual(JSON.parse(published.get('community.json')!), real);

  for (const file of ['community.samples.json', 'resources/community.samples.json', 'suggested-uses.json', 'resources/suggested-uses.json']) {
    assert(!published.has(file), 'development-only data was published: ' + file);
  }

  const samples = JSON.parse(fs.readFileSync('resources/community.samples.json', 'utf8'));
  const pages = [...published].filter(([file]) => file.endsWith('.html')).map(([, source]) => source).join('\n');
  for (const entry of samples.entries) {
    assert(!pages.includes(entry.url), 'a sample entry reached the published site: ' + entry.url);
  }
});
