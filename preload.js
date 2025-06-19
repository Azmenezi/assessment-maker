// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  exportWordDocument: (data) =>
    ipcRenderer.invoke("export-word-document", data),
  exportProjectFolder: (data) =>
    ipcRenderer.invoke("export-project-folder", data),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
});
