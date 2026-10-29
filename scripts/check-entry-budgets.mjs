import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

// Follow static dependencies only. Lazy routes are measured separately, and
// shared chunks are counted once even when several import paths reach them.
export function staticEntries(manifest, roots) {
  const seen = new Set();
  function visit(key) {
    if (seen.has(key)) return;
    const entry = manifest[key];
    if (!entry) throw new Error(`Missing build entry: ${key}`);
    seen.add(key);
    for (const dependency of entry.imports ?? []) visit(dependency);
  }
  roots.forEach(visit);
  return [...seen].map((key) => manifest[key]);
}

export function entryReport(manifest, readAsset) {
  for (const route of ['src/App.tsx', 'src/components/AccountPage.tsx']) {
    if (!manifest[route]?.isDynamicEntry) throw new Error(`Route is no longer lazy: ${route}`);
  }
  return [
    { route: '/projekte', roots: ['index.html'], limitKiB: 90 },
    { route: '/konto', roots: ['index.html', 'src/components/AccountPage.tsx'], limitKiB: 160 },
  ].map(({ route, roots, limitKiB }) => {
    const entries = staticEntries(manifest, roots);
    if (entries.some((entry) => entry.src === 'src/App.tsx' || entry.name === 'practice-content')) {
      throw new Error(`${route} loads learning content`);
    }
    if (route === '/projekte' && entries.some((entry) => entry.name === 'supabase' || entry.src === 'src/components/AccountPage.tsx')) {
      throw new Error('Project chooser loads account initialization');
    }
    const files = [...new Set(entries.map((entry) => entry.file))].filter((file) => file.endsWith('.js'));
    const gzipBytes = files.reduce((sum, file) => sum + gzipSync(readAsset(file)).length, 0);
    if (gzipBytes > limitKiB * 1024) {
      throw new Error(`${route}: ${gzipBytes} gzip bytes exceed ${limitKiB} KiB`);
    }
    return { route, files: files.length, gzipBytes, limitKiB };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const output = resolve('dist');
  const manifest = JSON.parse(readFileSync(resolve(output, '.vite/manifest.json'), 'utf8'));
  console.log(JSON.stringify(entryReport(manifest, (file) => readFileSync(resolve(output, file))), null, 2));
}
