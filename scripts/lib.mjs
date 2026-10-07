import {readFile, readdir, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const read = relative => readFile(path.join(ROOT,relative),'utf8');
export const readJSON = async relative => JSON.parse(await read(relative));
export const keyShape = object => {
  if (Array.isArray(object)) return object.map(keyShape);
  if (object && typeof object === 'object') return Object.fromEntries(Object.keys(object).sort().map(k => [k,keyShape(object[k])]));
  return typeof object;
};
export const jsonForHTML = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function https(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export async function loadProject() {
  return {site:await readJSON('src/config/site.json'),locales:{en:await readJSON('src/content/en.json'),es:await readJSON('src/content/es.json')},media:await readJSON('media/manifest.json')};
}
export async function validate(data, release = false) {
  const {site,locales,media} = data;
  const errors = [];
  if (JSON.stringify(keyShape(locales.en)) !== JSON.stringify(keyShape(locales.es))) errors.push('English/Spanish content structures differ.');
  if (site.languages.join(',') !== 'en,es' || !site.languages.includes(site.defaultLanguage)) errors.push('Configure both supported languages.');
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(site.contact.email) || !/^tel:\+\d+$/.test(site.contact.phoneHref)) errors.push('Invalid public contact configuration.');
  for (const [name,value] of Object.entries(site.integrations)) {
    if (name === 'forms') continue;
    if (value && !https(value)) errors.push(`${name} must be an HTTPS URL without credentials.`);
  }
  for (const [name,forms] of Object.entries(site.integrations.forms)) for (const lang of site.languages) {
    if (forms[lang] && !https(forms[lang])) errors.push(`${name}/${lang} form must use HTTPS.`);
    if (release && !forms[lang]) errors.push(`${name}/${lang} form is not configured.`);
  }
  const ids = new Set();
  for (const asset of media.assets) {
    if (ids.has(asset.id)) errors.push(`Duplicate media ID: ${asset.id}`);
    ids.add(asset.id);
    if (!['needed','review','approved','retired'].includes(asset.status)) errors.push(`Invalid media status: ${asset.id}`);
    for (const field of ['sourceUrl','publishedUrl']) if (asset[field] && !https(asset[field])) errors.push(`Invalid media ${field}: ${asset.id}`);
    if (asset.localPath) {
      if (!/^media\/(logos|images|icons|documents)\/[a-zA-Z0-9_./-]+$/.test(asset.localPath) || asset.localPath.split('/').includes('..')) errors.push(`Unsafe media path: ${asset.id}`);
      else { try { const file = await lstat(path.join(ROOT,asset.localPath)); if (!file.isFile() || file.size > 5*1024*1024) errors.push(`Media must be a file <=5 MiB: ${asset.id}`); } catch { errors.push(`Missing media file: ${asset.id}`); } }
    }
    if (asset.status === 'approved' && (!asset.approvalRef || !asset.sourceUrl || !asset.alt.en || !asset.alt.es || (!asset.localPath && !asset.publishedUrl))) errors.push(`Approved media lacks provenance, alternatives, or location: ${asset.id}`);
  }
  if (release) {
    for (const field of ['releaseReady','routingApproved','contentApproved','translationsApproved']) if (site[field] !== true) errors.push(`Release approval missing: ${field}`);
    if (site.routing !== 'hash-preview') errors.push('Production routing is not implemented in this starter; changing a flag is not sufficient.');
    if (site.stage !== 'production') errors.push('Release stage must be production.');
    if (site.routing === 'hash-preview') errors.push('Hash preview routing is not an approved production SEO solution. Implement the selected routing strategy first.');
    if (!site.integrations.portalUrl || !site.integrations.donationUrl) errors.push('Portal and donation destinations must be configured.');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return data;
}
export async function filesIn(relative) {
  const entries = await readdir(path.join(ROOT,relative),{withFileTypes:true});
  const result = [];
  for (const e of entries) { if (relative === 'media' && e.name === 'originals') continue; const p = path.posix.join(relative,e.name); if (e.isDirectory()) result.push(...await filesIn(p)); else result.push(p); }
  return result;
}
