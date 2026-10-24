import { messages, languageFor } from './messages.mjs';

const form = document.getElementById('connect-form');
const keyInput = document.getElementById('api-key');
const button = document.getElementById('submit');
const result = document.getElementById('result');
let language = languageFor(navigator.language), host = '', hostName = '', busy = false, expired = false, current;

function render() {
  const copy = messages[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = copy.title;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = copy[element.dataset.i18n]; });
  document.getElementById('brand').textContent = copy.brand + (hostName ? ` · ${hostName}` : '');
  document.getElementById('language').textContent = language === 'zh' ? 'English' : '中文';
  keyInput.placeholder = copy.placeholder;
  button.textContent = busy ? copy.connecting : copy.submit;
  button.disabled = busy || expired;
  if (current) {
    result.hidden = false;
    result.dataset.state = current.state;
    let text = current.error ? (copy.errors[current.error] || copy.errors.connection) : copy[current.key];
    if (current.key === 'success') text += ' ' + (host === 'workbuddy' ? copy.workbuddyNext : copy.next);
    result.textContent = text.replaceAll('{host}', hostName || (language === 'zh' ? '智能体' : 'your agent'));
  }
}
function message(key, state, error) { current = { key, state, error }; render(); }
document.getElementById('language').addEventListener('click', () => { language = language === 'zh' ? 'en' : 'zh'; render(); });

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || expired || form.hidden) return;
  const apiKey = keyInput.value.trim();
  if (!apiKey) { message('empty', 'error'); keyInput.focus(); return; }
  busy = true;
  message('checking', 'loading');
  try {
    const response = await fetch('connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const data = await response.json();
    if (!response.ok || data.status !== 'connected') {
      if (data.saved) {
        keyInput.value = '';
        form.hidden = true;
        document.getElementById('acquire').hidden = true;
      }
      message(null, 'error', data.code || 'connection');
      return;
    }
    host = data.host; hostName = data.hostName;
    keyInput.value = '';
    form.hidden = true;
    document.getElementById('acquire').hidden = true;
    message('success', 'success');
    result.focus();
  } catch { message('closed', 'error'); }
  finally { busy = false; render(); }
});

render();
fetch('status').then(response => response.json()).then(data => {
  host = data.host; hostName = data.hostName;
  render();
  const remaining = Date.parse(data.expiresAt) - Date.now();
  setTimeout(() => {
    if (form.hidden) return;
    expired = true;
    if (!busy) message('expired', 'error');
  }, Math.max(0, remaining));
}).catch(() => { message('closed', 'error'); });
