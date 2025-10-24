const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store').default;

const store = new Store();
let mainWindow;
let opacityLevel = 0; // 0: 100%, 1: 30%, 2: 0%
const OPACITY_LEVELS = [1.0, 0.3, 0.0];

// アプリケーションのライフサイクル
app.on('ready', createMainWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    alwaysOnTop: true, // 常に最前面
    frame: false, // フレームレスウィンドウ
    transparent: true, // 背景透過
    skipTaskbar: true, // タスクバーに表示しない
  });

  mainWindow.loadFile('index.html');
  mainWindow.setOpacity(OPACITY_LEVELS[opacityLevel]); // 初期透明度を設定

  // グローバルショートカットの登録
  globalShortcut.register('Control+Shift+O', () => {
    opacityLevel = (opacityLevel + 1) % OPACITY_LEVELS.length;
    const newOpacity = OPACITY_LEVELS[opacityLevel];
    mainWindow.setOpacity(newOpacity);

    // 透明度が0%ならクリックスルーを有効化
    if (newOpacity === 0.0) {
      mainWindow.setIgnoreMouseEvents(true);
    } else {
      mainWindow.setIgnoreMouseEvents(false);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC Handlers for Data Persistence ---
ipcMain.handle('get-tasks', async (event) => {
  return store.get('tasks', {
    todo: [],
    doing: [],
    done: []
  }); // デフォルト値を設定
});

ipcMain.on('set-tasks', (event, tasks) => {
  store.set('tasks', tasks);
});


// アプリケーションが終了する前にショートカットを解除
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
