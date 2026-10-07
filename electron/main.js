const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const { createServer } = require('node:http');
const { createServer: createTcpServer } = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DOCKER_DOWNLOAD_URL = 'https://www.docker.com/products/docker-desktop/';
const STARTUP_TIMEOUT_MS = 10 * 60 * 1000;
const DOCKER_READY_TIMEOUT_MS = 3 * 60 * 1000;

let mainWindow;
let startupPromise;
let uiServer;
let uiOrigin;
let apiPort = 5000;
let apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function sendStatus(message, detail = '', state = 'working') {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('startup:status', { message, detail, state });
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      ...options,
    });
    let stderr = '';
    let stdout = '';
    child.stdout?.on('data', (chunk) => {
      const value = chunk.toString();
      stdout += value;
      options.onOutput?.(value);
    });
    child.stderr?.on('data', (chunk) => {
      const value = chunk.toString();
      stderr += value;
      options.onOutput?.(value);
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error((stderr || stdout || `${command} terminó con código ${code}`).trim()));
    });
  });
}

function dockerDesktopPath() {
  const candidates = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Docker', 'Docker', 'Docker Desktop.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Docker', 'Docker', 'Docker Desktop.exe'),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function dockerCommand() {
  const candidates = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || 'docker';
}

async function dockerIsReady() {
  try {
    await run(dockerCommand(), ['info', '--format', '{{.ServerVersion}}']);
    return true;
  } catch {
    return false;
  }
}

async function portIsAvailable(port) {
  const server = createTcpServer();
  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') resolve(false);
      else reject(error);
    });
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}

async function chooseApiPort() {
  for (let port = 5000; port <= 5100; port += 1) {
    if (await portIsAvailable(port)) return port;
  }
  throw new Error('No hay un puerto libre entre 5000 y 5100 para iniciar el backend de BDAT.');
}

