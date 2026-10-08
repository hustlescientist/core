import {mkdir, writeFile, copyFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ROOT, read, loadProject, validate, jsonForHTML, bindingIds} from './lib.mjs';
export async function build({release = false} = {}) {
  const data = await validate(await loadProject(),release);
  const css = `${await read('src/css/tokens.css')}\n${await read('src/css/site.css')}`;
  const app = `${await read('src/js/media.js')}\n${await read('src/js/rich.js')}\n${await read('src/js/app.js')}`;
  const used = new Set(bindingIds(data.media.bindings));
  const runtimeMedia = {bindings:data.media.bindings,assets:data.media.assets.filter(a=>used.has(a.id)).map(a=>({id:a.id,label:a.label,kind:a.kind,status:a.status,sourceUrl:a.sourceUrl,ghlUrl:a.ghlUrl,sourceVariants:(a.sourceVariants||[]).map(v=>({url:v.url,width:v.width})),ghlVariants:a.ghlVariants||[],width:a.width,height:a.height,alt:a.alt}))};
  if (/<\/script/i.test(app) || /<\/style/i.test(css)) throw new Error('Unsafe closing tag in inline source.');
  const shell = (await read('src/shell.html')).replace('__CORE_DATA__',jsonForHTML({site:data.site,locales:data.locales,media:runtimeMedia}));
  const embed = `<!-- CORE generated workspace build. Edit src/, never this file. -->\n<style>\n${css}</style>\n${shell}\n<script>\n${app}\n</script>\n`;
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>CORE workspace preview</title><style>body{margin:0}</style></head><body data-core-standalone="true">${embed}</body></html>\n`;
  const dist = path.join(ROOT,'dist');
  await mkdir(dist,{recursive:true});
  await rm(path.join(dist,'media'),{recursive:true,force:true});
  for (const asset of data.media.assets.filter(a => a.status === 'approved' && a.localPath)) {
    const destination = path.join(dist,asset.localPath);
    await mkdir(path.dirname(destination),{recursive:true});
    await copyFile(path.join(ROOT,asset.localPath),destination);
  }
  let commit = 'uncommitted-workspace';
  try { commit = execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString().trim(); } catch { /* ZIP previews may not include .git. */ }
  const manifest = {name:data.site.name,stage:data.site.stage,mediaProvider:data.site.mediaProvider,selectedAssets:used.size,release,sourceCommit:commit,builtAt:new Date().toISOString(),embedSha256:createHash('sha256').update(embed).digest('hex'),embedBytes:Buffer.byteLength(embed)};
  await writeFile(path.join(dist,'ghl-embed.html'),embed);
  await writeFile(path.join(dist,'index.html'),html);
  await writeFile(path.join(dist,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return {embed,html,manifest};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build({release:process.argv.includes('--release')}).then(({manifest}) => console.log(`Built dist/index.html and dist/ghl-embed.html (${manifest.embedBytes} bytes).`)).catch(error => { console.error(error.message); process.exitCode=1; });
}
