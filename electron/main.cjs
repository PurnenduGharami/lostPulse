const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// --- PORTABLE MODE CHECK ---
// If 'portable.flag' exists beside the executable, run in Portable Mode.
const exeDir = path.dirname(app.getPath('exe'));
const portableFlagPath = path.join(exeDir, 'portable.flag');
const isPortable = app.isPackaged && fs.existsSync(portableFlagPath);

if (isPortable) {
  // Store all user data locally to avoid touching AppData
  app.setPath('userData', path.join(exeDir, 'Data'));
}
// ---------------------------

const isDev = !app.isPackaged || (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'development');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../public/assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenu(null);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
const getDataPath = () => path.join(app.getPath('userData'), 'data');

ipcMain.handle('load-data', async (event, key) => {
  try {
    const filePath = path.join(getDataPath(), `${key}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error(`Error reading ${key}.json:`, err);
    return null;
  }
});

ipcMain.handle('save-data', async (event, key, data) => {
  try {
    const dir = getDataPath();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${key}.json:`, err);
    return false;
  }
});

ipcMain.handle('export-markdown', async (event, content, filename) => {
  try {
    const dir = path.join(app.getPath('userData'), 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing markdown ${filename}:`, err);
    return false;
  }
});

ipcMain.handle('clear-data', async () => {
  try {
    const dir = getDataPath();
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    console.error(`Error clearing data:`, err);
    return false;
  }
});
