// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Reports management
  loadReports: () => ipcRenderer.invoke("load-reports"),
  saveReports: (reports) => ipcRenderer.invoke("save-reports", reports),

  // Image management
  saveImage: (imageData, filename) =>
    ipcRenderer.invoke("save-image", { imageData, filename }),
  getImage: (imageFilename) => ipcRenderer.invoke("get-image", imageFilename),
  deleteImage: (imageFilename) =>
    ipcRenderer.invoke("delete-image", imageFilename),

  // App info
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),

  // File dialogs
  selectFolder: () => ipcRenderer.invoke("select-folder"),

  // Export functions
  exportWordDocument: (docData, projectName, exportPath) =>
    ipcRenderer.invoke("export-word-document", {
      docData,
      projectName,
      exportPath,
    }),
  exportProjectFolder: (
    projectName,
    pdfBuffer,
    wordBuffer,
    findings,
    exportPath
  ) =>
    ipcRenderer.invoke("export-project-folder", {
      projectName,
      pdfBuffer,
      wordBuffer,
      findings,
      exportPath,
    }),
});
