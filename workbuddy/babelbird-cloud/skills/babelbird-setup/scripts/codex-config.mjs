import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir, open, lstat, chmod, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { MCP_URL, SetupError, normalizeKey } from './mcp-check.mjs';

export function codexHomePath() {
  return resolve(process.env.CODEX_HOME || join(homedir(), '.codex'));
}

function configClient(home, executable) {
  const child = spawn(executable, ['--no-daemon', 'app-server', '--stdio'], {
    cwd: home, env: { ...process.env, CODEX_HOME: home }, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true,
  });
  const pending = new Map();
  let nextId = 0;
  let failed = false;
  function fail() {
    failed = true;
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new SetupError('config', '无法打开 Codex 配置，请让安装智能体检查 Codex 是否可用。')); }
    pending.clear();
  }
  child.on('error', fail);
  child.on('exit', fail);
  child.stdin.on('error', fail);
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    let reply;
    try { reply = JSON.parse(line); } catch { return; }
    const entry = pending.get(reply.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(reply.id);
    if (reply.error) entry.reject(new SetupError('config', 'Codex 配置未能保存，可能已被其他窗口修改。请重试。'));
    else entry.resolve(reply.result);
  });
  return {
    request(method, params) {
      if (failed) return Promise.reject(new SetupError('config', '无法打开 Codex 配置，请让安装智能体检查 Codex 是否可用。'));
      const id = ++nextId;
      return new Promise((resolveResult, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new SetupError('config', '保存 Codex 配置超时，请重试。'));
        }, 20000);
        pending.set(id, { resolve: resolveResult, reject, timer });
        child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
      });
    },
    notify(method) { child.stdin.write(JSON.stringify({ method, params: {} }) + '\n'); },
    close() { lines.close(); child.kill(); fail(); },
  };
}

export async function saveCodexConnection(apiKey, { codexHome = codexHomePath(), codexBin = 'codex' } = {}) {
  const key = normalizeKey(apiKey);
  await mkdir(resolve(codexHome), { recursive: true, mode: 0o700 });
  const home = await realpath(resolve(codexHome));
  const path = join(home, 'config.toml');
  try { const file = await open(path, 'wx', 0o600); await file.close(); } catch (error) { if (error.code !== 'EEXIST') throw new SetupError('config', '无法写入本机 Codex 配置，请检查文件权限。'); }
  const file = await lstat(path);
  if (file.isSymbolicLink() || !file.isFile()) throw new SetupError('config', 'Codex 配置使用了链接或特殊文件，请让安装智能体确认密钥的私有保存位置。');
  if (process.platform !== 'win32') await chmod(path, 0o600);
  const client = configClient(home, codexBin);
  try {
    await client.request('initialize', { clientInfo: { name: 'babelbird-setup', version: '0.5.1' } });
    client.notify('initialized');
    const snapshot = await client.request('config/read', { includeLayers: true, cwd: home });
    const layer = snapshot.layers?.find(item => item.name.type === 'user' && resolve(item.name.file) === path);
    if (!layer || layer.disabledReason) throw new SetupError('config', '无法找到可写的用户配置，请让安装智能体检查 Codex 设置。');
    const servers = { ...layer.config?.mcp_servers, ...snapshot.config?.mcp_servers };
    const authorization = `Bearer ${key}`;
    const same = Object.entries(servers).find(([, server]) => server.url === MCP_URL && server.enabled !== false && server.http_headers?.Authorization === authorization);
    let serverName = same?.[0] || 'babelBirdPersonal';
    if (!same) {
      let suffix = 2;
      while (Object.hasOwn(servers, serverName)) serverName = `babelBirdPersonal${suffix++}`;
    }
    const edits = same ? [] : [{ keyPath: `mcp_servers.${serverName}`, mergeStrategy: 'replace', value: { url: MCP_URL, http_headers: { Authorization: authorization }, startup_timeout_sec: 20, tool_timeout_sec: 60 } }];
    if (edits.length) {
      const result = await client.request('config/batchWrite', { edits, filePath: path, expectedVersion: layer.version, reloadUserConfig: false });
      if (result.status !== 'ok') throw new SetupError('config', '配置已保存，但被管理策略覆盖，请联系管理员检查。');
    }
    if (process.platform !== 'win32') await chmod(path, 0o600);
    return { serverName, reused: Boolean(same) };
  } catch (error) {
    if (error instanceof SetupError) throw error;
    throw new SetupError('config', '无法保存 Codex 连接，请让安装智能体检查本机配置。');
  } finally { client.close(); }
}
