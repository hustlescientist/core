import {execFileSync} from 'node:child_process';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {ROOT, filesIn, loadProject, validate} from './lib.mjs';
try {
  await validate(await loadProject());
  const files = [...await filesIn('src'),...await filesIn('scripts'),...await filesIn('tests'),...await filesIn('media')];
  for (const file of files) {
    if (/\.(js|mjs)$/.test(file)) execFileSync(process.execPath,['--check',path.join(ROOT,file)],{stdio:'pipe'});
    if ((await stat(path.join(ROOT,file))).size > 5*1024*1024) throw new Error(`File exceeds the 5 MiB workspace budget: ${file}`);
  }
  console.log(`Syntax, bilingual configuration, media register, and file-size checks passed (${files.length} files).`);
} catch (error) { console.error(error.message); process.exitCode=1; }
