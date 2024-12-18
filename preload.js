// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  exportProjectFolder: (data) =>
    ipcRenderer.invoke("export-project-folder", data),
});
