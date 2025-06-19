// electron.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // For production:
  mainWindow.loadURL(`file://${path.join(__dirname, "build", "index.html")}`);

  // For development:
  mainWindow.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Define root directory for assessmentReports
const rootDir = path.join(os.homedir(), "Desktop", "assessmentReports");
if (!fs.existsSync(rootDir)) {
  fs.mkdirSync(rootDir);
}

const { Packer } = require("docx");

// Add folder selection dialog
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select folder for export",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, folderPath: result.filePaths[0] };
  }

  return { success: false };
});

ipcMain.handle(
  "export-word-document",
  async (event, { docData, projectName, exportPath }) => {
    try {
      const buffer = await Packer.toBuffer(docData);

      // Use provided export path or default
      const baseDir =
        exportPath ||
        path.join(require("os").homedir(), "Desktop", "assessmentReports");

      if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

      const projectFolder = path.join(
        baseDir,
        projectName.replace(/\s+/g, "_")
      );
      if (!fs.existsSync(projectFolder)) fs.mkdirSync(projectFolder);

      // Save Word file
      const wordFilePath = path.join(
        projectFolder,
        `${projectName}_report.docx`
      );
      fs.writeFileSync(wordFilePath, buffer);

      return { success: true, wordFilePath };
    } catch (error) {
      console.error("Error exporting Word document:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  "export-project-folder",
  async (
    event,
    { projectName, pdfBuffer, wordBuffer, findings, exportPath }
  ) => {
    const folderName = projectName.replace(/\s+/g, "_");

    // Use provided export path or default
    const baseDir = exportPath || rootDir;
    const projectFolder = path.join(baseDir, folderName);

    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }

    // Write PDF
    fs.writeFileSync(
      path.join(projectFolder, `${folderName}_report.pdf`),
      pdfBuffer
    );
    // Write Word
    fs.writeFileSync(
      path.join(projectFolder, `${folderName}_report.docx`),
      wordBuffer
    );

    // Create findingsImages folder
    const imagesFolder = path.join(projectFolder, "findingsImages");
    if (!fs.existsSync(imagesFolder)) {
      fs.mkdirSync(imagesFolder);
    }

    // Write PoC Images
    findings.forEach((f, idx) => {
      if (f.pocImages && f.pocImages.length > 0) {
        f.pocImages.forEach((img, imgIdx) => {
          const base64Data = img.data.split(",")[1];
          const binary = Buffer.from(base64Data, "base64");
          fs.writeFileSync(
            path.join(imagesFolder, `finding_${idx + 1}_${f.title}.png`),
            binary
          );
        });
      }
    });

    // Return the projectFolder path so the renderer can know where files are stored
    return { success: true, projectFolder };
  }
);
