import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';

const source = process.cwd();
function fixture(stale) {
  const dir = mkdtempSync(join(tmpdir(), 'werktag-repair-'));
  const repo = join(dir, 'repo');
  const bare = join(dir, 'remote.git');
  const bin = join(dir, 'bin');
  mkdirSync(repo); mkdirSync(bin); mkdirSync(join(repo, 'scripts')); mkdirSync(join(repo, 'docs'));
  for (const file of ['scripts/open-index-repair-pr.sh', 'scripts/context-index.mjs', 'docs/product-map.md', 'docs/generated-product-index.md']) cpSync(join(source, file), join(repo, file));
  if (stale) writeFileSync(join(repo, 'docs/generated-product-index.md'), 'veraltet\n');
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe', encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '--bare', bare], { stdio: 'pipe' });
  git('init', '-b', 'main'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid');
  git('add', '.'); git('commit', '-m', 'base'); git('remote', 'add', 'origin', bare); git('push', '-u', 'origin', 'main');
  const log = join(dir, 'gh.log');
  writeFileSync(join(bin, 'gh'), `#!/bin/sh\nif [ "$1 $2" = 'pr list' ]; then\n  if [ "\${FAKE_DUPLICATE:-}" = yes ]; then printf 'automation/product-index-existing\\n'; fi\n  exit 0\nfi\nprintf '%s\\n' "$*" >> "$FAKE_GH_LOG"\nwhile [ "$#" -gt 0 ]; do if [ "$1" = --body-file ]; then shift; cp "$1" "$FAKE_GH_LOG.body"; fi; shift; done\n`, { mode: 0o755 });
  return { dir, repo, bare, git, log, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_GH_LOG: log, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' } };
}
function run(f, extra = {}) { return spawnSync('bash', ['scripts/open-index-repair-pr.sh'], { cwd: f.repo, env: { ...f.env, GH_TOKEN: '', ...extra }, encoding: 'utf8' }); }

test('aktueller Index benötigt keinen Token und erzeugt keinen Branch', () => {
  const f = fixture(false);
  try { const r = run(f); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /kein PR erforderlich/); assert.equal(f.git('branch', '--show-current'), 'main'); }
  finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('veralteter Index benötigt Token; offener Reparatur-PR wird nicht überschrieben', () => {
  const f = fixture(true);
  try {
    let r = run(f); assert.notEqual(r.status, 0); assert.match(r.stderr, /TOKEN fehlt/);
    f.git('restore', 'docs/generated-product-index.md');
    r = run(f, { GH_TOKEN: 'test', FAKE_DUPLICATE: 'yes' }); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /bereits offen/); assert.equal(f.git('branch', '--show-current'), 'main');
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('Reparatur-PR enthält ausschließlich den Index und deklariert keinen Designauftrag', () => {
  const f = fixture(true);
  try {
    const r = run(f, { GH_TOKEN: 'test' }); assert.equal(r.status, 0, r.stderr);
    assert.equal(f.git('diff', '--name-only', 'main...HEAD'), 'docs/generated-product-index.md');
    assert.equal(f.git('ls-remote', '--heads', 'origin', 'refs/heads/automation/product-index-123-1').split('\t')[1], 'refs/heads/automation/product-index-123-1');
    assert.match(readFileSync(f.log, 'utf8'), /pr create/);
    assert.match(readFileSync(`${f.log}.body`, 'utf8'), /werktag-design-scope: none/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
