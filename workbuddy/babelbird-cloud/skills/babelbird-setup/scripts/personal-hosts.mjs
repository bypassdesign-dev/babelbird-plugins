import { fileURLToPath } from 'node:url';

export const PERSONAL_HOSTS = Object.freeze({
  muse: { name: 'Meta Muse (personal agent)', stage: 'experimental', connectionMode: 'platform_credentials' },
  today: { name: 'today.ai', stage: 'experimental', connectionMode: 'platform_credentials' },
});

export function platformSetup(host) {
  if (!Object.hasOwn(PERSONAL_HOSTS, host)) throw new Error('Unknown personal agent');
  return {
    host,
    status: 'requires_platform_setup',
    connectionMode: 'platform_credentials',
    setupGuide: fileURLToPath(new URL('../references/personal-agents.md', import.meta.url)),
    message: 'Continue with the platform credential form and verify actual tools / 请继续打开平台原生密钥表单，并验证实际工具；尚未连接。',
  };
}
