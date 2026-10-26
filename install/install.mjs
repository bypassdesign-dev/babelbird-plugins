import { mkdir, readFile, writeFile, readdir, lstat, cp, rename, rm, open, realpath } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { HOSTS, hostPaths } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/host-config.mjs';
import { PERSONAL_HOSTS } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/personal-hosts.mjs';
const exec = promisify(execFile);
const source = fileURLToPath(new URL('../plugins/babelbird-cloud/skills/', import.meta.url));
const names = ['babelbird-setup', 'babelbird-project-cloud'];
const receiptName = '.babelbird-install.json';

async function hashes(root, prefix = '') {
  const result = {};
  for (const item of await readdir(join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${item.name}` : item.name;
    if (relative === receiptName) continue;
    if (item.isSymbolicLink() || (!item.isFile() && !item.isDirectory())) throw new Error('Unsupported linked skill file / 技能文件不能使用链接。');
    if (item.isDirectory()) Object.assign(result, await hashes(root, relative));
    else result[relative] = createHash('sha256').update(await readFile(join(root, relative))).digest('hex');
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

async function owned(directory) {
  let info;
  try { info = await lstat(directory); } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Unsafe existing skill directory / 已有技能目录不可安全更新。');
  let receipt;
  try { receipt = JSON.parse(await readFile(join(directory, receiptName), 'utf8')); }
  catch { throw new Error('An existing skill has no installer receipt. Preserve it and resolve with the agent / 已有同名技能，请让智能体保留并处理。'); }
  if (receipt.owner !== 'bypassdesign-dev/babelbird-plugins' || JSON.stringify(receipt.files) !== JSON.stringify(await hashes(directory))) {
    throw new Error('Installed skill was modified. Preserve local changes before updating / 已安装技能被修改，请先保留修改。');
  }
  return true;
}

export async function installSkills(host, options = {}) {
  const personal = Object.hasOwn(PERSONAL_HOSTS, host);
  let paths;
  if (personal) {
    if (typeof options.skillsDirectory !== 'string' || !options.skillsDirectory) throw new Error('Discover the platform Skills directory first / 请由智能体先确认平台技能目录。');
    if (!isAbsolute(options.skillsDirectory)) throw new Error('Use an absolute Skills directory / 技能目录必须是已确认的绝对路径。');
    paths = { skills: options.skillsDirectory };
  } else {
    if (options.skillsDirectory !== undefined) throw new Error('--skills-dir is only for personal agents / 仅个人智能体使用此参数。');
    paths = await hostPaths(host, options);
  }
  await mkdir(paths.skills, { recursive: true });
  if ((await lstat(paths.skills)).isSymbolicLink()) throw new Error('Skill directory is a link / 技能目录使用了链接。');
  let lock;
  try { lock = await open(join(paths.skills, '.babelbird-install.lock'), 'wx', 0o600); }
  catch { throw new Error('Another installation may be running / 另一个安装可能正在进行，请稍后重试。'); }
  const stages = [];
  try {
    for (const name of names) await owned(join(paths.skills, name));
    for (const name of names) {
      const destination = join(paths.skills, name);
      const stage = `${destination}.${randomBytes(8).toString('hex')}.new`;
      stages.push(stage);
      await cp(join(source, name), stage, { recursive: true, errorOnExist: true, force: false });
      if (name === 'babelbird-setup') await writeFile(join(stage, 'installed-host.json'), JSON.stringify({ host }) + '\n');
      const files = await hashes(stage);
      await writeFile(join(stage, receiptName), JSON.stringify({ owner: 'bypassdesign-dev/babelbird-plugins', version: '0.5.1', files }) + '\n');
    }
    for (let i = 0; i < names.length; i++) {
      const destination = join(paths.skills, names[i]);
      const exists = await owned(destination);
      const backup = `${destination}.${randomBytes(8).toString('hex')}.previous`;
      if (exists) await rename(destination, backup);
      try { await rename(stages[i], destination); }
      catch (error) { if (exists) await rename(backup, destination); throw error; }
      if (exists) await rm(backup, { recursive: true });
    }
    return {
      host, version: '0.5.1', skills: paths.skills,
      ...(personal
        ? { stage: 'experimental', connectionMode: 'platform_credentials', setupGuide: join(paths.skills, 'babelbird-setup/references/personal-agents.md') }
        : { setupScript: join(paths.skills, 'babelbird-setup/scripts/setup-host.mjs') }),
    };
  } finally {
    for (const stage of stages) await rm(stage, { recursive: true, force: true });
    await lock.close();
    await rm(join(paths.skills, '.babelbird-install.lock'), { force: true });
  }
}

async function main(args) {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('Node.js 20+ is required / 需要 Node.js 20 或更新版本。');
  if (args.length === 1 && args[0] === '--list') { console.log(JSON.stringify({ ...HOSTS, ...PERSONAL_HOSTS })); return; }
  let host, skillsDirectory, codexBin = 'codex', noOpen = false, installOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') host = args[++i];
    else if (args[i] === '--skills-dir') {
      skillsDirectory = args[++i];
      if (!skillsDirectory || skillsDirectory.startsWith('--')) throw new Error('--skills-dir requires a directory / 缺少技能目录。');
    }
    else if (args[i] === '--codex-bin') codexBin = args[++i];
    else if (args[i] === '--no-open') noOpen = true;
    else if (args[i] === '--install-only') installOnly = true;
    else throw new Error('Usage: node install/install.mjs --host <host> [--codex-bin <path>]');
  }
  const installed = await installSkills(host, { skillsDirectory });
  if (installOnly) { console.log(JSON.stringify({ ...installed, status: 'installed_not_connected' })); return; }
  if (installed.connectionMode === 'platform_credentials') {
    console.log(JSON.stringify({ ...installed, status: 'requires_platform_setup', message: 'Continue with setupGuide to open the native credential form / 继续读取 setupGuide，打开平台原生密钥表单；尚未连接。' }));
    return;
  }
  const setupArgs = [installed.setupScript, '--host', host, '--start', '--codex-bin', codexBin, ...(noOpen ? ['--no-open'] : [])];
  try {
    const launched = await exec(process.execPath, setupArgs, { timeout: 20000, windowsHide: true });
    console.log(JSON.stringify({ ...installed, ...JSON.parse(launched.stdout) }));
  } catch {
    console.log(JSON.stringify({ ...installed, status: 'setup_failed', message: 'Skills installed; ask the agent to start setupScript / 技能已安装，请让智能体重新打开填写页。' }));
    process.exitCode = 1;
  }
}
if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    const safe = error?.code ? 'Local installation failed; check file access / 本机安装失败，请检查文件权限。' : error.message;
    console.log(JSON.stringify({ status: 'error', message: safe }));
    process.exitCode = 1;
  });
}
