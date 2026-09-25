const { app, BrowserWindow, Tray, Menu, screen, ipcMain, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let dockWindow = null;
let configWindow = null;
let tray = null;
let isDockVisible = true;

const CONFIG_PATH = path.join(app.getPath('userData'), 'auradock-config.json');

// Default initial config if not saved yet
const DEFAULT_STORE = {
  config: {
    shape: 'drop',
    width: 100,
    expandedWidth: 420,
    tension: 100,
    theme: 'onyx',
    glowIntensity: 'subtle',
    borderWidth: 1.2,
    position: 'right',
    displayMode: 'morph',
    heightMode: 'full',
    marginTop: 0,
    marginBottom: 0,
    soundEnabled: true,
    autoHide: false,
    bgOpacity: 92,
    transitionDuration: 320,
    easingCurve: 'spring',
  },
  items: [
    { id: 'home', title: 'Início', iconName: 'Home', badge: undefined, detail: 'Visão executiva do sistema' },
    { id: 'projects', title: 'Projetos', iconName: 'CheckSquare', badge: 3, detail: 'Tarefas ativas e pendências' },
    { id: 'agenda', title: 'Agenda', iconName: 'Calendar', badge: '14h', detail: 'Compromissos sincronizados' },
    { id: 'files', title: 'Arquivos', iconName: 'Folder', badge: undefined, detail: 'Documentos recentes' },
    { id: 'notes', title: 'Notas', iconName: 'FileText', badge: undefined, detail: 'Bloco de rascunhos' },
    { id: 'settings', title: 'Ajustes', iconName: 'Settings', badge: undefined, detail: 'Preferências do sistema' },
  ]
};

function loadStoredData() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler configuração:', err);
  }
  return DEFAULT_STORE;
}

function saveStoredData(data) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar configuração:', err);
  }
}

// Generate a 24x24 Tray Icon dynamically
function createTrayIcon() {
  const iconBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHVJREFUeNpi/P//PwM1AAsQM4IxLhk1gIEDcMhQZ8DIUAMs6AbgM2AUI240CkYB6gIQZ8DX1/f/58+f/w+zYQG6A4ixwXgUoBwAdf9Hq0wYgGIbJgbg0tAghgZk1ACaGEwMIK7uGDUAdQNQ3ABiDAAEOAC/yivR6Z7h8AAAAABJRU5ErkJggg==',
    'base64'
  );
  return nativeImage.createFromBuffer(iconBuffer);
}

function getTargetDisplay(targetIndex) {
  const displays = screen.getAllDisplays();
  const index = typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < displays.length
    ? targetIndex
    : 0;
  return displays[index] || screen.getPrimaryDisplay();
}

function getDockBounds(customWidth) {
  const store = loadStoredData();
  const targetDisplay = getTargetDisplay(store.config.targetDisplayIndex);
  const { x: workX, y: workY, width: workWidth, height: workHeight } = targetDisplay.workArea;
  const isLeft = store.config.position === 'left';
  const width = Math.round(customWidth || store.config.width || 100);

  return {
    x: isLeft ? workX : Math.round(workX + workWidth - width),
    y: workY,
    width: width,
    height: workHeight,
  };
}

function createDockWindow() {
  if (dockWindow) {
    dockWindow.show();
    return;
  }

  const bounds = getDockBounds();

  dockWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments: ['--view-type=dock'],
    }
  });

  const devUrl = 'http://localhost:3000/#dock';
  const prodFile = path.join(__dirname, '../dist/index.html');
  const targetUrl = (process.env.NODE_ENV === 'development' || !fs.existsSync(prodFile))
    ? devUrl
    : `file://${prodFile}#dock`;

  dockWindow.loadURL(targetUrl);

  dockWindow.on('closed', () => {
    dockWindow = null;
  });
}

function createConfigWindow() {
  if (configWindow) {
    configWindow.show();
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 1060,
    height: 760,
    title: 'AuraDock Studio - Painel de Configurações',
    backgroundColor: '#0c0d14',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments: ['--view-type=config'],
    }
  });

  const devUrl = 'http://localhost:3000/#config';
  const prodFile = path.join(__dirname, '../dist/index.html');
  const targetUrl = (process.env.NODE_ENV === 'development' || !fs.existsSync(prodFile))
    ? devUrl
    : `file://${prodFile}#config`;

  configWindow.loadURL(targetUrl);

  // Instead of quitting, hide back to tray!
  configWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      configWindow.hide();
    }
  });

  configWindow.once('ready-to-show', () => {
    configWindow.show();
  });
}

function toggleDock() {
  if (!dockWindow) {
    createDockWindow();
    isDockVisible = true;
    return;
  }

  if (isDockVisible) {
    dockWindow.hide();
    isDockVisible = false;
  } else {
    const bounds = getDockBounds();
    dockWindow.setBounds(bounds);
    dockWindow.show();
    isDockVisible = true;
  }
}

function createSystemTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('AuraDock - Agente Ativo na Bandeja');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '⚡ Alternar Menu Lateral (Ctrl+Espaço)',
      click: () => toggleDock()
    },
    {
      label: '🎨 Abrir Estúdio / Configurações',
      click: () => createConfigWindow()
    },
    { type: 'separator' },
    {
      label: '📌 Mudar Posição (Direita / Esquerda)',
      click: () => {
        const store = loadStoredData();
        store.config.position = store.config.position === 'right' ? 'left' : 'right';
        saveStoredData(store);
        if (dockWindow) {
          dockWindow.setBounds(getDockBounds());
          dockWindow.webContents.send('config-updated', store);
        }
      }
    },
    { type: 'separator' },
    {
      label: '🚪 Sair do AuraDock',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => toggleDock());
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return loadStoredData();
});

ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;
  return displays.map((d, index) => ({
    index,
    id: d.id,
    label: `Monitor ${index + 1}${d.id === primaryId ? ' (Principal)' : ''} - ${d.bounds.width}x${d.bounds.height}`,
    bounds: d.bounds,
    workArea: d.workArea,
    isPrimary: d.id === primaryId,
  }));
});

ipcMain.handle('save-config', (event, data) => {
  saveStoredData(data);
  // Send live update to dock window immediately
  if (dockWindow) {
    const store = loadStoredData();
    const bounds = getDockBounds();
    dockWindow.setBounds(bounds);
    dockWindow.webContents.send('config-updated', store);
  }
  return { success: true };
});

ipcMain.on('hide-config', () => {
  if (configWindow) {
    configWindow.hide();
  }
});

ipcMain.on('open-config', () => {
  createConfigWindow();
});

ipcMain.on('toggle-dock', () => {
  toggleDock();
});

ipcMain.on('set-dock-size', (event, { width, height }) => {
  if (dockWindow) {
    const bounds = getDockBounds(width);
    if (height) bounds.height = Math.round(height);
    dockWindow.setBounds(bounds);
  }
});

ipcMain.on('quit-app', () => {
  app.isQuitting = true;
  app.quit();
});

app.whenReady().then(() => {
  createSystemTray();
  createDockWindow();

  // Register Global Shortcut (Ctrl+Space)
  try {
    globalShortcut.register('CommandOrControl+Space', () => {
      toggleDock();
    });
  } catch (err) {
    console.error('Erro ao registrar atalho global:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDockWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
