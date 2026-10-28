import { execFile } from 'node:child_process';
import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const usage = 'Aufruf: node scripts/start-work.mjs [--dry-run] <feat|fix|chore|docs/aufgabe> <absoluter-worktree-pfad>';
const fail = message => { throw new Error(message); };

async function git(args, { allowMissing = false } = {}) {
  try {
    return (await exec('git', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 })).stdout.trim();
  } catch (error) {
    if (allowMissing && error.code === 1) return null;
    // Git's raw stderr can contain credentials in a configured remote URL.
    fail('Git-Schritt fehlgeschlagen: ' + args.slice(0, 2).join(' ') + '. Bestehende Arbeit bleibt erhalten.');
  }
}

async function exists(target) {
  try { await lstat(target); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function inside(target, root) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

async function canonicalTarget(target) {
  const tail = [];
  let parent = target;
  while (!(await exists(parent))) {
    tail.unshift(path.basename(parent));
    const next = path.dirname(parent);
    if (next === parent) fail('Der Zielpfad hat keinen erreichbaren Elternordner.');
    parent = next;
  }
  return path.resolve(await realpath(parent), ...tail);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log(usage); return; }
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(arg => arg !== '--dry-run');
  if (positional.length !== 2 || args.filter(arg => arg === '--dry-run').length > 1) fail(usage);
  const [branch, input] = positional;
  if (!/^(feat|fix|chore|docs)\/[a-z0-9][a-z0-9._-]*$/.test(branch)) fail('Einen eindeutigen Aufgabenbranch wie feat/kartenfilter-20261028 verwenden.');
  await git(['check-ref-format', '--branch', branch]);
  if (!path.isAbsolute(input)) fail('Der neue Worktree benötigt einen absoluten Zielpfad.');
  const target = path.resolve(input);
  const repo = await git(['rev-parse', '--show-toplevel']);
  const worktrees = (await git(['worktree', 'list', '--porcelain', '-z'])).split('\0').filter(item => item.startsWith('worktree ')).map(item => path.resolve(item.slice(9)));
  if (await exists(target)) fail('Der Zielpfad existiert bereits; er wird nicht verändert.');
  const canonical = await canonicalTarget(target);
  const roots = await Promise.all(worktrees.map(root => realpath(root)));
  if (roots.some(root => inside(canonical, root))) fail('Das Ziel muss außerhalb bestehender Arbeitskopien liegen.');
  if (await git(['show-ref', '--verify', '--quiet', 'refs/heads/' + branch], { allowMissing: true }) !== null) fail('Der Aufgabenbranch existiert bereits; einen neuen Namen verwenden.');

  if (dryRun) {
    console.log('Vorschau: kein Fetch, kein neuer Branch und keine Dateiänderung.');
    console.log('Repository: ' + repo);
    console.log('Remote-Branch prüfen: git ls-remote --heads origin refs/heads/' + branch);
    console.log('Frische Basis laden: git fetch --no-tags origin refs/heads/main:refs/remotes/origin/main');
    console.log('Danach neuer Branch: ' + branch + '; Worktree: ' + target);
    return;
  }

  const remoteBranch = await git(['ls-remote', '--heads', 'origin', 'refs/heads/' + branch]);
  if (remoteBranch) fail('Der Aufgabenbranch existiert bereits auf GitHub/Remote; einen neuen Namen verwenden.');
  await git(['fetch', '--no-tags', 'origin', 'refs/heads/main:refs/remotes/origin/main']);
  const base = await git(['rev-parse', '--verify', 'refs/remotes/origin/main^{commit}']);
  await git(['worktree', 'add', '-b', branch, '--', target, base]);
  console.log(JSON.stringify({ branch, base, worktree: target, published: false }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
