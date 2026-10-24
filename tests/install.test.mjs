import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { installSkills } from '../install/install.mjs';
import { HOSTS } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/host-config.mjs';
const exec = promisify(execFile);

for (const host of Object.keys(HOSTS)) test(`install ${host}: self-contained skills, repeat install and live form`, async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-install-'));
  let pid;
  try {
    const options = { home, env: {} };
    const installed = await installSkills(host, options);
    const again = await installSkills(host, options);
    assert.equal(again.setupScript, installed.setupScript);
    await access(join(installed.skills, 'babelbird-project-cloud/scripts/project-sync.mjs'));
    const environment = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: join(home, '.codex'), WORKBUDDY_CONFIG_DIR: join(home, '.workbuddy'), CODEBUDDY_CONFIG_DIR: join(home, '.codebuddy'), CLAUDE_CONFIG_DIR: '' };
    const launched = JSON.parse((await exec(process.execPath, [installed.setupScript, '--host', host, '--start', '--no-open'], { env: environment, timeout: 15000 })).stdout);
    pid = launched.pid;
    assert.equal(launched.host, host);
    assert.equal(launched.status, 'waiting');
    const response = await fetch(`${launched.url}status`);
    assert.equal((await response.json()).host, host);
    assert.equal((await fetch(`${launched.url}messages.mjs`)).status, 200);
    await writeFile(join(installed.skills, 'babelbird-setup', 'SKILL.md'), 'user custom content');
    await assert.rejects(installSkills(host, options), /modified|修改/);
    assert.equal(await readFile(join(installed.skills, 'babelbird-setup', 'SKILL.md'), 'utf8'), 'user custom content');
  } finally {
    if (pid) process.kill(pid, 'SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 120));
    await rm(home, { recursive: true, force: true });
  }
});

test('unmanaged same-name skill is not overwritten', async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-unmanaged-'));
  try {
    await mkdir(join(home, '.cursor/skills/babelbird-setup'), { recursive: true });
    await writeFile(join(home, '.cursor/skills/babelbird-setup/SKILL.md'), 'custom');
    await assert.rejects(installSkills('cursor', { home, env: {} }), /existing|已有/);
    assert.equal(await readFile(join(home, '.cursor/skills/babelbird-setup/SKILL.md'), 'utf8'), 'custom');
  } finally { await rm(home, { recursive: true, force: true }); }
});
