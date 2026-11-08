// vinovim — app de computador (Windows, macOS, Linux)
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#09080d',
    title: 'vinovim',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'www', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));

  // links externos (YouTube, "abrir noutra app") abrem no browser do sistema
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // F11 ecrã inteiro, Ctrl+Shift+I ferramentas de programador
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.control && input.shift && input.key.toLowerCase() === 'i') win.webContents.toggleDevTools();
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
