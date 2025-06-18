// electron.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false, // Don't show until ready
  });

  // For production:
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // For development:
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    // For production:
    mainWindow.loadURL(`file://${path.join(__dirname, "build", "index.html")}`);
  }

  // Show window when ready to prevent white screen
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle navigation errors
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    }
  );
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

// Define application data directories
const appDataDir = path.join(os.homedir(), "Documents", "AssessmentMaker");
const reportsDir = path.join(appDataDir, "reports");
const imagesDir = path.join(appDataDir, "images");
const exportsDir = path.join(os.homedir(), "Desktop", "assessmentReports");

// Create directories if they don't exist
[appDataDir, reportsDir, imagesDir, exportsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const { Packer } = require("docx");

// Data storage functions
function getReportsFilePath() {
  return path.join(reportsDir, "reports.json");
}

function loadReports() {
  const reportsFile = getReportsFilePath();
  if (fs.existsSync(reportsFile)) {
    try {
      const data = fs.readFileSync(reportsFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading reports:", error);
      return [];
    }
  }
  return [];
}

function saveReports(reports) {
  const reportsFile = getReportsFilePath();
  try {
    fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving reports:", error);
    return { success: false, error: error.message };
  }
}

// Image storage functions
function saveImage(imageData, filename) {
  try {
    const imageId = uuidv4();
    const extension = filename.split(".").pop() || "png";
    const savedFilename = `${imageId}.${extension}`;
    const imagePath = path.join(imagesDir, savedFilename);

    // Remove data URL prefix and convert to buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    fs.writeFileSync(imagePath, buffer);

    return {
      success: true,
      imageId: savedFilename,
      savedFilename,
      originalFilename: filename,
      path: imagePath,
    };
  } catch (error) {
    console.error("Error saving image:", error);
    return { success: false, error: error.message };
  }
}

function getImage(imageFilename) {
  try {
    const imagePath = path.join(imagesDir, imageFilename);
    if (fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      const base64 = buffer.toString("base64");
      const mimeType = getMimeType(imagePath);
      return {
        success: true,
        data: `data:${mimeType};base64,${base64}`,
      };
    }
    return { success: false, error: "Image not found" };
  } catch (error) {
    console.error("Error loading image:", error);
    return { success: false, error: error.message };
  }
}

function deleteImage(imageFilename) {
  try {
    const imagePath = path.join(imagesDir, imageFilename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return { success: true };
    }
    return { success: false, error: "Image not found" };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: error.message };
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "image/png";
}

// IPC Handlers

// Reports management
ipcMain.handle("load-reports", async () => {
  return loadReports();
});

ipcMain.handle("save-reports", async (event, reports) => {
  return saveReports(reports);
});

// Image management
ipcMain.handle("save-image", async (event, { imageData, filename }) => {
  return saveImage(imageData, filename);
});

ipcMain.handle("get-image", async (event, imageFilename) => {
  return getImage(imageFilename);
});

ipcMain.handle("delete-image", async (event, imageFilename) => {
  return deleteImage(imageFilename);
});

// Get app directories info
ipcMain.handle("get-app-info", async () => {
  return {
    appDataDir,
    reportsDir,
    imagesDir,
    exportsDir,
  };
});

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
    const baseDir = exportPath || exportsDir;
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
