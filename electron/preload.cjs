const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: (key) => ipcRenderer.invoke('load-data', key),
  saveData: (key, data) => ipcRenderer.invoke('save-data', key, data),
  exportMarkdown: (content, filename) => ipcRenderer.invoke('export-markdown', content, filename),
  clearData: () => ipcRenderer.invoke('clear-data')
});
