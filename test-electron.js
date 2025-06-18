// test-electron.js - Simple test to check if Electron can start
const { app, BrowserWindow } = require("electron");

console.log("Starting Electron test...");
console.log("Node version:", process.version);
console.log("Electron version:", process.versions.electron);
console.log("Platform:", process.platform);
console.log("NODE_ENV:", process.env.NODE_ENV);

function createTestWindow() {
  console.log("Creating test window...");

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load a simple HTML page
  win.loadURL(
    "data:text/html,<h1>Electron Test Window</h1><p>If you see this, Electron is working!</p>"
  );

  console.log("Test window created successfully!");

  // Close after 5 seconds
  setTimeout(() => {
    console.log("Closing test window...");
    win.close();
  }, 5000);
}

app.whenReady().then(() => {
  console.log("Electron app ready!");
  createTestWindow();
});

app.on("window-all-closed", () => {
  console.log("All windows closed, quitting...");
  app.quit();
});

console.log("Test script loaded, waiting for app ready...");
