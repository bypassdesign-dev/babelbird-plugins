import { readFile, writeFile, readdir, lstat, mkdir, realpath, rename, unlink, link } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, join, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const BINDING = '.babelbird-sync.json';
const STATE = '.babelbird-sync-state.json';
const BLOCK = '<!-- babelbird-task-sync -->';
const RULE = `${BLOCK}\nThis project uses the babelbird-project-cloud Skill for task-based cloud synchronization. Read .babelbird-sync.json when starting work. If autoSync is enabled, use the installed Skill to pull non-conflicting remote changes before editing and upload local changes after each completed batch of edits and check again before finishing the task. Reuse the bound cloud folder across devices and agent platforms. Never upload credentials, propagate deletions, overwrite conflicts, or claim success without verification. If the plugin or network is unavailable, preserve local work and report pending synchronization.\n<!-- /babelbird-task-sync -->\n`;
const SKIP_DIRS = new Set(['.git', '.svn', '.hg', 'node_modules', '__pycache__', '.venv', 'venv', '.cache', 'dist', 'build', 'secrets', '.ssh', '.aws', '.codex', '.workbuddy']);
const SKIP_FILES = new Set([BINDING, STATE, '.DS_Store', '.www.babel.cc', 'credentials.json', 'id_rsa', 'id_ed25519', '.npmrc', '.pypirc', '.netrc']);
const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const missing = error => error?.code === 'ENOENT';

function relativeName(name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || name.includes(':') || name.includes('\0') || name.startsWith('/') || name.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe relative path');
  return name;
}

export async function safePath(root, name) {
  relativeName(name);
  const base = await realpath(root);
  let candidate = base;
  for (const part of name.split('/')) {
    candidate = join(candidate, part);
    try { if ((await lstat(candidate)).isSymbolicLink()) throw new Error('Symbolic links are not supported'); }
    catch (error) { if (!missing(error)) throw error; }
  }
  if (!candidate.startsWith(base + sep)) throw new Error('Path escapes project');
  return candidate;
}

async function optionalJson(root, name) {
  try { return JSON.parse(await readFile(await safePath(root, name), 'utf8')); }
  catch (error) { if (missing(error)) return null; throw error; }
}

async function atomicJson(root, name, value) {
  const target = await safePath(root, name);
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await rename(temporary, target);
  } finally { await unlink(temporary).catch(error => { if (!missing(error)) throw error; }); }
}

function cloudTarget(cloud) {
  if (!cloud || typeof cloud.folderId !== 'string' || !/^\d+$/.test(cloud.folderId) || typeof cloud.path !== 'string' || !cloud.path.startsWith('/')) throw new Error('Invalid cloud project binding');
  const endpoint = new URL(cloud.endpoint);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('MCP endpoint requires HTTPS without embedded credentials');
  return { endpoint: endpoint.href, folderId: cloud.folderId, path: cloud.path };
}

export async function readBinding(root) {
  const binding = await optionalJson(root, BINDING);
  if (!binding || binding.format !== 1 || typeof binding.autoSync !== 'boolean') throw new Error('Project has no valid BabelBird binding');
  return { ...binding, cloud: cloudTarget(binding.cloud) };
}

