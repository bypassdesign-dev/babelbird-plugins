import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, symlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { hostPaths, saveHostConnection, HOSTS, parseConfig } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/host-config.mjs';

for (const host of ['workbuddy', 'codebuddy', 'claude', 'cursor', 'gemini']) {
  test(`${host}: private additive config preserves comments, unknown settings, accounts and is idempotent`, async () => {
    const home = await mkdtemp(join(tmpdir(), 'babelbird-host-'));
    try {
      const options = { home, env: {} };
      const paths = await hostPaths(host, options);
      await mkdir(dirname(paths.config), { recursive: true });
      const original = host === 'workbuddy' ? '{"theme": "dark", "mcpServers":{"other":{"url":"https://example.org/a//b","custom":true}, "babelBirdPersonal":{"url":"https://example.org/account"}}}\n' : '{\n  // Keep this comment and settings\n  "theme": "dark",\n  "mcpServers": {"other": {"url":"https://example.org/a//b","custom":true}, "babelBirdPersonal":{"url":"https://example.org/account"},},\n}\n';
      await writeFile(paths.config, original);
      const first = await saveHostConnection(host, 'fake-key-one', options);
      assert.equal(first.serverName, 'babelBirdPersonal2');
      const text = await readFile(paths.config, 'utf8');
      if (host === 'workbuddy') assert.doesNotThrow(() => JSON.parse(text));
      else assert.match(text, /Keep this comment and settings/);
      assert.match(text, /"theme": "dark"/);
      const config = parseConfig(text);
      assert.equal(config.mcpServers.other.custom, true);
      assert.equal(config.mcpServers.babelBirdPersonal.url, 'https://example.org/account');
      const server = config.mcpServers[first.serverName];
      assert.equal(server[host === 'gemini' ? 'httpUrl' : 'url'], 'https://www.babel.cc/mcp');
      assert.equal(server.headers.Authorization, 'Bearer fake-key-one');
      if (['workbuddy', 'codebuddy', 'claude'].includes(host)) assert.equal(server.type, 'http');
      const same = await saveHostConnection(host, 'fake-key-one', options);
      assert.equal(same.reused, true);
      assert.equal(await readFile(paths.config, 'utf8'), text);
      const second = await saveHostConnection(host, 'fake-key-two', options);
      assert.equal(second.serverName, 'babelBirdPersonal3');
      assert.ok(!(JSON.stringify(second).includes('fake-key')));
      if (process.platform !== 'win32') assert.equal((await stat(paths.config)).mode & 0o777, 0o600);
    } finally { await rm(home, { recursive: true, force: true }); }
  });
}

test('host locations respect user overrides and WorkBuddy never targets its generated .mcp.json', async () => {
  assert.deepEqual(Object.keys(HOSTS), ['codex', 'workbuddy', 'codebuddy', 'claude', 'cursor', 'gemini']);
  const wb = await hostPaths('workbuddy', { home: '/tmp/user', env: { WORKBUDDY_CONFIG_DIR: '/tmp/wb' } });
  assert.equal(wb.config, '/tmp/wb/mcp.json');
  assert.equal(wb.skills, '/tmp/wb/skills');
  const claude = await hostPaths('claude', { home: '/tmp/user', env: { CLAUDE_CONFIG_DIR: '/tmp/cc' } });
  assert.equal(claude.config, '/tmp/cc/.claude.json');
  assert.equal(claude.skills, '/tmp/cc/skills');
  await assert.rejects(hostPaths('guess'), /host|宿主/);
});

test('WorkBuddy rejects JSONC which its desktop loader silently ignores', async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-wb-json-'));
  try {
    const options = { home, env: {} }, { config } = await hostPaths('workbuddy', options);
    await mkdir(dirname(config), { recursive: true });
    for (const text of ['{"mcpServers":{},}', '{/*comment*/"mcpServers":{}}']) {
      await writeFile(config, text);
      await assert.rejects(saveHostConnection('workbuddy', 'fake', options));
      assert.equal(await readFile(config, 'utf8'), text);
    }
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('CodeBuddy uses first existing user config rather than hiding an older account', async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-priority-'));
  try {
    await writeFile(join(home, '.codebuddy.json'), '{"mcpServers":{}}');
    const options = { home, env: {} };
    assert.equal((await hostPaths('codebuddy', options)).config, join(home, '.codebuddy.json'));
    await mkdir(join(home, '.codebuddy'));
    await writeFile(join(home, '.codebuddy/mcp.json'), '{}');
    assert.equal((await hostPaths('codebuddy', options)).config, join(home, '.codebuddy/mcp.json'));
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('invalid config, duplicate keys, non-object servers and symlinks fail without overwriting', async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-invalid-'));
  const options = { home, env: {} };
  try {
    const { config } = await hostPaths('cursor', options);
    await mkdir(dirname(config), { recursive: true });
    for (const bad of ['{bad', '{"mcpServers":[]}', '{"mcpServers":{},"mcpServers":{}}']) {
      await writeFile(config, bad);
      await assert.rejects(saveHostConnection('cursor', 'fake', options));
      assert.equal(await readFile(config, 'utf8'), bad);
    }
    await rm(config);
    const target = join(home, 'target.json');
    await writeFile(target, '{}');
    await symlink(target, config);
    await assert.rejects(saveHostConnection('cursor', 'fake', options));
    assert.equal(await readFile(target, 'utf8'), '{}');
  } finally { await rm(home, { recursive: true, force: true }); }
});
