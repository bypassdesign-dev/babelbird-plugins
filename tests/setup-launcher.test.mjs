import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserCommand } from '../plugins/babelbird-cloud/skills/babelbird-setup/scripts/setup-codex.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('../plugins/babelbird-cloud/skills/babelbird-setup/scripts/setup-codex.mjs', import.meta.url));
test('browser opening uses a platform-specific executable without a shell', () => {
  assert.equal(browserCommand('darwin', 'http://127.0.0.1/')[0], 'open');
  assert.equal(browserCommand('win32', 'http://127.0.0.1/')[0], 'rundll32.exe');
  assert.equal(browserCommand('linux', 'http://127.0.0.1/')[0], 'xdg-open');
});
test('launcher exits while its private temporary page stays alive and a second start reuses it', { timeout: 20000 }, async () => {
  const home = await mkdtemp(join(tmpdir(), 'babelbird-launch-test-'));
  let pid;
  try {
    const options = { env: { ...process.env, CODEX_HOME: home }, timeout: 10000 };
    const run = async args => JSON.parse((await exec(process.execPath, [script, ...args], options)).stdout);
    const first = await run(['--start', '--no-open']);
    pid = first.pid;
    assert.equal(first.status, 'waiting');
    assert.equal((await fetch(first.url)).status, 200);
    const again = await run(['--start', '--no-open']);
    assert.equal(again.url, first.url);
    assert.equal(again.pid, first.pid);
    assert.equal((await run(['--status'])).status, 'waiting');
    if (process.platform !== 'win32') assert.equal((await stat(join(home, 'babelbird-setup/status.json'))).mode & 0o777, 0o600);
  } finally {
    if (pid) process.kill(pid, 'SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));
    await rm(home, { recursive: true, force: true });
  }
});
