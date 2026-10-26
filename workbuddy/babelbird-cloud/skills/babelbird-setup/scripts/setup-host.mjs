import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rename, lstat, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { startSetup } from './setup-server.mjs';
import { verifyConnection, SetupError } from './mcp-check.mjs';
import { HOSTS, hostPaths, saveHostConnection } from './host-config.mjs';
import { PERSONAL_HOSTS, platformSetup } from './personal-hosts.mjs';

const script = fileURLToPath(import.meta.url);
export function browserCommand(platform, url) {
  if (platform === 'darwin') return ['open', url];
  if (platform === 'win32') return ['rundll32.exe', 'url.dll,FileProtocolHandler', url];
  return ['xdg-open', url];
}

async function openBrowser(url) {
  const [command, ...args] = browserCommand(process.platform, url);
  return new Promise(resolveResult => {
    const child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
    const timer = setTimeout(() => { child.kill(); resolveResult(false); }, 5000);
    child.on('error', () => { clearTimeout(timer); resolveResult(false); });
    child.on('close', code => { clearTimeout(timer); resolveResult(code === 0); });
  });
}

async function stateFile(host) {
  const directory = (await hostPaths(host)).state;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if ((await lstat(directory)).isSymbolicLink()) throw new SetupError('config', '设置状态目录不能使用链接，请让安装智能体检查。');
  return join(await realpath(directory), 'status.json');
}

async function readState(path) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 8192) return { status: 'idle' };
    return JSON.parse(await readFile(path, 'utf8'));
  } catch { return { status: 'idle' }; }
}

async function writeState(path, state) {
  const temp = `${path}.${randomBytes(8).toString('hex')}.tmp`;
  await writeFile(temp, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
  await rename(temp, path);
}

async function activeState(path) {
  const state = await readState(path);
  if (state.status === 'connected' || state.status === 'expired' || state.status === 'closed') return state;
  if (!/^http:\/\/127\.0\.0\.1:[0-9]{1,5}\/[a-f0-9]{48}\/$/.test(state.url || '') || Date.parse(state.expiresAt) <= Date.now()) return { status: 'idle' };
  try {
    const response = await fetch(`${state.url}status`, { signal: AbortSignal.timeout(1000), redirect: 'error' });
    const live = await response.json();
    return { ...state, status: live.status };
  } catch { return { status: 'idle' }; }
}

async function serve(path, host, codexBin) {
  const sessionId = randomBytes(16).toString('hex');
  let record;
  const app = await startSetup({
    host,
    hostName: HOSTS[host].name,
    checkConnection: verifyConnection,
    saveConnection: key => saveHostConnection(host, key, { codexBin }),
    onComplete: async result => {
      if ((await readState(path)).sessionId === sessionId) {
        record = { sessionId, ...result };
        await writeState(path, record);
      }
    },
  });
  record = { status: 'waiting', host, sessionId, pid: process.pid, url: app.url, expiresAt: app.expiresAt };
  await writeState(path, record);
  process.send?.(record);
  const stop = async () => {
    await app.close();
    if (record.status === 'waiting' && (await readState(path)).sessionId === sessionId) await writeState(path, { sessionId, status: 'closed' });
  };
  process.once('SIGTERM', () => { void stop(); });
  process.once('SIGINT', () => { void stop(); });
}

async function launch(host, codexBin) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [script, '--serve', '--host', host, '--codex-bin', codexBin], {
      detached: true, windowsHide: true, env: process.env, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    const timer = setTimeout(() => { child.kill(); reject(new SetupError('launch', '设置页启动超时，请重试。')); }, 10000);
    child.once('error', () => { clearTimeout(timer); reject(new SetupError('launch', '无法启动本地设置页，请让安装智能体检查 Node.js。')); });
    child.once('exit', () => { clearTimeout(timer); reject(new SetupError('launch', '设置页未能启动，请让安装智能体检查本机文件权限。')); });
    child.once('message', message => {
      clearTimeout(timer);
      if (child.connected) child.disconnect();
      child.unref();
      if (message.status === 'error') { reject(new SetupError('launch', message.message)); return; }
      resolveResult(message);
    });
  });
}

export async function main(args) {
  const allowed = new Set(['--start', '--status', '--wait', '--serve', '--no-open', '--codex-bin', '--host', '--list']);
  let codexBin = 'codex', host;
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new SetupError('arguments', 'Usage: node setup-host.mjs --host <host> --start | --status | --wait | --list');
    if (args[i] === '--codex-bin') { codexBin = args[++i]; if (!codexBin) throw new SetupError('arguments', '缺少 Codex 可执行文件路径。'); }
    else if (args[i] === '--host') host = args[++i];
  }
  if (args.includes('--list')) { console.log(JSON.stringify({ ...HOSTS, ...PERSONAL_HOSTS })); return; }
  if (!host) {
    try { host = JSON.parse(await readFile(new URL('../installed-host.json', import.meta.url), 'utf8')).host; }
    catch { /* Native plugin installs have no host marker; the calling agent supplies --host. */ }
  }
  if (Object.hasOwn(PERSONAL_HOSTS, host)) {
    console.log(JSON.stringify(platformSetup(host)));
    return;
  }
  if (!Object.hasOwn(HOSTS, host)) throw new SetupError('arguments', 'Choose the actual host with --host. 请由安装智能体选择实际宿主。');
  const path = await stateFile(host);
  if (args.includes('--serve')) { await serve(path, host, codexBin); return; }
  if (args.includes('--status') || args.includes('--wait')) {
    let state = await activeState(path);
    const deadline = Date.now() + 25000;
    while (args.includes('--wait') && ['waiting', 'receiving', 'checking', 'saving'].includes(state.status) && Date.now() < deadline) {
      await new Promise(resolveResult => setTimeout(resolveResult, 1000));
      state = await activeState(path);
    }
    const { sessionId, url, pid, ...status } = state;
    console.log(JSON.stringify(status));
    return;
  }
  const existing = await activeState(path);
  const active = ['waiting', 'receiving', 'checking', 'saving'].includes(existing.status);
  const record = active ? existing : await launch(host, codexBin);
  const opened = args.includes('--no-open') ? false : await openBrowser(record.url);
  const { sessionId, ...publicRecord } = record;
  console.log(JSON.stringify({ ...publicRecord, browserLaunch: opened ? 'requested' : 'unavailable' }));
}

if (process.argv[1] && await realpath(process.argv[1]) === script) {
  main(process.argv.slice(2)).catch(error => {
    const result = { status: 'error', message: error instanceof SetupError ? error.message : '本地设置页未能完成操作，请让安装智能体检查本机文件权限。' };
    if (process.send) process.send(result);
    else console.log(JSON.stringify(result));
    process.exitCode = 1;
  });
}
