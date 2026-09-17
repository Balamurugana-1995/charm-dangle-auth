const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, nativeImage, screen } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let isHidden = false;
let alwaysOnTop = true;

// Keep this in sync with the `id` values inside renderer/charm.html.
const CHARMS = [
  { id: 'nazar', name: 'Nazar boncuğu' },
  { id: 'hamsa', name: 'Hamsa' },
  { id: 'ghanta', name: 'Ghanta (bell)' },
  { id: 'doll', name: 'Wishing doll' },
  { id: 'drishti', name: 'Drishti guardian' },
  { id: 'nimbu', name: 'Nimbu-mirchi' },
  { id: 'clover', name: 'Four-leaf clover' },
  { id: 'custom', name: 'Your own charm' }
];
let activeCharm = 'nazar';

const WINDOW_WIDTH = 160;
const WINDOW_HEIGHT = 460;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const x = display.workArea.x + display.workArea.width - WINDOW_WIDTH - 24;
  const y = display.workArea.y;

  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile(path.join(__dirname, 'renderer', 'charm.html'));

  // Click-through everywhere except the charm/rope/drag-handle area — the
  // renderer tells us (via IPC) whenever the cursor enters or leaves that
  // hit area, and we flip mouse-event forwarding accordingly.
  win.setIgnoreMouseEvents(true, { forward: true });
}

function sendToRenderer(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function buildTrayMenu() {
  const charmSubmenu = CHARMS.map((c) => ({
    label: c.name,
    type: 'radio',
    checked: c.id === activeCharm,
    click: () => {
      activeCharm = c.id;
      sendToRenderer('select-charm', c.id);
      tray.setContextMenu(buildTrayMenu());
    }
  }));

  return Menu.buildFromTemplate([
    { label: 'Charm Dangle', enabled: false },
    { type: 'separator' },
    { label: 'Choose charm', submenu: charmSubmenu },
    {
      label: 'Give it a ritual',
      click: () => sendToRenderer('perform-ritual')
    },
    { type: 'separator' },
    {
      label: isHidden ? 'Show charm' : 'Hide charm',
      click: () => {
        isHidden = !isHidden;
        sendToRenderer('set-hidden', isHidden);
        tray.setContextMenu(buildTrayMenu());
      }
    },
    {
      label: 'Always on top',
      type: 'checkbox',
      checked: alwaysOnTop,
      click: () => {
        alwaysOnTop = !alwaysOnTop;
        win.setAlwaysOnTop(alwaysOnTop, 'screen-saver');
        tray.setContextMenu(buildTrayMenu());
      }
    },
    { type: 'separator' },
    {
      label: 'Bring back to top-right',
      click: () => {
        const display = screen.getPrimaryDisplay();
        win.setPosition(
          display.workArea.x + display.workArea.width - WINDOW_WIDTH - 24,
          display.workArea.y
        );
      }
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ]);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon16.png'));
  tray = new Tray(icon);
  tray.setToolTip('Charm Dangle');
  tray.setContextMenu(buildTrayMenu());
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register('CommandOrControl+Shift+D', () => {
    isHidden = !isHidden;
    sendToRenderer('set-hidden', isHidden);
    tray.setContextMenu(buildTrayMenu());
  });

  globalShortcut.register('CommandOrControl+Shift+R', () => {
    sendToRenderer('perform-ritual');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // A menu-bar-style app has no dock/taskbar presence to keep open for,
  // but we still don't want the app to quit just because the window closed.
  if (process.platform !== 'darwin') app.quit();
});

// The renderer reports whether the cursor is currently over an
// interactive part of the charm (the drag handle, the medallion, or the
// rope while dragging). We use that to toggle real click-through.
ipcMain.on('hover-state', (event, hovering) => {
  if (!win || win.isDestroyed()) return;
  win.setIgnoreMouseEvents(!hovering, { forward: true });
});
