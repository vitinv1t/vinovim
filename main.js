// vinovim — app de computador (Windows, macOS, Linux)
const { app, BrowserWindow, shell, Menu, session, ipcMain } = require('electron');
const path = require('path');

let REMOTE = '';
try { REMOTE = (require('./remote.json').url || '').replace(/\/$/, ''); } catch (e) {}
const LOCAL = path.join(__dirname, '..', 'www', 'index.html');
const DISCORD_ID = '1568993132744286261';

/* ---------- Discord Rich Presence ---------- */
let rpc = null, rpcReady = false, pending = null, retry = null;
function rpcConnect() {
  if (rpc || retry) return;
  let RPC; try { RPC = require('discord-rpc'); } catch (e) { return; }
  rpc = new RPC.Client({ transport: 'ipc' });
  rpc.on('ready', () => { rpcReady = true; rpcApply(pending); });
  rpc.on('disconnected', () => { rpc = null; rpcReady = false; rpcRetry(); });
  rpc.login({ clientId: DISCORD_ID }).catch(() => { rpc = null; rpcReady = false; rpcRetry(); });
}
function rpcRetry() { if (retry || !pending) return; retry = setTimeout(() => { retry = null; rpcConnect(); }, 20000); }
const clip = s => { s = String(s || '').trim(); while (s.length < 2) s += ' '; return s.slice(0, 128); };
function rpcApply(p) {
  pending = p;
  if (!p) { if (rpcReady) rpc.clearActivity().catch(() => {}); return; }
  if (!rpcReady) return rpcConnect();
  const a = { details: clip(p.details), state: clip(p.state), largeImageKey: p.image || 'logo', largeImageText: clip(p.imageText || 'vinovim'), instance: false };
  if (p.start) a.startTimestamp = new Date(p.start);
  if (p.end) a.endTimestamp = new Date(p.end);
  if (p.buttons && p.buttons.length) a.buttons = p.buttons.slice(0, 2);
  rpc.setActivity(a).catch(() => {});
}
ipcMain.on('vinovim:rpc', (e, p) => rpcApply(p));
ipcMain.on('vinovim:info', e => {
  e.returnValue = { version: app.getVersion(), remote: REMOTE, platform: process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux' };
});

/* ---------- janela ---------- */
function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 900, minHeight: 600,
    backgroundColor: '#09080d', title: 'vinovim', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'www', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);

  // Carrega a versão online (atualiza-se sozinha); sem internet usa a cópia local
  let fellBack = false;
  const loadLocal = () => { if (fellBack) return; fellBack = true; win.loadFile(LOCAL); };
  if (REMOTE) {
    win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && url.startsWith(REMOTE)) loadLocal(); });
    win.loadURL(REMOTE + '/').catch(loadLocal);
  } else loadLocal();

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F5') { win.webContents.reload(); e.preventDefault(); }
    if (input.control && input.shift && input.key.toLowerCase() === 'i') win.webContents.toggleDevTools();
  });
}

app.whenReady().then(() => {
  // O YouTube exige um "Referer" para mostrar trailers incorporados (evita o erro 153)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.googlevideo.com/*', '*://*.ytimg.com/*'] },
    (details, callback) => {
      if (!details.requestHeaders['Referer']) details.requestHeaders['Referer'] = REMOTE ? REMOTE + '/' : 'https://vinovim.app/';
      callback({ requestHeaders: details.requestHeaders });
    }
  );
  createWindow();
});
app.on('window-all-closed', () => { try { rpc && rpc.destroy(); } catch (e) {} if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
