// Ponte segura entre a app de PC e a página do vinovim
const { contextBridge, ipcRenderer } = require('electron');
const info = ipcRenderer.sendSync('vinovim:info');
contextBridge.exposeInMainWorld('vinovimNative', {
  platform: info.platform,
  version: info.version,
  remote: info.remote,
  rpc: p => ipcRenderer.send('vinovim:rpc', p || null),
  jumpList: items => ipcRenderer.send('vinovim:jumplist', items || []),
  playing: s => ipcRenderer.send('vinovim:playing', s || null),
  onCommand: cb => ipcRenderer.on('vinovim:cmd', (e, c) => cb(c)),
  onOpen: cb => { ipcRenderer.on('vinovim:open', (e, o) => cb(o)); ipcRenderer.send('vinovim:ready'); }
});
