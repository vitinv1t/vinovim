// Ponte segura entre a app de PC e a página do vinovim
const { contextBridge, ipcRenderer } = require('electron');
const info = ipcRenderer.sendSync('vinovim:info');
contextBridge.exposeInMainWorld('vinovimNative', {
  platform: info.platform,
  version: info.version,
  remote: info.remote,
  rpc: p => ipcRenderer.send('vinovim:rpc', p || null)
});
