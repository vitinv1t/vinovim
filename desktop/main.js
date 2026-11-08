// vinovim — app de computador (Windows, macOS, Linux)
const { app, BrowserWindow, shell, Menu, session, ipcMain, nativeImage, net } = require('electron');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

let REMOTE = '';
try { REMOTE = (require('./remote.json').url || '').replace(/\/$/, ''); } catch (e) {}
const LOCAL = path.join(__dirname, '..', 'www', 'index.html');
const DISCORD_ID = '1568993132744286261';
const IS_WIN = process.platform === 'win32';
let win = null, pendingOpen = null, pageReady = false;

/* ---------- só uma janela: os atalhos do menu Iniciar abrem na janela que já existe ---------- */
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', (e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
    handleArgs(argv);
  });
}
if (IS_WIN) app.setAppUserModelId('app.vinovim');
function parseArgs(argv) {
  const o = {};
  for (const a of argv || []) {
    let m = /^--vv-open=(movie|series):(.+)$/.exec(a); if (m) { o.type = m[1]; o.id = m[2]; }
    m = /^--vv-route=([a-z]+)$/.exec(a); if (m) o.route = m[1];
  }
  return (o.id || o.route) ? o : null;
}
function handleArgs(argv) {
  const o = parseArgs(argv); if (!o) return;
  if (win && pageReady) win.webContents.send('vinovim:open', o); else pendingOpen = o;
}

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
  e.returnValue = { version: app.getVersion(), remote: REMOTE, platform: IS_WIN ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux' };
});
/* ---------- atualizar a app sem ir ao site: descarrega o instalador novo e instala-o sozinho ---------- */
let updating = false;
ipcMain.handle('vinovim:update', async (e, url) => {
  if (!IS_WIN) throw new Error('Só no Windows');
  if (updating) return false;
  if (!/^https:\/\/[a-z0-9.-]+\.vercel\.app\/downloads\/[\w.-]+\.exe$/i.test(String(url || ''))) throw new Error('Endereço inválido');
  updating = true;
  const file = path.join(os.tmpdir(), 'Vinovim-Setup-' + Date.now() + '.exe');
  try {
    await new Promise((resolve, reject) => {
      const req = net.request(url);
      req.on('response', res => {
        if (res.statusCode !== 200) return reject(new Error('Erro ' + res.statusCode));
        const total = parseInt([].concat(res.headers['content-length'] || 0)[0], 10) || 0;
        let got = 0, last = 0;
        const out = fs.createWriteStream(file);
        res.on('data', c => {
          out.write(c); got += c.length;
          const now = Date.now();
          if (total && win && now - last > 150) { last = now; win.webContents.send('vinovim:update-progress', got / total); }
        });
        res.on('end', () => out.end(() => resolve()));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });
    if (win) win.webContents.send('vinovim:update-progress', 1);
    // /S instala sem perguntas; --force-run volta a abrir o Vinovim no fim
    spawn(file, ['/S', '--force-run'], { detached: true, stdio: 'ignore' }).unref();
    setTimeout(() => app.quit(), 1200);
    return true;
  } catch (err) {
    updating = false;
    try { fs.unlinkSync(file); } catch (x) {}
    throw err;
  }
});
ipcMain.on('vinovim:ready', () => { pageReady = true; if (pendingOpen && win) { win.webContents.send('vinovim:open', pendingOpen); pendingOpen = null; } });

/* ---------- menu Iniciar e barra de tarefas: “Continuar a ver” ---------- */
const clean = (s, n) => String(s || '').replace(/[\r\n"]/g, ' ').trim().slice(0, n);
ipcMain.on('vinovim:jumplist', (e, items) => {
  if (!IS_WIN) return;
  try {
    const exe = process.execPath;
    const cont = (items || []).slice(0, 6).filter(it => it && it.id && /^(movie|series)$/.test(it.type)).map(it => ({
      type: 'task', title: clean(it.title, 60) || 'Vinovim', description: clean(it.sub, 120) || 'Continuar a ver',
      program: exe, args: '--vv-open=' + it.type + ':' + clean(it.id, 60).replace(/\s/g, ''), iconPath: exe, iconIndex: 0
    }));
    const tasks = [
      { type: 'task', title: 'Pesquisar', description: 'Procurar filmes e séries', program: exe, args: '--vv-route=search', iconPath: exe, iconIndex: 0 },
      { type: 'task', title: 'A minha biblioteca', description: 'A tua lista e o que estás a ver', program: exe, args: '--vv-route=library', iconPath: exe, iconIndex: 0 },
      { type: 'task', title: 'Calendário de estreias', description: 'Próximos episódios', program: exe, args: '--vv-route=calendar', iconPath: exe, iconIndex: 0 }
    ];
    const list = [];
    if (cont.length) list.push({ type: 'custom', name: 'Continuar a ver', items: cont });
    list.push({ type: 'tasks', items: tasks });
    app.setJumpList(list);
  } catch (err) {}
});

/* ---------- botões na miniatura da barra de tarefas + progresso no ícone ---------- */
const ICONS = {"play": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABQ0lEQVR4Xu2WPU4DMRBGhwAd4V/iCrkGBVDRcwGuAXeiQHAjiiBBCYE8NMGWhmh/vNZMRLGvWyVav535PLbIyEghwBawXfh3X4Cd/EZg1/ftHehX68/AKfAAXKXnyUaqYQT2+GUJ3OfFU1tWkiEYgQPgNUkoz8ClaUtMNozAPvCeKvBhRLQtJ6kt/iFtEMht+Eoyyhy4Dglph0BGRTJPwIVrSAsEckU0nMrCNaSFArYa3+nBJ6QDBTKfTSGtolJAsSF9AW6AI1gNsD9zY1Jl1o/OhaWILETkTERuRWQmIrp4+eCqrIAGModSK3FnJ2e/u6FCoG1b6pAaXu0BAjGDqVCgMfUu94ceAf1q332/TouALhoz+QoEYmd/h8AUeEsTLu706xDQC4keNI/Acdj53wZwCJyH34BKWJ/lG8FlT4/8V34AL6uQ6ou6fAsAAAAASUVORK5CYII=", "pause": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABJElEQVR4Xu1XXWvCQBCcta1iqULxz+of89kf09dCC6UoRUdGduG8Xr4oJXm4gWPN7uS8nQR2AlSMDOv6f5JFjpkxv7fELfEmhVYFvKMX4BdP3X+l3ZFcANBSTftGPJnZaVDXISXJFck3kp8kP3zpt3IrbUpy7nHrvPcsbr3+VDrEY8fJ1MkrgOeMp/ty9ZYA1gUFlG/ErK3o+PFNL8BtSVrlcqS14Cgq34guBQR1mnabX6eIWhpb0UeBf0U9QFWgKlAVqApUBUZXoM841uwPTxDjuckPBFcIzp/8gOb6pjCPlcsdkbyjbFdYr4jKDzMkidk8Ati52Uwhk6macPa4B/DtDkiPVp0rHjLetNDnw6ToZs3s7j0gqW4fCu2dzaz1PagYFVcqxoJ0AZH9fQAAAABJRU5ErkJggg==", "back": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACIElEQVR4Xu2WMW4UQRRE66/Xsk1iiYAbcAgkxw5AMjghNTfgApYAhw7tC3ADQAIfgRsgAs5gR6yshd0tVK3fqGemZ7pbSET7pNUkNd3/V9fvHWDLln+A5Kzl9Vb9JCTnEsRniVb9KCQtdkLyjOT5VCElfbOFZkYAM9/4PYAHXq31q1ahJX2wsQaSO2a21hPARwDPdAIA7nPv1+qrHEgWewjgk2/+EwhdD9Zo0RcLILnnnT8F8MM3XwPYG+m8ST96BAqPOjSzJUnZrc5lvzbXc9MrIISzQR/IOtALzxs/87ipnh282JWHs6hPGTgwEh51G9KfsV3hpM/5Bz+iKX2HwYJ+3mnYlr7xYMycBckDAJ9985I+X4Bs999LAN9LYfMciOcAvgE49nxkwzlGegTqUOf7CsAjAL+ByXsiuvfEF5ftxanqk76wMbNfAE4AKEhhCjJpjyh04hLA6wp9lr8F+JUpVMgFgBduqTQavT4KpViY2RWA04J+uoCImW388vnibtwl859D2Zmbme4JuVfSd8iemV8mGq8bAI8BqBjlQwkfOGFmK5L7lfpyASL+8ZiZOlLSVYQSHme8T/ijatAHJlPrReh6VQaUibdegMI5yEWrvliAO6FMhGkws3dJOKMbHTxD1fqqudWEZMJ56w7mnGjSN+EfJHoekvxK8loLkNzNLdSqr6K36JEXMOpmq74Kz0U1rfoq0i/eGlr1W/4LfwD0LoSocUCVXwAAAABJRU5ErkJggg==", "fwd": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB10lEQVR4Xu2WvU4DMRCEbQIVPxJQwCvwEDRAgxASj0mNoEABiReKxE8FIRk0xnta7rxnbyqKfFJ0+Rn75tbjdUJYs6YAgOgpjFdvAmAiP+r3Fl792ETpiQEcA7gFsJU/d4Y08sSt+ipqwm388gTgIptIZgwDTfoqysAegFk28Q3gqlQJr75Kb8I3IN18AWAO4Dqb2FA6WTIaruqrFAwQGuCL3AHYBJIJXvsGRvWrGliqpSD3NKBzAXQVIGP6Ypg7jCeSCclXNjNV4ZwYBiz9IMweA4S5kFJLOPcBvOfvtWFLX65EQwUEhlLCeclGBODVMEC0PoU5L+HfTuswIGstT/usDFhQS9O8MsxHOczJRAqVEw5c5jFnIYTdynjR88oqnMQYOT7dexUD8xAC1/IxhMAszKSyhhHquRWnIYTzGOMLKxBjXHhDqIP1oNbzYyQDEly9hYdBbMiArCPhOsphdWiEsK/vmlixShUDgyTn9EejD5T0XRv3GijtfW496YhyFsjuKOqrITcq8FnoflL60llg6qv0DLCxyD4vhserr6Im3MnHq4StGB6vvoqa8ABI2+omt8xieLz6ZoB0uJzKzWsDvfpmJOWtePUmLG3L33HVBV36Nf+SH+96ORHNXiGFAAAAAElFTkSuQmCC", "next": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB+UlEQVR4Xu1WwUrDQBScV6160FaoiD/kTfHmH/gR3gp68z/8AD16E/wFwbsHbyIqKNWOTNktm22S3SSKlw6ENOnuezPzdjcPWOKfYX+Vn+RCbDNjo3xlQX4bpQ6QXDGzbyULf+fCEd8ECvGl/q3WBa+Y5B7JS5I7joTluBHM3yL5SPKF5LO763nLxysVEwWYuMkHfrDcqHMhmD8g+c4i9DyICfQqAorhK4BtANckr0iOVBYlyXEDwEQVBKBS6q7nBVQREKRWE6cADgE8kDxQDXWl3HD1l5DwakQgDCIVow5uVKLOgRDeDTnSxo3OBLLciLZdFnIdyHVjmrE2CmhDIOkGgK9cN9oS8IjXxj3JYwDa79o9SawmR6Sh2ku1Eu4COAHwVLXvY3R1QNABIycUa2xm+wDuAGykuaOTA1It9X0ANwAuzEx3QSWYfcxSaFsCqVZiJRkDOHfH9JpzxJNLoimBUtUke277TdwxnUzs0YRAleq+mc0+NJkfqQJyCEi1Flih1l61T94WdQTkow4UjYlrPVfdFVUEfBH1/3yFN1StsujS+SAHS/uBAoKOZuS6oTN/tpNUCWoRzB9G3ZDHMF4rBQeChlGsj8zs1nVAWbUO5n8AOAWw7poanRefwOx9fntOMmeRdkJVW673Pd+at0FZybrumCX+BD9AQn19VU1T0wAAAABJRU5ErkJggg=="};
const icon = k => nativeImage.createFromDataURL(ICONS[k]);
let lastThumb = '';
ipcMain.on('vinovim:playing', (e, s) => {
  if (!win || win.isDestroyed()) return;
  try {
    if (!s) { win.setProgressBar(-1); if (IS_WIN) win.setThumbarButtons([]); lastThumb = ''; win.setTitle('vinovim'); return; }
    win.setProgressBar(s.progress > 0 && s.progress < 1 ? s.progress : -1, { mode: s.playing ? 'normal' : 'paused' });
    if (s.title) win.setTitle(s.title + ' · vinovim');
    if (!IS_WIN) return;
    const key = (s.playing ? 1 : 0) + ':' + (s.hasNext ? 1 : 0);
    if (key === lastThumb) return; lastThumb = key;
    const send = c => () => win && !win.isDestroyed() && win.webContents.send('vinovim:cmd', c);
    const btns = [
      { tooltip: 'Recuar 10 segundos', icon: icon('back'), click: send('back') },
      { tooltip: s.playing ? 'Pausar' : 'Reproduzir', icon: icon(s.playing ? 'pause' : 'play'), click: send('toggle') },
      { tooltip: 'Avançar 10 segundos', icon: icon('fwd'), click: send('fwd') }
    ];
    if (s.hasNext) btns.push({ tooltip: 'Próximo episódio', icon: icon('next'), click: send('next') });
    win.setThumbarButtons(btns);
  } catch (err) {}
});

/* ---------- janela ---------- */
function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 900, minHeight: 600,
    backgroundColor: '#09080d', title: 'Vinovim', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'www', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);
  win.on('closed', () => { win = null; });
  win.webContents.on('did-start-navigation', (e, url, inPlace, isMain) => { if (isMain && !inPlace) pageReady = false; });

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
  handleArgs(process.argv);
  createWindow();
});
app.on('window-all-closed', () => { try { rpc && rpc.destroy(); } catch (e) {} if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
