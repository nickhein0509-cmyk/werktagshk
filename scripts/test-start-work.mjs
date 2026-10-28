import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./start-work.mjs', import.meta.url));
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'werktag-start-work-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const origin = path.join(root, 'origin.git'), seed = path.join(root, 'seed'), repo = path.join(root, 'repo');
  mkdirSync(seed);
  git(root, 'init', '--bare', '--initial-branch=main', origin);
  git(seed, 'init', '--initial-branch=main');
  git(seed, 'config', 'user.name', 'Fixture');
  git(seed, 'config', 'user.email', 'fixture@example.invalid');
  writeFileSync(path.join(seed, 'note.txt'), 'basis\n');
  git(seed, 'add', 'note.txt'); git(seed, 'commit', '-m', 'basis');
  git(seed, 'remote', 'add', 'origin', origin); git(seed, 'push', 'origin', 'main');
  git(root, 'clone', '--local', origin, repo);
  return { root, seed, repo, origin, target: path.join(root, 'new task'), run: (...args) => spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' }) };
}

test('new worktree uses fresh remote main and preserves original dirty work and main', t => {
  const f = fixture(t), oldMain = git(f.repo, 'rev-parse', 'main');
  writeFileSync(path.join(f.seed, 'note.txt'), 'neu\n');
  git(f.seed, 'commit', '-am', 'remote update'); git(f.seed, 'push', 'origin', 'main');
  const fresh = git(f.seed, 'rev-parse', 'HEAD');
  writeFileSync(path.join(f.repo, 'note.txt'), 'eigene offene Änderung\n');
  writeFileSync(path.join(f.repo, 'untracked.txt'), 'nicht verlieren\n');
  const before = git(f.repo, 'status', '--porcelain');
  const result = f.run('feat/new-task', f.target);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).base, fresh);
  assert.equal(git(f.target, 'rev-parse', 'HEAD'), fresh);
  assert.equal(git(f.target, 'branch', '--show-current'), 'feat/new-task');
  assert.equal(readFileSync(path.join(f.target, 'note.txt'), 'utf8'), 'neu\n');
  assert.equal(git(f.repo, 'rev-parse', 'main'), oldMain);
  assert.equal(git(f.repo, 'branch', '--show-current'), 'main');
  assert.equal(git(f.repo, 'status', '--porcelain'), before);
  assert.equal(readFileSync(path.join(f.repo, 'untracked.txt'), 'utf8'), 'nicht verlieren\n');
});

test('dry run neither fetches a newer main nor creates branch or directory', t => {
  const f = fixture(t), before = git(f.repo, 'show-ref');
  writeFileSync(path.join(f.seed, 'note.txt'), 'new remote\n');
  git(f.seed, 'commit', '-am', 'new'); git(f.seed, 'push', 'origin', 'main');
  const result = f.run('--dry-run', 'fix/check-only', f.target);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /kein Fetch/);
  assert.equal(git(f.repo, 'show-ref'), before);
  assert.equal(existsSync(f.target), false);
});

test('existing local branch and existing target are refused without overwriting either', t => {
  const f = fixture(t);
  git(f.repo, 'branch', 'feat/existing');
  const existing = f.run('feat/existing', f.target);
  assert.equal(existing.status, 1); assert.equal(existsSync(f.target), false);
  mkdirSync(f.target); writeFileSync(path.join(f.target, 'keep.txt'), 'keep');
  const target = f.run('feat/new', f.target);
  assert.equal(target.status, 1);
  assert.equal(readFileSync(path.join(f.target, 'keep.txt'), 'utf8'), 'keep');
  assert.throws(() => git(f.repo, 'rev-parse', '--verify', 'refs/heads/feat/new'));
});

test('a task branch already published by another chat is refused', t => {
  const f = fixture(t);
  git(f.seed, 'branch', 'feat/other-chat'); git(f.seed, 'push', 'origin', 'feat/other-chat');
  const result = f.run('feat/other-chat', f.target);
  assert.equal(result.status, 1); assert.match(result.stderr, /bereits auf GitHub\/Remote/);
  assert.equal(existsSync(f.target), false);
  assert.throws(() => git(f.repo, 'rev-parse', '--verify', 'refs/heads/feat/other-chat'));
});

test('main, relative targets and nested worktrees cannot start a task', t => {
  const f = fixture(t);
  for (const args of [['main', f.target], ['feat/new', 'relative'], ['feat/new', path.join(f.repo, 'nested')], ['feat/bad..name', f.target]]) {
    const result = f.run(...args); assert.equal(result.status, 1);
  }
  assert.equal(existsSync(f.target), false);
  assert.equal(existsSync(path.join(f.repo, 'nested')), false);
});

test('unreachable origin fails closed and does not print a credential-bearing URL', t => {
  const f = fixture(t);
  git(f.repo, 'remote', 'set-url', 'origin', 'https://sensitive:do-not-print@127.0.0.1:1/unreachable.git');
  const result = f.run('feat/offline', f.target);
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stderr, /sensitive|do-not-print/);
  assert.equal(existsSync(f.target), false);
  assert.throws(() => git(f.repo, 'rev-parse', '--verify', 'refs/heads/feat/offline'));
});

test('a symlink cannot hide a nested target inside an existing worktree', t => {
  const f = fixture(t), alias = path.join(f.root, 'alias');
  symlinkSync(f.repo, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const result = f.run('feat/hidden-nested', path.join(alias, 'nested'));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /außerhalb bestehender Arbeitskopien/);
  assert.equal(existsSync(path.join(f.repo, 'nested')), false);
});
