import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { mkdir, lstat, readFile, writeFile, rename, rm, chmod, open } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { MCP_URL, SetupError, normalizeKey } from './mcp-check.mjs';
import { saveCodexConnection } from './codex-config.mjs';

export const HOSTS = Object.freeze({
  codex: { name: 'Codex' }, workbuddy: { name: 'WorkBuddy' }, codebuddy: { name: 'CodeBuddy CLI' },
  claude: { name: 'Claude Code' }, cursor: { name: 'Cursor' }, gemini: { name: 'Gemini CLI' },
});
const configError = () => new SetupError('config', '无法安全保存本机配置，请让安装智能体检查配置格式、权限或同时打开的设置窗口。');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export async function hostPaths(host, { home = homedir(), env = process.env } = {}) {
  if (!Object.hasOwn(HOSTS, host)) throw new SetupError('arguments', 'Unsupported host / 不支持的宿主。请使用 --list 查看。');
  let root, config;
  switch (host) {
    case 'codex': root = resolve(env.CODEX_HOME || join(home, '.codex')); config = join(root, 'config.toml'); break;
    case 'workbuddy': root = resolve(env.WORKBUDDY_CONFIG_DIR || env.CODEBUDDY_CONFIG_DIR || join(home, '.workbuddy')); config = join(root, 'mcp.json'); break;
    case 'codebuddy': {
      root = resolve(env.CODEBUDDY_CONFIG_DIR || join(home, '.codebuddy'));
      const candidates = [join(root, '.mcp.json'), join(root, 'mcp.json'), join(home, '.codebuddy.json')];
      config = candidates[0];
      for (const path of candidates) {
        try { await lstat(path); config = path; break; } catch (error) { if (error.code !== 'ENOENT') throw configError(); }
      }
      break;
    }
    case 'claude': root = resolve(env.CLAUDE_CONFIG_DIR || join(home, '.claude')); config = env.CLAUDE_CONFIG_DIR ? join(root, '.claude.json') : join(home, '.claude.json'); break;
    case 'cursor': root = join(home, '.cursor'); config = join(root, 'mcp.json'); break;
    case 'gemini': root = join(home, '.gemini'); config = join(root, 'settings.json'); break;
  }
  return { root, config: resolve(config), skills: join(root, 'skills'), state: host === 'codex' ? join(root, 'babelbird-setup') : join(root, 'babelbird-setup', host) };
}

// Token positions let us add one property without rewriting comments or other settings.
function tokens(text) {
  const result = [];
  const pattern = /\s+|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|[{}\[\]:,]|[^\s{}\[\]:,]+/gy;
  let match, end = 0;
  while ((match = pattern.exec(text))) {
    end = pattern.lastIndex;
    const value = match[0];
    if (/^\s|^\/\//.test(value) || value.startsWith('/*')) continue;
    result.push({ value, start: match.index, end });
  }
  if (end !== text.length) throw configError();
  return result;
}

function parsedDocument(text) {
  const list = tokens(text);
  const cleaned = list.filter((token, i) => !(token.value === ',' && ['}', ']'].includes(list[i + 1]?.value))).map(token => token.value).join(' ');
  let value;
  try { value = JSON.parse(cleaned); } catch { throw configError(); }
  if (!object(value)) throw configError();
  const stack = [];
  for (let i = 0; i < list.length; i++) {
    const token = list[i].value;
    if (token === '{') stack.push(new Set());
    else if (token === '[') stack.push(null);
    else if (token === '}' || token === ']') stack.pop();
    else if (token.startsWith('"') && list[i + 1]?.value === ':') {
      const key = JSON.parse(token), keys = stack.at(-1);
      if (!keys || keys.has(key)) throw configError();
      keys.add(key);
    }
  }
  return { value, list };
}
export function parseConfig(text) { return parsedDocument(text).value; }

function appendProperty(text, path, key, value) {
  const { list } = parsedDocument(text);
  let start = 0;
  for (const segment of path) {
    let depth = 0, found = -1;
    for (let i = start; i < list.length; i++) {
      if (list[i].value === '{' || list[i].value === '[') depth++;
      if (list[i].value === '}' || list[i].value === ']') depth--;
      if (depth === 0) break;
      if (depth === 1 && list[i].value.startsWith('"') && list[i + 1]?.value === ':' && JSON.parse(list[i].value) === segment) { found = i + 2; break; }
    }
    if (found < 0 || list[found].value !== '{') throw configError();
    start = found;
  }
  let depth = 0, end = start;
  for (; end < list.length; end++) {
    if (['{', '['].includes(list[end].value)) depth++;
    if (['}', ']'].includes(list[end].value)) depth--;
    if (depth === 0) break;
  }
  const previous = list[end - 1];
  const comma = previous.value === '{' || previous.value === ',' ? '' : ',';
  const insertion = `${comma}\n${JSON.stringify(key)}: ${JSON.stringify(value, null, 2)}\n`;
  // Insert before closing whitespace/comments so trailing // comments cannot hide the new entry.
  return text.slice(0, previous.end) + insertion + text.slice(previous.end);
}

export async function saveHostConnection(host, apiKey, options = {}) {
  const key = normalizeKey(apiKey);
  const paths = await hostPaths(host, options);
  if (host === 'codex') return saveCodexConnection(key, { codexHome: paths.root, codexBin: options.codexBin });
  const path = paths.config;
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  let lock;
  try { lock = await open(`${path}.babelbird.lock`, 'wx', 0o600); } catch { throw configError(); }
  const temp = `${path}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    let original = null;
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 8 * 1024 * 1024) throw configError();
      original = await readFile(path, 'utf8');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const source = original ?? '{}\n';
    if (host === 'workbuddy') { try { JSON.parse(source); } catch { throw configError(); } }
    const document = parseConfig(source);
    const servers = document.mcpServers ?? {};
    if (!object(servers) || (Object.hasOwn(document, 'mcpServers') && !object(document.mcpServers))) throw configError();
    const urlKey = host === 'gemini' ? 'httpUrl' : 'url';
    const authorization = `Bearer ${key}`;
    const same = Object.entries(servers).find(([, server]) => object(server) && server[urlKey] === MCP_URL && server.disabled !== true && server.enabled !== false && server.headers?.Authorization === authorization);
    if (same) { if (process.platform !== 'win32') await chmod(path, 0o600); return { serverName: same[0], reused: true }; }
    let serverName = 'babelBirdPersonal', suffix = 2;
    while (Object.hasOwn(servers, serverName)) serverName = `babelBirdPersonal${suffix++}`;
    const server = { ...(['workbuddy', 'codebuddy', 'claude'].includes(host) ? { type: 'http' } : {}), [urlKey]: MCP_URL, headers: { Authorization: authorization } };
    const updated = Object.hasOwn(document, 'mcpServers') ? appendProperty(source, ['mcpServers'], serverName, server) : appendProperty(source, [], 'mcpServers', { [serverName]: server });
    parseConfig(updated);
    await writeFile(temp, updated, { flag: 'wx', mode: 0o600 });
    let current = null;
    try { if (!(await lstat(path)).isFile()) throw configError(); current = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current !== original) throw configError();
    await rename(temp, path);
    return { serverName, reused: false };
  } catch { throw configError(); }
  finally { await rm(temp, { force: true }); await lock.close(); await rm(`${path}.babelbird.lock`, { force: true }); }
}
