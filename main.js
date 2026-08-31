const electron = require('electron');
const { app, BrowserWindow, Menu, shell } = electron;
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#0a0d1a',
    title: 'LumenOS',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'lumen.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  Menu.setApplicationMenu(null);
  win.loadFile('index.html');

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)){ shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')){ event.preventDefault(); shell.openExternal(url); }
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
