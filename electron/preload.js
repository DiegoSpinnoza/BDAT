const { contextBridge, ipcRenderer } = require('electron');
const apiArgument = process.argv.find((argument) => argument.startsWith('--bdat-api-url='));
const apiBaseUrl = apiArgument?.slice('--bdat-api-url='.length) || 'http://localhost:5000';

contextBridge.exposeInMainWorld('bdatDesktop', {
  apiBaseUrl,
  retryStartup: () => ipcRenderer.invoke('startup:retry'),
  openDockerDownload: () => ipcRenderer.invoke('startup:open-docker-download'),
  onStartupStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('startup:status', listener);
    return () => ipcRenderer.removeListener('startup:status', listener);
  },
});
