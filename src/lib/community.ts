import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../resources/community.schema.json';
import realData from '../../resources/community.json';
import sampleData from '../../resources/community.samples.json';
import { variantNames, type Variant } from './palette';

export interface CommunityEntry {
  id: string;
  name: string;
  kind: 'theme' | 'project';
  description: string;
  url: string;
  authors: { name: string; url: string }[];
  app?: string;
  variants?: Variant[];
  category?: 'editors' | 'terminals' | 'browsers' | 'desktop' | 'tools' | 'websites' | 'other';
  links?: { label: string; url: string }[];
  notes?: string;
}
export interface CommunityDirectory { schemaVersion: 1; entries: CommunityEntry[] }
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const check = ajv.compile<CommunityDirectory>(schema);
export const submissionUrl = 'https://github.com/ridusaini/firelight/issues/new?template=community.yml';
export function validateCommunity(data: unknown): CommunityDirectory {
  if (!check(data)) throw new Error('Community data: ' + ajv.errorsText(check.errors, { separator: '\n' }));
  const ids = new Set<string>(), urls = new Set<string>();
  for (const entry of data.entries) {
    if (ids.has(entry.id)) throw new Error('Duplicate project ID: ' + entry.id);
    ids.add(entry.id);
    for (const value of [entry.url, ...entry.authors.map(author => author.url), ...(entry.links ?? []).map(link => link.url)]) {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || /[\s\u0000-\u001f\\]/u.test(value)) throw new Error('Use a public HTTPS URL without credentials: ' + entry.id);
    }
    const url = new URL(entry.url); url.hash = '';
    const key = url.href.replace(/\/$/, '');
    if (urls.has(key)) throw new Error('Duplicate project URL: ' + entry.url);
    urls.add(key);
  }
  return data;
}
export function getCommunity(samples = false, development = false): CommunityDirectory {
  return validateCommunity(samples && development ? sampleData : realData);
}
const key = (entry: CommunityEntry): string => entry.name.toLowerCase() + '\0' + entry.authors.map(author => author.name.toLowerCase()).join(',') + '\0' + entry.id;
export function communityGroups(data: CommunityDirectory) {
  return ([['theme','App themes'],['project','Projects']] as const).map(([kind,title]) => ({
    kind, title, entries: data.entries.filter(entry => entry.kind === kind).sort((a,b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)
  })).filter(group => group.entries.length);
}

export function entryContext(entry: CommunityEntry): string {
  const words = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim();
  const appInTitle = entry.app && (' ' + words(entry.name) + ' ').includes(' ' + words(entry.app) + ' ');
  return [appInTitle ? undefined : entry.app, entry.variants?.map(variant => variantNames[variant]).join(', ')].filter(Boolean).join(' / ');
}
