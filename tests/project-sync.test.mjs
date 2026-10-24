import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm, chmod, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const { planSync, scanProject, bindProject, readBinding, recordVerified, readState, safePath, transferUrl, run } = await import('../plugins/babelbird-cloud/skills/babelbird-project-cloud/scripts/project-sync.mjs');
  const remote = (fileId, version = 0) => ({ fileId, version, mtime: version + 1, size: 3 });
  const local = (path, sha256) => ({ path, sha256, md5: '0'.repeat(32), size: 3 });
  const sha = 'a'.repeat(64), changed = 'b'.repeat(64);
  const baseline = { 'a.txt': { sha256: sha, remote: remote('123') } };
  test('local-only edits upload while remote-only edits download', () => {
    assert.equal(planSync([local('a.txt', changed)], [{ path: 'a.txt', ...remote('123') }], baseline)[0].action, 'upload');
    assert.equal(planSync([local('a.txt', sha)], [{ path: 'a.txt', ...remote('123', 1) }], baseline)[0].action, 'download');
  });
  test('concurrent edits and untracked different files conflict', () => {
    assert.equal(planSync([local('a.txt', changed)], [{ path: 'a.txt', ...remote('123', 1) }], baseline)[0].action, 'conflict');
    assert.equal(planSync([local('a.txt', changed)], [{ path: 'a.txt', ...remote('123'), sha256: sha }], {})[0].action, 'conflict');
  });
  test('verified remote hashes detect edits even when metadata does not change', () => {
    const cloud = { path: 'a.txt', ...remote('123'), sha256: 'c'.repeat(64) };
    assert.equal(planSync([local('a.txt', changed)], [cloud], baseline)[0].action, 'conflict');
    assert.equal(planSync([local('a.txt', sha)], [cloud], baseline)[0].action, 'download');
    assert.equal(planSync([local('a.txt', changed)], [{ ...cloud, version: undefined, mtime: undefined }], baseline)[0].action, 'conflict');
  });
  test('cross-device case and Unicode collisions stop planning', () => {
    for (const [a, b] of [['readme.md', 'README.md'], ['é.txt', 'e\u0301.txt'], ['src/a.js', 'SRC/b.js']]) {
      assert.throws(() => planSync([local(a, sha)], [{ path: b, ...remote('123') }], {}), /colliding/i);
    }
  });
  test('new device inspects same-name files before adopting a baseline', () => {
    assert.equal(planSync([local('a.txt', sha)], [{ path: 'a.txt', ...remote('123') }], {})[0].action, 'inspect');
    assert.equal(planSync([local('a.txt', sha)], [{ path: 'a.txt', ...remote('123'), sha256: sha }], {})[0].action, 'record');
  });
  test('new local and remote files transfer but deletions do not propagate', () => {
    assert.equal(planSync([local('new.txt', sha)], [], {})[0].action, 'upload');
    assert.equal(planSync([], [{ path: 'new.txt', ...remote('456') }], {})[0].action, 'download');
    assert.equal(planSync([], [{ path: 'a.txt', ...remote('123') }], baseline)[0].action, 'conflict');
    assert.equal(planSync([local('a.txt', sha)], [], baseline)[0].action, 'conflict');
  });
  test('unchanged files skip and duplicate remote paths are rejected', () => {
    assert.equal(planSync([local('a.txt', sha)], [{ path: 'a.txt', ...remote('123') }], baseline)[0].action, 'skip');
    assert.throws(() => planSync([], [{ path: 'a.txt', ...remote('1') }, { path: 'a.txt', ...remote('2') }], {}), /duplicate/i);
  });
  test('scan excludes credentials, state, caches and symlinks', async () => {
    const root = await mkdtemp(join(tmpdir(), 'babelbird-scan-'));
    try {
      await mkdir(join(root, 'src')); await writeFile(join(root, 'src/app.js'), 'abc');
      await writeFile(join(root, '.env'), 'secret'); await writeFile(join(root, 'private.pem'), 'secret');
      await writeFile(join(root, '.babelbird-sync.json'), '{}'); await mkdir(join(root, 'node_modules'));
      await writeFile(join(root, 'node_modules/cache.js'), 'cache'); await symlink(join(root, 'src'), join(root, 'alias'));
      const result = await scanProject(root);
      assert.deepEqual(result.files.map(file => file.path), ['src/app.js']);
      assert.equal(result.files[0].sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      assert.ok(result.excluded.length >= 5);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  test('binding another platform retains the selected cloud project and user rules', async () => {
    const root = await mkdtemp(join(tmpdir(), 'babelbird-bind-'));
    try {
      await writeFile(join(root, 'AGENTS.md'), '# Existing instructions\n');
      const cloud = { endpoint: 'https://www.babel.cc/mcp', folderId: '123', path: '/个人文件/codex/site' };
      await bindProject(root, cloud, 'workbuddy');
      assert.deepEqual((await readBinding(root)).cloud, cloud);
      assert.ok((await readFile(join(root, 'AGENTS.md'), 'utf8')).startsWith('# Existing instructions\n'));
      assert.ok(existsSync(join(root, '.codebuddy/rules/babelbird-sync.md')));
      await assert.rejects(bindProject(root, { ...cloud, folderId: '999' }, 'codex'), /already bound/i);
      await writeFile(join(root, 'a.txt'), 'abc');
      const digest = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
      await assert.rejects(recordVerified(root, 'a.txt', '0'.repeat(64), remote('123')), /digest/i);
      await recordVerified(root, 'a.txt', digest, remote('123'));
      assert.equal((await readState(root)).files['a.txt'].sha256, digest);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  test('unsafe remote paths and unverified HTTP transfer hosts fail closed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'babelbird-path-'));
    try {
      for (const path of ['../escape', '/absolute', 'C:/secret', 'x/../../secret', 'x\\evil']) await assert.rejects(safePath(root, path));
      await symlink(tmpdir(), join(root, 'outside')); await assert.rejects(safePath(root, 'outside/file'));
      assert.equal(transferUrl('http://document.babel.cc/api/file/uploadFileCTPdf.do').protocol, 'https:');
      assert.equal(transferUrl('http://document.babel.cc/api/file/uploadFile.do').protocol, 'https:');
      assert.throws(() => transferUrl('http://unverified.example/upload'), /HTTPS/);
    } finally { await rm(root, { recursive: true, force: true }); }
  });

test('binding a Git subdirectory respects parent ignores and keeps tracked project config', async () => {
  const root = await mkdtemp(join(tmpdir(), 'babelbird-subproject-'));
  const project = join(root, 'packages/app');
  const git = args => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  try {
    git(['init', '--quiet']);
    await mkdir(project, { recursive: true });
    await writeFile(join(root, '.gitignore'), 'private-settings.json\nignored/\n');
    await writeFile(join(project, 'private-settings.json'), 'excluded fixture');
    await mkdir(join(project, 'ignored'));
    await writeFile(join(project, 'ignored/config.json'), 'excluded fixture');
    await writeFile(join(project, '.mcp.json'), '{"fixture":true}');
    await writeFile(join(project, 'tracked.json'), '{}');
    git(['add', 'packages/app/tracked.json']);
    await writeFile(join(root, '.gitignore'), 'private-settings.json\nignored/\ntracked.json\n');
    const result = await scanProject(project);
    assert.deepEqual(result.files.map(file => file.path), ['.mcp.json', 'tracked.json']);
    assert.ok(result.excluded.some(file => file.path === 'private-settings.json' && file.reason === 'git-ignored'));
  } finally { await rm(root, { recursive: true, force: true }); }
});

for (const mode of [0o755, 0o700, 0o600, 0o644]) {
  test(`cloud updates preserve existing ${mode.toString(8)} permissions`, { skip: process.platform === 'win32' }, async t => {
    const root = await mkdtemp(join(tmpdir(), 'babelbird-mode-'));
    t.mock.method(globalThis, 'fetch', async () => new Response('updated'));
    try {
      const file = join(root, 'file');
      await writeFile(file, 'original');
      await chmod(file, mode);
      await run({ action: 'download', root, path: 'file', url: 'https://transfer.example/file', mode: '0755', expectedLocalSha256: createHash('sha256').update('original').digest('hex') });
      assert.equal(await readFile(file, 'utf8'), 'updated');
      assert.equal((await stat(file)).mode & 0o777, mode);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}

test('new downloads can restore a known mode and reject special permission bits', { skip: process.platform === 'win32' }, async t => {
  const root = await mkdtemp(join(tmpdir(), 'babelbird-new-mode-'));
  t.mock.method(globalThis, 'fetch', async () => new Response('downloaded'));
  try {
    for (const [path, mode, expected] of [['run.sh', '0755', 0o755], ['private.json', '0600', 0o600]]) {
      await run({ action: 'download', root, path, url: 'https://transfer.example/file', mode });
      assert.equal((await stat(join(root, path))).mode & 0o777, expected);
    }
    for (const mode of ['4755', '755x', 755, null]) {
      await assert.rejects(run({ action: 'download', root, path: 'invalid', url: 'https://transfer.example/file', mode }), /mode/i);
      assert.equal(existsSync(join(root, 'invalid')), false);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a download never overwrites a changed local file or changes its permissions', { skip: process.platform === 'win32' }, async t => {
  const root = await mkdtemp(join(tmpdir(), 'babelbird-download-conflict-'));
  t.mock.method(globalThis, 'fetch', async () => new Response('cloud'));
  try {
    const file = join(root, 'run.sh');
    await writeFile(file, 'local changes');
    await chmod(file, 0o700);
    await assert.rejects(run({ action: 'download', root, path: 'run.sh', url: 'https://transfer.example/file', expectedLocalSha256: '0'.repeat(64) }), /changed/);
    assert.equal(await readFile(file, 'utf8'), 'local changes');
    assert.equal((await stat(file)).mode & 0o777, 0o700);
  } finally { await rm(root, { recursive: true, force: true }); }
});
