import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyConnection } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/mcp-check.mjs';
import { saveCodexConnection } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/codex-config.mjs';

function mockMcp({ sse = false, businessError = false } = {}) {
  const requests = [];
  const fetchImpl = async (url, options) => {
    const request = JSON.parse(options.body);
    requests.push({ request, options, url });
    if (!request.id) return new Response(null, { status: 202 });
    const result = request.method === 'initialize'
      ? { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'test', version: '1' } }
      : { content: [{ type: 'text', text: JSON.stringify(businessError ? { code: 403, success: false } : { code: 0, success: true, fileInfo: { type: 2, fileId: '42' } }) }] };
    const body = JSON.stringify({ jsonrpc: '2.0', id: request.id, result });
    return new Response(sse ? `event: message\ndata: ${body}\n\n` : body, { headers: { 'content-type': sse ? 'text/event-stream' : 'application/json', 'mcp-session-id': 'session-test' } });
  };
  return { fetchImpl, requests };
}

for (const sse of [false, true]) test(`readonly verification accepts ${sse ? 'SSE' : 'JSON'} and passes returned folder ID`, async () => {
  const mock = mockMcp({ sse });
  assert.deepEqual(await verifyConnection('test-key', mock), { directoryRead: true, listRead: true });
  assert.deepEqual(mock.requests.map(r => r.request.method), ['initialize', 'notifications/initialized', 'tools/call', 'tools/call']);
  assert.deepEqual(mock.requests.at(-1).request.params, { name: 'listFolder', arguments: { fileId: '42', pageIndex: 0, pageSize: 1 } });
  assert.ok(mock.requests.every(r => r.url === 'https://www.babel.cc/mcp' && r.options.redirect === 'error'));
});

test('failed business response never passes even with HTTP 200', async () => {
  await assert.rejects(verifyConnection('test-key', mockMcp({ businessError: true })), error => error.code === 'permission');
});

test('unauthorized, closed stream, timeout and malformed keys have safe errors', async () => {
  await assert.rejects(verifyConnection('test-key', { fetchImpl: async () => new Response('', { status: 401 }) }), error => error.code === 'unauthorized');
  await assert.rejects(verifyConnection('test-key', { fetchImpl: async () => new Response('event: ping\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } }) }), error => error.code === 'connection');
  await assert.rejects(verifyConnection('test-key', { fetchImpl: async () => { throw new DOMException('timed out', 'TimeoutError'); } }), error => error.code === 'timeout');
  for (const key of ['', '   ', 'Bearer wrong', 'invalid\nkey']) await assert.rejects(verifyConnection(key), error => error.code === 'invalid_key');
});

test('native Codex writes preserve config, reuse same key, and retain a different account', { timeout: 90000 }, async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-config-test-'));
  try {
    const path = join(home, 'config.toml');
    await writeFile(path, '# Keep my comment\nmodel = "gpt-6-astra"\n[mcp_servers.other]\nurl = "https://example.com/mcp"\n[mcp_servers.babelBirdPersonal]\nurl = "https://example.com/another-account"\n', { mode: 0o600 });
    const options = { codexHome: home };
    const first = await saveCodexConnection('fake-test-key-one', options);
    assert.equal(first.serverName, 'babelBirdPersonal2');
    assert.equal(first.reused, false);
    const same = await saveCodexConnection('fake-test-key-one', options);
    assert.equal(same.serverName, first.serverName);
    assert.equal(same.reused, true);
    const second = await saveCodexConnection('fake-test-key-two', options);
    assert.notEqual(second.serverName, first.serverName);
    const content = await readFile(path, 'utf8');
    assert.match(content, /Keep my comment/);
    assert.match(content, /https:\/\/example.com\/mcp/);
    assert.match(content, /https:\/\/example.com\/another-account/);
    assert.match(content, /fake-test-key-one/);
    assert.match(content, /fake-test-key-two/);
    if (process.platform !== 'win32') assert.equal((await stat(path)).mode & 0o777, 0o600);
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('adding a personal account preserves existing plugin connection settings', async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-config-test-'));
  try {
    const path = join(home, 'config.toml');
    await writeFile(path, '[plugins."babelbird-cloud@babelbird-local"]\nenabled = true\n[plugins."babelbird-cloud@babelbird-local".mcp_servers.babelBird]\nenabled = true\n', { mode: 0o600 });
    await saveCodexConnection('fake-account-B-key', { codexHome: home });
    const content = await readFile(path, 'utf8');
    assert.match(content, /\[plugins\."babelbird-cloud@babelbird-local"\.mcp_servers\.babelBird\]\s+enabled = true/);
    assert.match(content, /fake-account-B-key/);
  } finally { await rm(home, { recursive: true, force: true }); }
});
