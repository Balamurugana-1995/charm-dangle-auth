const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('charmAPI', {
  onSelectCharm: (cb) => ipcRenderer.on('select-charm', (e, id) => cb(id)),
  onPerformRitual: (cb) => ipcRenderer.on('perform-ritual', () => cb()),
  onSetHidden: (cb) => ipcRenderer.on('set-hidden', (e, hidden) => cb(hidden)),
  setHovering: (hovering) => ipcRenderer.send('hover-state', hovering)
});
