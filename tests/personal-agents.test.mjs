import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { installSkills } from '../install/install.mjs';
import { bindProject, readBinding } from '../plugins/babelbird-cloud/skills/babelbird-project-cloud/scripts/project-sync.mjs';
const exec = promisify(execFile);

for (const host of ['muse', 'today']) {
  test(`${host} installs in the discovered Skills directory without writing host credentials or starting localhost`, async () => {
    const home = await mkdtemp(join(tmpdir(), 'babelbird-personal-'));
    try {
      const skillsDirectory = join(home, 'platform-selected', 'skills');
      const config = join(home, 'platform-settings.json');
      await writeFile(config, '{"existing":"preserve"}');
      const installed = await installSkills(host, { home, env: {}, skillsDirectory });
      assert.equal(installed.connectionMode, 'platform_credentials');
      assert.equal(installed.skills, skillsDirectory);
      assert.equal(installed.setupScript, undefined);
      await access(installed.setupGuide);
      await access(join(skillsDirectory, 'babelbird-project-cloud/scripts/project-sync.mjs'));
      const result = JSON.parse((await exec(process.execPath, [join(skillsDirectory, 'babelbird-setup/scripts/setup-host.mjs'), '--start'], { env: { ...process.env, HOME: home } })).stdout);
      assert.equal(result.status, 'requires_platform_setup');
      assert.equal(result.host, host);
      assert.equal(result.url, undefined);
      assert.equal(result.pid, undefined);
      assert.equal(await readFile(config, 'utf8'), '{"existing":"preserve"}');
      await installSkills(host, { home, env: {}, skillsDirectory });
      await writeFile(join(skillsDirectory, 'babelbird-setup/SKILL.md'), 'user edits');
      await assert.rejects(installSkills(host, { home, env: {}, skillsDirectory }), /modified|修改/);
    } finally { await rm(home, { recursive: true, force: true }); }
  });

  test(`${host} requires a known absolute Skills directory`, async () => {
    await assert.rejects(installSkills(host, { skillsDirectory: undefined }), /Skills directory|技能目录/);
    await assert.rejects(installSkills(host, { skillsDirectory: 'guess/skills' }), /absolute|绝对/);
  });

  test(`${host} binds the chosen existing cloud project and keeps instructions`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'babelbird-personal-project-'));
    try {
      await writeFile(join(root, 'AGENTS.md'), '# User instructions\n');
      const cloud = { endpoint: 'https://www.babel.cc/mcp', folderId: '321', path: '/个人文件/codex/shared' };
      await bindProject(root, cloud, host);
      assert.equal((await readBinding(root)).host, host);
      assert.deepEqual((await readBinding(root)).cloud, cloud);
      assert.match(await readFile(join(root, 'AGENTS.md'), 'utf8'), /^# User instructions/);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}

test('personal installation refuses an unmanaged existing Skill', async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-personal-existing-'));
  try {
    const skillsDirectory = join(home, 'skills');
    await mkdir(join(skillsDirectory, 'babelbird-setup'), { recursive: true });
    await writeFile(join(skillsDirectory, 'babelbird-setup/SKILL.md'), 'custom');
    await assert.rejects(installSkills('today', { skillsDirectory }), /existing|已有/);
    assert.equal(await readFile(join(skillsDirectory, 'babelbird-setup/SKILL.md'), 'utf8'), 'custom');
  } finally { await rm(home, { recursive: true, force: true }); }
});