async function waitForDocker() {
  if (await dockerIsReady()) return;

  const desktopPath = dockerDesktopPath();
  if (desktopPath) {
    sendStatus('Iniciando Docker Desktop', 'Puede tardar un momento en iniciar sus servicios.');
    try {
      const child = spawn(desktopPath, [], { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
    } catch {
      // Se muestra la ayuda de instalación si Docker no logra iniciarse.
    }
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < DOCKER_READY_TIMEOUT_MS) {
    if (await dockerIsReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(
    desktopPath
      ? 'Docker Desktop no quedó listo. Ábrelo desde el menú Inicio, espera a que indique que está funcionando y vuelve a intentarlo.'
      : 'No se encontró Docker Desktop. Instálalo y habilita WSL 2 durante su configuración; después vuelve a abrir BDAT.'
  );
}

function getRuntime() {
  if (app.isPackaged) {
    return {
      composeFile: path.join(process.resourcesPath, 'desktop-runtime', 'docker-compose.yml'),
      runtimeDir: path.join(process.resourcesPath, 'desktop-runtime'),
      uiDir: path.join(process.resourcesPath, 'app-ui'),
    };
  }
  return {
    composeFile: path.join(__dirname, 'docker-compose.desktop.yml'),
    runtimeDir: path.resolve(__dirname, '..'),
    uiDir: path.resolve(__dirname, '..', 'frontend', 'build'),
  };
}

async function waitForApi() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    try {
      const response = await fetch(`${apiBaseUrl}/health/full`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return;
    } catch {
      // Backend/build/DB may still be starting.
    }
    sendStatus('Preparando BDAT', 'Esperando a que el backend y la base de datos estén listos.');
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error('Los servicios tardaron demasiado en iniciar. Comprueba que Docker tenga memoria disponible y vuelve a intentarlo.');
}

async function startUiServer(uiDir) {
  if (uiOrigin) return uiOrigin;
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  uiServer = createServer((request, response) => {
    let requestedPath;
    try {
      requestedPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch {
      response.writeHead(400).end('Solicitud inválida');
      return;
    }
    const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
    const filePath = path.resolve(uiDir, relativePath);
    if (filePath !== uiDir && !filePath.startsWith(`${uiDir}${path.sep}`)) {
      response.writeHead(403).end('Acceso denegado');
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (path.extname(relativePath)) {
          response.writeHead(404).end('No encontrado');
          return;
        }
        fs.readFile(path.join(uiDir, 'index.html'), (indexError, index) => {
          if (indexError) response.writeHead(500).end('No se pudo cargar BDAT');
          else response.writeHead(200, { 'Content-Type': contentTypes['.html'] }).end(index);
        });
        return;
      }
      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      }).end(content);
    });
  });

  await new Promise((resolve, reject) => {
    uiServer.once('error', reject);
    uiServer.listen(0, '127.0.0.1', resolve);
  });
  const address = uiServer.address();
  uiOrigin = `http://127.0.0.1:${address.port}`;
  return uiOrigin;
}

function isHostPortConflict(error) {
  return /port is already allocated|address already in use|bind for .* failed|failed to bind host port/i.test(error?.message || String(error));
}

async function startCompose(runtime, envFile) {
  const candidates = [apiPort, ...Array.from({ length: 101 }, (_, index) => 5000 + index).filter((port) => port !== apiPort)];
  let lastError;

  for (const port of candidates) {
    if (!(await portIsAvailable(port))) continue;
    apiPort = port;
    apiBaseUrl = `http://127.0.0.1:${apiPort}`;
    fs.writeFileSync(
      envFile,
      `BDAT_RUNTIME_DIR=${runtime.runtimeDir.replace(/\\/g, '/')}/\nBDAT_API_PORT=${apiPort}\n`,
      'utf8'
    );

    try {
      await run(dockerCommand(), [
        'compose', '--project-name', 'bdat-desktop', '--env-file', envFile,
        '--file', runtime.composeFile, '--progress', 'plain', 'up', '--build', '--detach',
        'mysql', 'redis', 'backend', 'celery_worker',
      ], {
        onOutput: (chunk) => {
          const lines = chunk.split(/\r?\n/).filter(Boolean);
          const usefulLine = lines[lines.length - 1]?.replace(/\u001b\[[0-9;]*m/g, '').trim();
          if (usefulLine) sendStatus('Instalando y encendiendo los servicios', usefulLine.slice(-180));
        },
      });
      return;
    } catch (error) {
      lastError = error;
      if (!isHostPortConflict(error)) throw error;
      sendStatus('Buscando un puerto libre', `El puerto ${port} fue ocupado durante el inicio; reintentando automáticamente.`);
    }
  }

  throw lastError || new Error('No hay un puerto libre entre 5000 y 5100 para iniciar el backend de BDAT.');
}

async function startServices() {
  if (startupPromise) return startupPromise;
  startupPromise = (async () => {
    const runtime = getRuntime();
    await waitForDocker();
    sendStatus('Preparando los servicios de BDAT', 'La primera preparación puede tardar varios minutos.');

    const envFile = path.join(app.getPath('userData'), 'docker.env');
    fs.mkdirSync(path.dirname(envFile), { recursive: true });
    await startCompose(runtime, envFile);

    await waitForApi();
    sendStatus('BDAT está lista', 'Abriendo la aplicación…', 'ready');
    const appUrl = await startUiServer(runtime.uiDir);
    await mainWindow.loadURL(`${appUrl}/?apiBaseUrl=${encodeURIComponent(apiBaseUrl)}`);
  })().catch((error) => {
    startupPromise = null;
    sendStatus('No se pudo iniciar BDAT', error.message, 'error');
    throw error;
  });
  return startupPromise;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 700,
    title: 'BDAT',
    backgroundColor: '#10151f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: [`--bdat-api-url=${apiBaseUrl}`],
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const localApp = uiOrigin && url.startsWith(uiOrigin);
    const backend = url.startsWith(apiBaseUrl);
    if (!localApp && !backend) event.preventDefault();
  });
  mainWindow.loadFile(path.join(__dirname, 'startup.html'));
  startServices().catch(() => {});
}

ipcMain.handle('startup:retry', () => startServices());
ipcMain.handle('startup:open-docker-download', () => shell.openExternal(DOCKER_DOWNLOAD_URL));

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  chooseApiPort().then((port) => {
    apiPort = port;
    apiBaseUrl = `http://127.0.0.1:${apiPort}`;
    createWindow();
  }).catch((error) => {
    dialog.showErrorBox('No se pudo iniciar BDAT', error.message);
    app.quit();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', () => uiServer?.close());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
