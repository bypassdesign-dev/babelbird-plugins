import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { startSetup } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/setup-server.mjs';
import { SetupError } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/mcp-check.mjs';

async function setup(options = {}) {
  return startSetup({ checkConnection: async () => ({ directoryRead: true, listRead: true }), saveConnection: async () => ({ serverName: 'test', reused: false }), ...options });
}
const submit = (app, body, headers = {}) => fetch(`${app.url}connect`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: new URL(app.url).origin, ...headers }, body: JSON.stringify(body) });

test('page exposes one required password field with local assets and no caching', async () => {
  const app = await setup();
  try {
    const response = await fetch(app.url);
    const html = await response.text();
    assert.equal((html.match(/<input\b/g) || []).length, 1);
    assert.match(html, /type="password"/);
    assert.match(html, /required/);
    assert.match(html, /保存并连接/);
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await fetch(`${app.url}setup.js`)).status, 200);
  } finally { await app.close(); }
});

test('wrong token, Host, Origin and oversized bodies cannot save a key', async () => {
  let saved = 0;
  const app = await setup({ saveConnection: async () => { saved++; return {}; } });
  try {
    assert.equal((await fetch(new URL('/wrong/', app.url))).status, 404);
    assert.equal((await submit(app, { apiKey: 'fake' }, { Origin: 'https://untrusted.example' })).status, 403);
    const wrongHostStatus = await new Promise((resolve, reject) => {
      const req = request(`${app.url}connect`, { method: 'POST', headers: { Host: 'untrusted.example', Origin: new URL(app.url).origin, 'Content-Type': 'application/json' } }, response => { response.resume(); resolve(response.statusCode); });
      req.on('error', reject);
      req.end(JSON.stringify({ apiKey: 'fake' }));
    });
    assert.equal(wrongHostStatus, 403);
    assert.equal((await submit(app, { apiKey: 'x'.repeat(9000) })).status, 413);
    assert.equal((await submit(app, { apiKey: '' })).status, 400);
    assert.equal(saved, 0);
  } finally { await app.close(); }
});

test('failed checks retry without saving and success has no credential in response', async () => {
  let calls = 0, saved = 0;
  const app = await setup({ checkConnection: async () => { if (++calls === 1) throw new SetupError('unauthorized', '密钥无效，请重新复制。'); }, saveConnection: async () => { saved++; return { serverName: 'test', reused: false }; } });
  try {
    const first = await submit(app, { apiKey: 'fake-test-secret' });
    assert.equal(first.status, 422);
    assert.equal(saved, 0);
    const second = await submit(app, { apiKey: 'fake-test-secret' });
    assert.equal(second.status, 200);
    const text = await second.text();
    assert.match(text, /connected/);
    assert.ok(!text.includes('fake-test-secret'));
    assert.equal(saved, 1);
    assert.equal((await submit(app, { apiKey: 'another' })).status, 409);
  } finally { await app.close(); }
});

test('duplicate submissions are rejected while the first is still checking', async () => {
  let release, started;
  const entered = new Promise(resolve => { started = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  const app = await setup({ checkConnection: async () => { started(); await blocked; } });
  try {
    const first = submit(app, { apiKey: 'fake' });
    await entered;
    assert.equal((await submit(app, { apiKey: 'fake' })).status, 409);
    release();
    assert.equal((await first).status, 200);
  } finally { release(); await app.close(); }
});

test('expired setup closes its listener and reports expiry', async () => {
  let finish;
  const ended = new Promise(resolve => { finish = resolve; });
  const app = await setup({ ttlMs: 40, onComplete: result => finish(result) });
  assert.equal((await ended).status, 'expired');
  await assert.rejects(fetch(app.url));
  await app.close();
});

test('failed completion persistence cannot leave the setup listener running past expiry', async () => {
  const app = await setup({ ttlMs: 80, onComplete: async result => { if (result.status === 'connected') throw new Error('disk unavailable'); } });
  try {
    const response = await submit(app, { apiKey: 'fake' });
    assert.equal(response.status, 422);
    const result = await response.json();
    assert.equal(result.saved, true);
    assert.equal(result.code, 'saved_status_error');
    assert.equal((await submit(app, { apiKey: 'fake' })).status, 409);
    await new Promise(resolve => setTimeout(resolve, 160));
    await assert.rejects(fetch(app.url));
  } finally { await app.close(); }
});
