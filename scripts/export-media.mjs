import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ROOT,loadProject,loadCatalog} from './lib.mjs';
const {media,site}=await loadProject();
const catalog=await loadCatalog();
if (catalog.sha256!==media.archive.catalogSha256) throw new Error('Catalog checksum mismatch.');
const out=path.join(ROOT,'dist','media-catalog');
await mkdir(out,{recursive:true});
const csv = rows => rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')+'\n';
await writeFile(path.join(out,'asset_labels.json'),catalog.bytes);
await writeFile(path.join(out,'asset_labels.csv'),csv([
  ['Archive index','Title','Filename','Original URL','Referencing page','Role','Variant','Dimensions','Content type'],
  ...catalog.rows.map((r,i)=>[i,r.title,r.filename,r.source_url,r.page_url,r.role,r.variant,r.pixel_dimensions,r.content_type])
]));
await writeFile(path.join(out,'selected-assets.csv'),csv([
  ['Stable ID','Archive label','Archive filename','Original URL','GHL URL','Configured provider','Status'],
  ...media.assets.filter(a=>a.archiveIndex!==undefined).map(a=>[a.id,a.label,a.filename,a.sourceUrl,a.ghlUrl,site.mediaProvider,a.status])
]));
console.log(`Exported ${catalog.rows.length} original records and selected asset mappings to dist/media-catalog/. Edit media/manifest.json to change GHL URLs.`);
