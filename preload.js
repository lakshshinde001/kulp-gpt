// preload.js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  appName: 'Next.js + Electron',
});
