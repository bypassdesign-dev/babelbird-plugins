import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { SetupError, normalizeKey } from './mcp-check.mjs';

const assets = new Map([
  ['', ['setup.html', 'text/html; charset=utf-8']],
  ['setup.css', ['setup.css', 'text/css; charset=utf-8']],
  ['setup.js', ['setup.js', 'text/javascript; charset=utf-8']],
  ['messages.mjs', ['messages.mjs', 'text/javascript; charset=utf-8']],
]);

async function bodyJson(request) {
  if (Number(request.headers['content-length']) > 8192) throw new SetupError('too_large', '输入内容过长，请只粘贴 API Key。');
  return new Promise((resolve, reject) => {
    let bytes = 0, text = '', rejected = false;
    const timer = setTimeout(() => { rejected = true; reject(new SetupError('invalid_key', '输入接收超时，请重试。')); request.destroy(); }, 5000);
    request.on('data', chunk => {
      if (rejected) return;
      bytes += chunk.length;
      if (bytes > 8192) { rejected = true; clearTimeout(timer); reject(new SetupError('too_large', '输入内容过长，请只粘贴 API Key。')); return; }
      text += chunk.toString('utf8');
    });
    request.on('end', () => {
      clearTimeout(timer);
      if (rejected) return;
      try { resolve(JSON.parse(text)); } catch { reject(new SetupError('invalid_key', '请填写 API Key 后重新提交。')); }
    });
    request.on('error', () => { clearTimeout(timer); reject(new SetupError('invalid_key', '输入接收中断，请重试。')); });
  });
}

export async function startSetup({ checkConnection, saveConnection, onComplete = async () => {}, ttlMs = 600000, host = 'codex', hostName = 'Codex' }) {
  const prefix = `/${randomBytes(24).toString('hex')}/`;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  let origin, state = 'waiting', timer, successTimer;
  let closing;
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const json = (status, value) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(value)); };
    if (request.headers.host !== new URL(origin).host) { json(403, { error: '无法访问此设置页。' }); return; }
    const route = request.url?.startsWith(prefix) ? request.url.slice(prefix.length) : null;
    if (route === null) { json(404, { error: '设置入口不存在，请使用智能体提供的链接。' }); return; }
    if (request.method === 'GET' && route === 'status') { json(200, { status: state, expiresAt, host, hostName }); return; }
    if (request.method === 'GET' && assets.has(route)) {
      try {
        const [name, type] = assets.get(route);
        response.writeHead(200, { 'Content-Type': type });
        response.end(await readFile(new URL(`../assets/${name}`, import.meta.url)));
      } catch { response.destroy(); }
      return;
    }
    if (request.method !== 'POST' || route !== 'connect') { json(404, { error: '找不到此页面。' }); return; }
    if (request.headers.origin !== origin || request.headers['sec-fetch-site'] === 'cross-site' || request.headers['content-type']?.split(';')[0] !== 'application/json') {
      json(403, { error: '请在本机设置页中提交。' }); return;
    }
    if (state !== 'waiting') { json(409, { code: 'busy', error: ['connected', 'saved_status_error'].includes(state) ? '连接已保存，可以返回智能体。' : '正在连接，请稍候。' }); return; }
    state = 'receiving';
    let saved = false;
    try {
      const input = await bodyJson(request);
      if (!input || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'apiKey')) throw new SetupError('invalid_key', '请只填写 API Key。');
      const key = normalizeKey(input.apiKey);
      input.apiKey = '';
      if (state === 'expired') throw new SetupError('expired', '设置页已过期，请让智能体重新打开。');
      state = 'checking';
      await checkConnection(key);
      if (state === 'expired') throw new SetupError('expired', '设置页已过期，请让智能体重新打开。');
      state = 'saving';
      const connection = await saveConnection(key);
      saved = true;
      const result = { status: 'connected', host, hostName, serverName: connection.serverName, reused: connection.reused, checkedAt: new Date().toISOString() };
      await onComplete(result);
      state = 'connected';
      clearTimeout(timer);
      json(200, result);
      successTimer = setTimeout(() => { void close(); }, 1500);
    } catch (error) {
      if (state !== 'expired') state = saved ? 'saved_status_error' : 'waiting';
      if (saved) successTimer = setTimeout(() => { void close(); }, 1500);
      const safe = saved ? new SetupError('saved_status_error', '连接已通过，密钥也已保存，但无法记录安装进度。请回到智能体检查连接，无需再次填写。') : error instanceof SetupError ? error : new SetupError('connection', '连接未完成，请稍后重试。');
      if (!response.destroyed) json(safe.code === 'too_large' ? 413 : safe.code === 'invalid_key' ? 400 : 422, { error: safe.message, code: safe.code, ...(saved ? { saved: true } : {}) });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  async function close() {
    clearTimeout(timer); clearTimeout(successTimer);
    if (!closing) closing = new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    return closing;
  }
  async function expire() {
    if (state === 'saving') { timer = setTimeout(() => { void expire(); }, 1000); return; }
    if (state === 'connected') return;
    state = 'expired';
    await close();
    try { await onComplete({ status: 'expired', expiresAt }); } catch { /* Listener is already closed even when status storage is unavailable. */ }
  }
  timer = setTimeout(() => { void expire(); }, ttlMs);
  return { url: `${origin}${prefix}`, expiresAt, close };
}
