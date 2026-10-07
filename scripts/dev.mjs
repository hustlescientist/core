import {createServer} from 'node:http';
import {readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {ROOT} from './lib.mjs';
import {build} from './build.mjs';
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be between 1024 and 65535.');
const dist = path.join(ROOT,'dist');
let queue = Promise.resolve();
const types = {'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.pdf':'application/pdf'};
const server = createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url,`http://127.0.0.1:${port}`);
    const name = decodeURIComponent(url.pathname);
    // Only generated output is served; never serve .git, source notes, or env files.
    if (!['/','/index.html','/ghl-embed.html','/build-manifest.json'].includes(name) && !name.startsWith('/media/')) { res.writeHead(404); res.end('Not found'); return; }
    if (name === '/' || name === '/index.html' || name === '/ghl-embed.html') { queue = queue.catch(() => {}).then(() => build()); await queue; }
    const candidate = path.resolve(dist,'.'+(name === '/' ? '/index.html' : name));
    const resolved = await realpath(candidate);
    if (!resolved.startsWith(dist+path.sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(resolved);
    res.writeHead(200,{'Content-Type':types[path.extname(resolved)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500,{'Content-Type':'text/plain'}); res.end(error.code === 'ENOENT' ? 'Not found' : 'Preview build failed. Check the terminal.'); if (error.code !== 'ENOENT') console.error(error); }
});
await build();
server.on('error',error => { console.error(error.message); process.exitCode=1; });
server.listen(port,'127.0.0.1',() => console.log(`CORE preview: http://127.0.0.1:${port}\nRefresh after editing src/. Local only; not a production server.`));
