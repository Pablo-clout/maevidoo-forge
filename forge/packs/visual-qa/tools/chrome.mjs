/*
 * Shared by the Forge UI tools: start the system Chrome headless and talk to one page over the
 * DevTools protocol. No dependency: Node built-ins only (fetch and WebSocket need Node 22+).
 *
 *   const page = await openPage({ onEvent(message) {} });
 *   await page.send('Page.navigate', { url });  await page.once('Page.loadEventFired');
 *   const value = await page.evaluate('document.title');
 *   page.close();
 *
 * Chrome is found automatically; set CHROME_PATH to override. Every call starts a fresh browser with
 * an empty profile, removed on close.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? null;
}

const SANDBOX_ERROR = /sandbox\/linux|No usable sandbox|--no-sandbox|SUID sandbox/i;

async function launchChrome(chromePath, { noSandbox }) {
  const profile = mkdtempSync(join(tmpdir(), 'forge-ui-'));
  const args = [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  ];
  if (noSandbox) args.push('--no-sandbox', '--disable-dev-shm-usage');
  args.push('about:blank');

  const chrome = spawn(chromePath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const close = () => {
    try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
  };

  let buffer = '';
  try {
    const wsUrl = await new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error('Chrome did not start in 15s')), 15000);
      chrome.stderr.on('data', (chunk) => {
        buffer += chunk;
        const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) { clearTimeout(timer); done(match[1]); }
      });
      chrome.on('exit', () => {
        clearTimeout(timer);
        reject(new Error('Chrome exited before it was ready'));
      });
    });
    process.on('exit', close);
    return { wsUrl, close };
  } catch (err) {
    close();
    err.stderr = buffer;
    throw err;
  }
}

export async function openPage({ onEvent = () => {} } = {}) {
  const chromePath = findChrome();
  if (!chromePath) throw new Error('no Chrome/Chromium/Edge found — set CHROME_PATH');
  const forceNoSandbox = /^(1|true)$/i.test(process.env.CHROME_NO_SANDBOX ?? '');
  let launched;
  try {
    launched = await launchChrome(chromePath, { noSandbox: forceNoSandbox });
  } catch (err) {
    if (!forceNoSandbox && process.platform === 'linux' && SANDBOX_ERROR.test(err.stderr ?? '')) {
      process.stderr.write('forge: Chrome started without its sandbox (container)\n');
      launched = await launchChrome(chromePath, { noSandbox: true });
    } else {
      throw err;
    }
  }
  const { wsUrl, close } = launched;
  const port = new URL(wsUrl).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const socket = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.onopen = done; socket.onerror = () => reject(new Error('cannot attach')); });

  let nextId = 0;
  const pending = new Map();
  const waiters = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onEvent(message);
    if (message.id && pending.has(message.id)) {
      const { done, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else done(message.result);
    } else if (message.method && waiters.has(message.method)) {
      waiters.get(message.method)();
      waiters.delete(message.method);
    }
  };
  const send = (method, params = {}) => new Promise((done, reject) => {
    const id = ++nextId;
    pending.set(id, { done, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const once = (method, ms = 15000) => new Promise((done) => {
    const timer = setTimeout(done, ms);
    waiters.set(method, () => { clearTimeout(timer); done(); });
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  return { send, once, evaluate, close: () => { try { socket.close(); } catch { /* closed */ } close(); } };
}