export async function bindProject(root, cloud, host) {
  if (!['codex', 'workbuddy', 'claude'].includes(host)) throw new Error('Unknown agent host');
  const normalized = cloudTarget(cloud);
  const existing = await optionalJson(root, BINDING);
  if (existing && (existing.cloud.endpoint !== normalized.endpoint || existing.cloud.folderId !== normalized.folderId)) throw new Error('Project is already bound to another cloud directory');
  const binding = { format: 1, autoSync: true, host, cloud: normalized };
  await atomicJson(root, BINDING, binding);
  const rules = await safePath(root, 'AGENTS.md');
  let previous = '';
  try { previous = await readFile(rules, 'utf8'); } catch (error) { if (!missing(error)) throw error; }
  if (!previous.includes(BLOCK)) await writeFile(rules, previous + (previous.endsWith('\n') || !previous ? '' : '\n') + '\n' + RULE);
  if (host === 'workbuddy') {
    const rulePath = await safePath(root, '.codebuddy/rules/babelbird-sync.md');
    await mkdir(dirname(rulePath), { recursive: true });
    try { await writeFile(rulePath, '---\nalwaysApply: true\nenabled: true\n---\n\n' + RULE, { flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  return binding;
}

export async function scanProject(root) {
  const base = await realpath(root), files = [], excluded = [];
  const gitRoot = spawnSync('git', ['-C', base, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  let allowed;
  if (gitRoot.status === 0 && resolve(gitRoot.stdout.trim()) === base) {
    const listed = spawnSync('git', ['-C', base, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (listed.status !== 0) throw new Error('Could not enumerate Git project files');
    allowed = new Set(listed.stdout.split('\0').filter(Boolean));
  }
  async function visit(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const name = prefix + entry.name;
      relativeName(name);
      const sensitive = entry.name === '.env' || entry.name.startsWith('.env.') || entry.name.startsWith('.babelbird-sync') || /\.(pem|key|p12|pfx)$/i.test(entry.name);
      if (entry.isSymbolicLink() || SKIP_FILES.has(entry.name) || sensitive || (entry.isDirectory() && SKIP_DIRS.has(entry.name))) { excluded.push({ path: name, reason: 'excluded-or-unsupported' }); continue; }
      if (entry.isDirectory()) { await visit(join(directory, entry.name), name + '/'); continue; }
      if (!entry.isFile()) { excluded.push({ path: name, reason: 'special-file' }); continue; }
      if (allowed && !allowed.has(name)) { excluded.push({ path: name, reason: 'git-ignored' }); continue; }
      const path = await safePath(base, name);
      const bytes = await readFile(path);
      files.push({ path: name, size: bytes.length, sha256: digest(bytes), md5: digest(bytes, 'md5') });
    }
  }
  await visit(base);
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), excluded };
}

function indexFiles(files) {
  if (!Array.isArray(files)) throw new Error('File inventory must be an array');
  const result = new Map();
  const portable = new Set();
  for (const file of files) {
    relativeName(file.path);
    const key = file.path.normalize('NFC').toLowerCase();
    if (portable.has(key)) throw new Error('Duplicate or colliding file path');
    portable.add(key); result.set(file.path, file);
  }
  return result;
}

function remoteVersion(file) {
  if (!file || typeof file.fileId !== 'string' || !Number.isFinite(file.size) || file.size < 0) throw new Error('Remote inventory requires fileId and size');
  const reliable = file.version !== undefined && file.version !== null && file.mtime !== undefined && file.mtime !== null;
  if (!reliable && !/^[a-f0-9]{64}$/.test(file.sha256 ?? '')) throw new Error('Remote inventory requires version and mtime or a verified SHA-256');
  return { fileId: file.fileId, version: file.version ?? null, mtime: file.mtime ?? null, size: file.size, ...(!reliable ? { sha256: file.sha256 } : {}) };
}

const unchangedRemote = (a, b) => JSON.stringify(remoteVersion(a)) === JSON.stringify(remoteVersion(b));

export function planSync(localFiles, remoteFiles, baseline) {
  const local = indexFiles(localFiles), remote = indexFiles(remoteFiles), plan = [];
  const paths = [...new Set([...local.keys(), ...remote.keys(), ...Object.keys(baseline)])].sort();
  const portablePaths = new Map();
  for (const path of paths) {
    relativeName(path);
    const parts = path.split('/');
    for (let length = 1; length <= parts.length; length++) {
      const prefix = parts.slice(0, length).join('/'), key = prefix.normalize('NFC').toLowerCase();
      const prior = portablePaths.get(key), kind = length === parts.length ? 'file' : 'directory';
      if (prior && (prior.path !== prefix || prior.kind !== kind)) throw new Error('Colliding file paths across devices');
      portablePaths.set(key, { path: prefix, kind });
    }
  }
  for (const value of remote.values()) remoteVersion(value);
  for (const path of paths) {
    const l = local.get(path), r = remote.get(path), b = Object.hasOwn(baseline, path) ? baseline[path] : undefined;
    let action, reason;
    if (!l && !r) { action = 'skip'; reason = 'absent-on-both-sides'; }
    else if (b && (!l || !r)) { action = 'conflict'; reason = 'deletion-needs-user-decision'; }
    else if (!l) { action = 'download'; reason = 'new-cloud-file'; }
    else if (!r) { action = 'upload'; reason = 'new-local-file'; }
    else if (r.sha256 && r.sha256 === l.sha256) { action = 'record'; reason = 'verified-identical'; }
    else if (!b) { action = r.sha256 ? 'conflict' : 'inspect'; reason = 'no-common-baseline'; }
    else {
      const localChanged = l.sha256 !== b.sha256, remoteChanged = r.sha256 ? r.sha256 !== b.sha256 : !unchangedRemote(r, b.remote);
      if (localChanged && remoteChanged) { action = 'conflict'; reason = 'both-sides-changed'; }
      else if (localChanged) { action = 'upload'; reason = 'local-changed'; }
      else if (remoteChanged) { action = 'download'; reason = 'cloud-changed'; }
      else { action = 'skip'; reason = 'unchanged'; }
    }
    plan.push({ path, action, reason, ...(l ? { local: l } : {}), ...(r ? { remote: r } : {}) });
  }
  return plan;
}

export async function readState(root) {
  const binding = await readBinding(root);
  const state = await optionalJson(root, STATE);
  if (!state) return { format: 1, cloud: binding.cloud, files: {} };
  if (state.format !== 1 || state.cloud.endpoint !== binding.cloud.endpoint || state.cloud.folderId !== binding.cloud.folderId || !state.files) throw new Error('Synchronization baseline does not match project binding');
  return state;
}

export async function recordVerified(root, path, verifiedSha256, remote) {
  if (!/^[a-f0-9]{64}$/.test(verifiedSha256)) throw new Error('Invalid verification digest');
  const bytes = await readFile(await safePath(root, path));
  if (digest(bytes) !== verifiedSha256 || bytes.length !== remote.size) throw new Error('Local digest changed or size does not match verification');
  const state = await readState(root);
  Object.defineProperty(state.files, path, { value: { sha256: verifiedSha256, remote: remoteVersion(remote) }, enumerable: true, writable: true, configurable: true });
  await atomicJson(root, STATE, state);
  return { path, recorded: true };
}

export function transferUrl(raw) {
  const url = new URL(raw);
  if (url.protocol === 'http:' && url.hostname === 'document.babel.cc' && ['/api/file/uploadFileCTPdf.do', '/api/file/uploadFile.do'].includes(url.pathname)) url.protocol = 'https:';
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Transfer requires HTTPS without embedded credentials');
  return url;
}

async function upload(input) {
  const bytes = await readFile(await safePath(input.root, input.path));
  if (digest(bytes) !== input.expectedSha256) throw new Error('Local file changed after planning');
  if (typeof (input.fileId ?? input.folderId) !== 'string' || !/^\d+$/.test(input.fileId ?? input.folderId)) throw new Error('Upload requires a verified fileId or folderId');
  if (!input.ticket || typeof input.ticket.upload_token !== 'string') throw new Error('Missing upload ticket');
  const form = new FormData();
  form.set('upload_token', input.ticket.upload_token);
  form.set('fileName', input.path.split('/').at(-1));
  form.set('fileHash', digest(bytes, 'md5'));
  form.set(input.fileId ? 'fileId' : 'folderId', input.fileId ?? input.folderId);
  form.set('file', new Blob([bytes]), input.path.split('/').at(-1));
  const response = await fetch(transferUrl(input.ticket.url), { method: 'POST', body: form, signal: AbortSignal.timeout(120000), redirect: 'error' });
  if (!response.ok) throw new Error(`Upload HTTP ${response.status}; outcome may be unknown`);
  const result = await response.json();
  if (result.success !== true || result.code !== 0 || !result.fileId) throw new Error(`Upload failed, business code ${result.code}`);
  if (input.fileId && String(result.fileId) !== input.fileId) throw new Error('Update returned a different fileId; verify outcome');
  return { fileId: String(result.fileId), size: bytes.length, sha256: digest(bytes), uploaded: true, contentVerified: false };
}

async function download(input) {
  const response = await fetch(transferUrl(input.url), { signal: AbortSignal.timeout(120000), redirect: 'error' });
  if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer()), sha256 = digest(bytes);
  if (input.expectedSize !== undefined && bytes.length !== input.expectedSize) throw new Error('Downloaded size mismatch');
  if (input.expectedSha256 && sha256 !== input.expectedSha256) throw new Error('Downloaded digest mismatch');
  if (input.inspectOnly) return { sha256, size: bytes.length, written: false };
  const target = await safePath(input.root, input.path);
  let previous;
  try { previous = await readFile(target); } catch (error) { if (!missing(error)) throw error; }
  if (previous && (!input.expectedLocalSha256 || digest(previous) !== input.expectedLocalSha256)) throw new Error('Local file changed or overwrite not authorized by plan');
  if (!previous && input.expectedLocalSha256) throw new Error('Local file disappeared after planning');
  await mkdir(dirname(target), { recursive: true });
  await safePath(input.root, input.path);
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await safePath(input.root, input.path);
    if (previous) {
      if (digest(await readFile(target)) !== input.expectedLocalSha256) throw new Error('Local file changed during download');
      await rename(temporary, target);
    } else {
      await link(temporary, target);
    }
  }
  finally { await unlink(temporary).catch(error => { if (!missing(error)) throw error; }); }
  return { sha256, size: bytes.length, written: true };
}

export async function run(input) {
  switch (input.action) {
    case 'bind': return bindProject(input.root, input.cloud, input.host);
    case 'binding': return readBinding(input.root);
    case 'scan': return scanProject(input.root);
    case 'plan': {
      if (input.remoteComplete !== true) throw new Error('Remote enumeration is incomplete');
      const state = await readState(input.root), scan = await scanProject(input.root);
      return { plan: planSync(scan.files, input.remoteFiles, state.files), excluded: scan.excluded };
    }
    case 'record': return recordVerified(input.root, input.path, input.sha256, input.remote);
    case 'upload': return upload(input);
    case 'download': return download(input);
    default: throw new Error('Unknown synchronization action');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const result = await run(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/https?:\/\/\S+/g, '[transfer-url]') : 'Synchronization failed';
    process.stderr.write(JSON.stringify({ error: message }) + '\n');
    process.exitCode = 1;
  }
}
