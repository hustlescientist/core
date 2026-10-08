import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {loadProject,validate,keyShape,jsonForHTML,https,read} from '../scripts/lib.mjs';
import {build} from '../scripts/build.mjs';
test('starter configuration validates',async () => { await validate(await loadProject()); });
test('English and Spanish have identical key structures',async () => { const {locales}=await loadProject(); assert.deepEqual(keyShape(locales.en),keyShape(locales.es)); });
test('every navigation item has a public page',async () => { const {locales}=await loadProject(); for(const locale of Object.values(locales)) for(const id of Object.keys(locale.nav)) assert.ok(locale.pages[id],id); });
test('each program has its own stable route in both languages',async () => { const {locales}=await loadProject(); assert.deepEqual(locales.en.programs.map(p=>p.id),locales.es.programs.map(p=>p.id)); assert.equal(new Set(locales.en.programs.map(p=>p.id)).size,3); });
test('script payload cannot terminate its data element',() => { const out=jsonForHTML({value:'</script><script>alert(1)</script>'}); assert.equal(out.includes('<'),false); assert.equal(JSON.parse(out).value,'</script><script>alert(1)</script>'); });
test('integration URLs reject dangerous schemes and embedded credentials',() => { assert.equal(https('javascript:alert(1)'),false); assert.equal(https('https://user:pass@example.org'),false); assert.equal(https('https://example.org/member'),true); });
test('unsafe configuration is rejected',async () => { const data=await loadProject(); data.site.integrations.portalUrl='javascript:alert(1)'; await assert.rejects(()=>validate(data),/HTTPS/); });
test('unapproved starter cannot produce a release build',async () => { const data=await loadProject(); await assert.rejects(()=>validate(data,true),/Release approval missing/); });
test('approved media requires evidence and alternatives',async () => { const data=await loadProject(); data.media.assets[0].status='approved'; await assert.rejects(()=>validate(data),/Approved media lacks/); });
test('duplicate media IDs fail validation',async () => { const data=await loadProject(); data.media.assets.push({...data.media.assets[0]}); await assert.rejects(()=>validate(data),/Duplicate media/); });
test('media traversal cannot enter the build',async () => { const data=await loadProject(); data.media.assets[0].localPath='media/images/../../private/records.json'; await assert.rejects(()=>validate(data),/Unsafe media path/); });
test('browser application parses as a classic script',async () => { new vm.Script(await read('src/js/app.js')); });
test('build generates a self-contained GHL code element and noindex preview',async () => { const {embed,html}=await build(); assert.match(embed,/id="core-app"/); assert.match(embed,/hydrationDone/); assert.doesNotMatch(embed,/__CORE_DATA__/); assert.doesNotMatch(embed,/<html|<body|type="module"|src="\/src\//); assert.match(html,/noindex,nofollow/); const payload=embed.match(/data-core-payload>([\s\S]*?)<\/script>/)[1]; assert.equal(JSON.parse(payload).site.name,'CORE'); });

async function resolver() {
  const sandbox={URL};
  vm.runInNewContext(await read('src/js/media.js'),sandbox);
  return sandbox.COREMedia.resolve;
}
const exampleMedia = () => ({id:'test',label:'Original archive label',kind:'image',status:'review',sourceUrl:'https://example.org/original.jpg',ghlUrl:'https://cdn.example.org/ghl.jpg',sourceVariants:[{url:'https://example.org/small.jpg',width:768}],ghlVariants:[],width:1600,height:900,alt:{en:'An activity',es:'Una actividad'}});
test('original hosting is the default even when a GHL URL exists',async()=>{const resolve=await resolver();assert.equal(resolve(exampleMedia()).src,'https://example.org/original.jpg');});
test('GHL mode uses only GHL URLs, without a stale original srcset',async()=>{const resolve=await resolver();const m=resolve(exampleMedia(),'ghl');assert.equal(m.src,'https://cdn.example.org/ghl.jpg');assert.equal(m.srcset,'');});
test('partial GHL migration falls back to the original asset',async()=>{const resolve=await resolver();const a=exampleMedia();a.ghlUrl='';const m=resolve(a,'ghl');assert.equal(m.provider,'original');assert.match(m.srcset,/example.org\/small.jpg 768w/);});
test('GHL responsive variants are provider-specific',async()=>{const resolve=await resolver();const a=exampleMedia();a.ghlVariants=[{url:'https://cdn.example.org/ghl-small.jpg',width:768}];const m=resolve(a,'ghl');assert.match(m.srcset,/ghl-small.jpg 768w/);assert.doesNotMatch(m.srcset,/\/original.jpg|\/small.jpg/);});
test('media alternatives switch languages without changing IDs or labels',async()=>{const resolve=await resolver();const m=resolve(exampleMedia(),'original','es');assert.equal(m.alt,'Una actividad');assert.equal(m.id,'test');assert.equal(m.label,'Original archive label');});
test('unsafe GHL URLs cannot replace the original asset at runtime',async()=>{const resolve=await resolver();const a=exampleMedia();a.ghlUrl='javascript:alert(1)';assert.equal(resolve(a,'ghl').provider,'original');});
test('needed or retired assets cannot be rendered',async()=>{const resolve=await resolver();const a=exampleMedia();a.status='retired';assert.equal(resolve(a),null);assert.equal(resolve(undefined),null);});
test('all 534 source records are retained byte-for-byte in the metadata archive',async()=>{const {loadCatalog}=await import('../scripts/lib.mjs');const {media}=await loadProject();const c=await loadCatalog();assert.equal(c.rows.length,534);assert.equal(c.sha256,media.archive.catalogSha256);});
test('used media bindings resolve to the 16 selected assets',async()=>{const {bindingIds}=await import('../scripts/lib.mjs');const {media}=await loadProject();const ids=new Set(bindingIds(media.bindings));assert.equal(ids.size,16);for(const id of ids)assert.ok(media.assets.some(a=>a.id===id),id);});
test('changing archive labels fails validation',async()=>{const data=await loadProject();data.media.assets[0].label='A guessed label';await assert.rejects(()=>validate(data),/Source label or URL changed/);});
test('invalid GHL media URLs fail validation',async()=>{const data=await loadProject();data.media.assets[0].ghlUrl='http://example.org/logo.png';await assert.rejects(()=>validate(data),/Invalid media ghlUrl/);});
test('missing media bindings fail validation',async()=>{const data=await loadProject();data.media.bindings.homeHero='unknown';await assert.rejects(()=>validate(data),/Media binding points to missing/);});
test('provider configuration rejects unsupported hosting modes',async()=>{const data=await loadProject();data.site.mediaProvider='private-github';await assert.rejects(()=>validate(data),/Media provider/);});
test('development permission is not treated as production media approval',async()=>{const data=await loadProject();data.site.stage='production';await assert.rejects(()=>validate(data),/Used media needs production approval/);});
test('runtime payload contains selected hosted images, not the whole archive or font binaries',async()=>{const {embed}=await build();const payload=JSON.parse(embed.match(/data-core-payload>([\s\S]*?)<\/script>/)[1]);assert.equal(payload.media.assets.length,16);assert.equal(payload.site.mediaProvider,(await loadProject()).site.mediaProvider);assert.ok(payload.media.assets.every(a=>a.sourceUrl.startsWith('https://corewecan.org/wp-content/uploads/')));assert.doesNotMatch(embed,/data:image|fontawesome-webfont|\.woff2|__CORE_DATA__/);});

test('source enrichment exposes 30 bilingual public routes',async()=>{const {locales}=await loadProject();assert.equal(Object.keys(locales.en.pages).length,30);assert.deepEqual(Object.keys(locales.en.pages).sort(),Object.keys(locales.es.pages).sort());});
test('every enriched page retains a source URL and related routes resolve',async()=>{const {locales}=await loadProject();for(const locale of Object.values(locales)){for(const [id,page] of Object.entries(locale.pages)){assert.equal(https(page.sourcePath),true,id);for(const related of page.related||[])assert.ok(locale.pages[related],id+' -> '+related);}}});
test('source-rich structural content is retained',async()=>{const {locales}=await loadProject();for(const l of Object.values(locales)){assert.equal(l.pages.about.people.length,14);assert.equal(l.pages.about.board.length,8);assert.equal(l.pages.faq.faqs.length,9);assert.ok(l.pages.history.timeline.length>=7);}});
test('past and unresolved source pages are labeled without fabrication',async()=>{const {locales}=await loadProject();assert.match(locales.en.pages['jingle-in-july'].status,/Past event/);assert.match(locales.en.pages.score.status,/review/i);assert.match(locales.es.pages.score.status,/revisi/i);});
