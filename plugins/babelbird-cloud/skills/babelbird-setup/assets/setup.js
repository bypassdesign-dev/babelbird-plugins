const form = document.getElementById('connect-form');
const keyInput = document.getElementById('api-key');
const button = document.getElementById('submit');
const result = document.getElementById('result');

function message(text, state) {
  result.hidden = false;
  result.dataset.state = state;
  result.textContent = text;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled) return;
  const apiKey = keyInput.value.trim();
  if (!apiKey) { message('请先粘贴 API Key。', 'error'); keyInput.focus(); return; }
  button.disabled = true;
  button.textContent = '正在连接…';
  message('正在检查连接并保存设置，请稍候。', 'loading');
  try {
    const response = await fetch('connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const data = await response.json();
    if (!response.ok || data.status !== 'connected') {
      message(data.error || '连接未完成，请重试。', 'error');
      return;
    }
    keyInput.value = '';
    form.hidden = true;
    document.getElementById('acquire').hidden = true;
    message('已连接巴别鸟。密钥已保存，个人文件读取检查通过。可以关闭此页，回到 Codex 继续。', 'success');
    result.focus();
  } catch {
    message('设置页已关闭或连接中断。请回到 Codex，让智能体重新打开填写页面。', 'error');
  } finally {
    button.disabled = false;
    button.textContent = '保存并连接';
  }
});

fetch('status').then(response => response.json()).then(data => {
  const remaining = Date.parse(data.expiresAt) - Date.now();
  if (remaining > 0) setTimeout(() => {
    if (form.hidden || button.disabled) return;
    button.disabled = true;
    message('设置页已过期。请回到 Codex，让智能体重新打开填写页面。', 'error');
  }, remaining);
}).catch(() => { message('设置页已关闭。请回到 Codex，让智能体重新打开填写页面。', 'error'); });
