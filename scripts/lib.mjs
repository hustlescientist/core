import {readFile, readdir, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brotliDecompressSync} from 'node:zlib';
import {createHash} from 'node:crypto';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const read = relative => readFile(path.join(ROOT,relative),'utf8');
export const readJSON = async relative => JSON.parse(await read(relative));
export const keyShape = object => {
  if (Array.isArray(object)) return object.map(keyShape);
  if (object && typeof object === 'object') return Object.fromEntries(Object.keys(object).sort().map(k => [k,keyShape(object[k])]));
  return typeof object;
};
export const jsonForHTML = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export const bindingIds = value => typeof value === 'string' ? [value] : Object.values(value || {}).flatMap(bindingIds);
export function https(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export async function loadCatalog() {
  const bytes = brotliDecompressSync(await readFile(path.join(ROOT,'media/archive/asset-labels.json.br')), {maxOutputLength: 4*1024*1024});
  return {rows:JSON.parse(bytes.toString('utf8')),sha256:createHash('sha256').update(bytes).digest('hex'),bytes};
}
export async function loadProject() {
  return {site:await readJSON('src/config/site.json'),locales:{en:await readJSON('src/content/en.json'),es:await readJSON('src/content/es.json')},media:await readJSON('media/manifest.json')};
}
export async function validate(data, release = false) {
  const {site,locales,media} = data;
  const errors = [];
  if (JSON.stringify(keyShape(locales.en)) !== JSON.stringify(keyShape(locales.es))) errors.push('English/Spanish content structures differ.');
  if (site.languages.join(',') !== 'en,es' || !site.languages.includes(site.defaultLanguage)) errors.push('Configure both supported languages.');
  if (!['original','ghl'].includes(site.mediaProvider)) errors.push('Media provider must be original or ghl.');
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(site.contact.email) || !/^tel:\+\d+$/.test(site.contact.phoneHref)) errors.push('Invalid public contact configuration.');
  for (const [name,value] of Object.entries(site.integrations)) {
    if (name === 'forms') continue;
    if (value && !https(value)) errors.push(`${name} must be an HTTPS URL without credentials.`);
  }
  for (const [name,forms] of Object.entries(site.integrations.forms)) for (const lang of site.languages) {
    if (forms[lang] && !https(forms[lang])) errors.push(`${name}/${lang} form must use HTTPS.`);
    if (release && !forms[lang]) errors.push(`${name}/${lang} form is not configured.`);
  }
  const catalog = await loadCatalog();
  if (catalog.sha256 !== media.archive.catalogSha256 || catalog.rows.length !== media.archive.entries) errors.push('Source archive catalog checksum/count mismatch.');
  const ids = new Set();
  const used = new Set(bindingIds(media.bindings));
  for (const asset of media.assets) {
    if (ids.has(asset.id)) errors.push(`Duplicate media ID: ${asset.id}`);
    ids.add(asset.id);
    if (!['needed','review','approved','retired'].includes(asset.status)) errors.push(`Invalid media status: ${asset.id}`);
    for (const field of ['sourceUrl','ghlUrl']) if (asset[field] && !https(asset[field])) errors.push(`Invalid media ${field}: ${asset.id}`);
    if (asset.localPath) {
      if (!/^media\/(logos|images|icons|documents)\/[a-zA-Z0-9_./-]+$/.test(asset.localPath) || asset.localPath.split('/').includes('..')) errors.push(`Unsafe media path: ${asset.id}`);
      else { try { const file = await lstat(path.join(ROOT,asset.localPath)); if (!file.isFile() || file.size > 5*1024*1024) errors.push(`Media must be a file <=5 MiB: ${asset.id}`); } catch { errors.push(`Missing media file: ${asset.id}`); } }
    }
    if (used.has(asset.id)) {
      const source = catalog.rows[asset.archiveIndex];
      if (!source || source.source_url !== asset.sourceUrl || source.title !== asset.label || source.filename !== asset.filename) errors.push(`Source label or URL changed: ${asset.id}`);
      if (source && !/^image\/(png|jpeg|webp|avif|gif)$/.test(source.content_type)) errors.push(`Selected archive record is not a raster image: ${asset.id}`);
      if (!['review','approved'].includes(asset.status) || !asset.alt?.en || !asset.alt?.es || ![asset.width,asset.height].every(n=>Number.isInteger(n)&&n>0)) errors.push(`Used media lacks status, dimensions, or alternatives: ${asset.id}`);
      if ((release || site.stage === 'production') && asset.status !== 'approved') errors.push(`Used media needs production approval: ${asset.id}`);
    }
    for (const field of ['sourceVariants','ghlVariants']) {
      const widths = new Set();
      for (const v of asset[field] || []) {
        if (!https(v.url) || !Number.isInteger(v.width) || v.width <= 0 || widths.has(v.width)) errors.push(`Invalid or duplicate media variant: ${asset.id}/${field}`);
        widths.add(v.width);
        if (field === 'sourceVariants' && catalog.rows[v.archiveIndex]?.source_url !== v.url) errors.push(`Variant URL does not match archive: ${asset.id}`);
      }
    }
    if (asset.status === 'approved' && (!asset.approvalRef || !asset.sourceUrl || !asset.alt?.en || !asset.alt?.es)) errors.push(`Approved media lacks provenance, alternatives, or location: ${asset.id}`);
  }
  for (const id of used) if (!ids.has(id)) errors.push(`Media binding points to missing asset: ${id}`);
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
