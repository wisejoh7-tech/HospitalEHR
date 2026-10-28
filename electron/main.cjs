const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// If executed in a standard Node.js environment (e.g. Render web service running `node electron/main.cjs`),
// fallback to running the Express backend server (`server.ts`).
if (!process.versions || !process.versions.electron) {
  console.log('🚀 Executed via Node.js environment (not Electron). Launching Express backend server...');
  const serverScript = path.join(__dirname, '../server.ts');
  const serverProcess = spawn('npx', ['tsx', serverScript], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..')
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to launch backend server:', err);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`Server process exited with code ${code}`);
      process.exit(code);
    }
  });
} else {
  // Executed inside Electron desktop runtime
  const { app, BrowserWindow, shell, Tray, Menu } = require('electron');

  let mainWindow = null;
  let tray = null;
  let serverProcess = null;

  const GOT_SINGLE_INSTANCE_LOCK = app.requestSingleInstanceLock();
  if (!GOT_SINGLE_INSTANCE_LOCK) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }

  function checkServerHealth(url, timeout = 1000) {
    return new Promise((resolve) => {
      const req = http.get(`${url}/api/health`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(timeout, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async function ensureLocalBackend() {
    const isRunning = await checkServerHealth('http://localhost:3000');
    if (isRunning) {
      console.log('✅ Backend server already running on port 3000');
      return;
    }

    console.log('🚀 Spawning local SQLite Express backend for Windows Desktop application...');
    const env = {
      ...process.env,
      PORT: '3000',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./local.db',
      NODE_ENV: process.env.NODE_ENV || 'production'
    };

    try {
      const serverScript = path.join(__dirname, '../server.ts');
      serverProcess = spawn('npx', ['tsx', serverScript], {
        env,
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore',
        detached: false
      });

      serverProcess.on('error', (err) => {
        console.error('Failed to launch local server process:', err);
      });
    } catch (err) {
      console.error('Error starting local server:', err);
    }
  }

  function createTray() {
    try {
      tray = new Tray(path.join(__dirname, 'icon.png'));
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Hospital System', click: () => mainWindow && mainWindow.show() },
        { label: 'Local SQLite Mode', enabled: false },
        { type: 'separator' },
        { label: 'Quit Application', click: () => app.quit() }
      ]);
      tray.setToolTip('Hospital Management & Pharmacy Local System');
      tray.setContextMenu(contextMenu);
    } catch {
      // Icon fallback silently ignored if image file not found
    }
  }

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1366,
      height: 860,
      minWidth: 960,
      minHeight: 640,
      title: 'VIVI Hospital & Pharmacy Management System (Local SQLite & Sync)',
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';

    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL(devUrl);
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadURL('http://localhost:3000').catch(() => {
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath);
      });
    }

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Open external web links in default system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http:') || url.startsWith('https:')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(async () => {
    await ensureLocalBackend();
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
