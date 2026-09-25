const { contextBridge, ipcRenderer } = require('electron');

// Extract view type from process arguments (--view-type=dock or --view-type=config)
const viewArg = process.argv.find(arg => typeof arg === 'string' && arg.startsWith('--view-type='));
const viewType = viewArg ? viewArg.split('=')[1] : null;

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  viewType: viewType,
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config, items) => ipcRenderer.invoke('save-config', { config, items }),
  hideConfig: () => ipcRenderer.send('hide-config'),
  setDockSize: (width, height) => ipcRenderer.send('set-dock-size', { width, height }),
  toggleDock: () => ipcRenderer.send('toggle-dock'),
  openConfig: () => ipcRenderer.send('open-config'),
  quitApp: () => ipcRenderer.send('quit-app'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  onConfigUpdated: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('config-updated', handler);
    return () => ipcRenderer.removeListener('config-updated', handler);
  }
});
