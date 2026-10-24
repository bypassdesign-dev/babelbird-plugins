import { fileURLToPath } from 'node:url';
import { realpath } from 'node:fs/promises';
import { main } from './setup-host.mjs';
import { SetupError } from './mcp-check.mjs';
export { browserCommand } from './setup-host.mjs';

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(['--host', 'codex', ...process.argv.slice(2)]).catch(error => {
    console.log(JSON.stringify({ status: 'error', message: error instanceof SetupError ? error.message : 'Unable to start local setup / 无法启动本地设置页。' }));
    process.exitCode = 1;
  });
}
