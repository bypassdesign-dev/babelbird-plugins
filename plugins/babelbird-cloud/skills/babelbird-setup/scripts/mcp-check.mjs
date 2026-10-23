export const MCP_URL = 'https://www.babel.cc/mcp';

export class SetupError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SetupError';
    this.code = code;
  }
}

export function normalizeKey(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key || key.length > 4096 || /\s/.test(key) || /^Bearer\b/i.test(key)) {
    throw new SetupError('invalid_key', '请粘贴完整的 API Key，不要添加 Bearer 或其他文字。');
  }
  return key;
}

async function readReply(response, id) {
  const reader = response.body?.getReader();
  if (!reader) throw new SetupError('connection', '巴别鸟没有返回连接结果，请重试。');
  const sse = response.headers.get('content-type')?.includes('text/event-stream');
  const decoder = new TextDecoder();
  let buffer = '', bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024 * 1024) throw new SetupError('connection', '连接响应过大，请稍后重试。');
      buffer += decoder.decode(value, { stream: true });
      if (!sse) continue;
      buffer = buffer.replace(/\r\n/g, '\n');
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        const reply = JSON.parse(data);
        if (reply.id === id) return reply;
      }
    }
    if (!sse) {
      const reply = JSON.parse(buffer + decoder.decode());
      if (reply.id === id) return reply;
    }
    throw new SetupError('connection', '连接已结束，但没有收到检查结果，请重试。');
  } finally { await reader.cancel().catch(() => {}); }
}

function businessResult(result) {
  if (result?.isError) throw new SetupError('permission', '巴别鸟拒绝了目录读取，请检查密钥的文件读取权限。');
  let data = result?.structuredContent;
  if (!data) {
    const content = result?.content?.find(item => item.type === 'text');
    try { data = JSON.parse(content?.text ?? 'null'); } catch { /* Handled by the result check below. */ }
  }
  if (!data || data.success !== true || Number(data.code) !== 0) {
    throw new SetupError('permission', '暂时无法读取个人文件，请检查 API Key 的访问范围和文件读取权限。');
  }
  return data;
}

export async function verifyConnection(apiKey, { fetchImpl = fetch, timeoutMs = 20000 } = {}) {
  const key = normalizeKey(apiKey);
  let sessionId;
  let protocol = '2024-11-05';
  let nextId = 0;
  async function rpc(method, params, notification = false) {
    const id = notification ? undefined : ++nextId;
    const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;
    if (method !== 'initialize') headers['MCP-Protocol-Version'] = protocol;
    const response = await fetchImpl(MCP_URL, {
      method: 'POST', headers, redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, params }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401) throw new SetupError('unauthorized', 'API Key 无效或已过期，请重新复制后再试。');
      if (response.status === 403) throw new SetupError('permission', '巴别鸟拒绝访问，请检查密钥权限或稍后重试。');
      throw new SetupError('connection', '巴别鸟暂时无法连接，请稍后重试。');
    }
    sessionId = response.headers.get('mcp-session-id') || sessionId;
    if (notification) { await response.body?.cancel(); return; }
    const reply = await readReply(response, id);
    if (reply.error || !reply.result) throw new SetupError('connection', '巴别鸟未能完成检查，请稍后重试。');
    return reply.result;
  }
  try {
    const initialized = await rpc('initialize', { protocolVersion: protocol, capabilities: {}, clientInfo: { name: 'babelbird-setup', version: '0.4.0' } });
    protocol = initialized.protocolVersion || protocol;
    await rpc('notifications/initialized', {}, true);
    const folder = businessResult(await rpc('tools/call', { name: 'getFileInfoByPath', arguments: { namePath: '/个人文件' } }));
    const info = folder.fileInfo;
    if (!info || Number(info.type) !== 2 || !info.fileId || String(info.fileId) === '0') {
      throw new SetupError('permission', '没有找到可访问的个人文件目录，请检查密钥的访问范围。');
    }
    businessResult(await rpc('tools/call', { name: 'listFolder', arguments: { fileId: String(info.fileId), pageIndex: 0, pageSize: 1 } }));
    return { directoryRead: true, listRead: true };
  } catch (error) {
    if (error instanceof SetupError) throw error;
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new SetupError('timeout', '连接超时，密钥尚未保存。请检查网络后重试。');
    throw new SetupError('connection', '暂时无法连接巴别鸟，密钥尚未保存。请检查网络后重试。');
  }
}
