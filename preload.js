const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- Data Persistence ---
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  setTasks: (tasks) => ipcRenderer.send('set-tasks', tasks),
});
