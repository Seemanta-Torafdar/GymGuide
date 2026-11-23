// ============================================================================
// GYMGUIDE - ROOT MONOREPO LAUNCHER (node start-all.js)
// Starts NestJS Backend (Port 4000) first and waits until ready before launching
// Vite React Frontend (Port 5173) so proxy requests never hit ECONNREFUSED.
// ============================================================================

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const isWin = process.platform === 'win32';

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function waitForPort(port, maxWaitMs = 15000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (await isPortListening(port)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

function spawnNpmScript(scriptCmd, cwd) {
  if (isWin) {
    const comSpec = process.env.ComSpec || 'cmd.exe';
    return spawn(comSpec, ['/d', '/s', '/c', scriptCmd], {
      cwd,
      stdio: 'inherit',
      shell: false,
    });
  }
  const parts = scriptCmd.split(' ');
  return spawn(parts[0], parts.slice(1), {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
}

async function launchAll() {
  console.log('🚀 Launching GymGuide Full-Stack Platform (Backend + Frontend)...');

  const children = [];

  const backendRunning = await isPortListening(4000);
  if (backendRunning) {
    console.log('✅ GymGuide NestJS Backend is already running at http://localhost:4000/api/v1');
    console.log('📘 Swagger OpenAPI Docs: http://localhost:4000/api/docs');
  } else {
    const backendProc = spawnNpmScript('npm start', path.resolve(__dirname, 'backend'));
    children.push(backendProc);
    // Wait until backend port 4000 is accepting connections before starting Vite proxy
    await waitForPort(4000, 15000);
  }

  const frontendRunning = await isPortListening(5173);
  if (frontendRunning) {
    console.log('✅ GymGuide React Frontend is already running at http://localhost:5173');
  } else {
    const frontendProc = spawnNpmScript('npm run dev', path.resolve(__dirname, 'frontend'));
    children.push(frontendProc);
  }

  if (children.length === 0) {
    console.log('\n🎉 Both Backend (http://localhost:4000) and Frontend (http://localhost:5173) are active!');
    console.log('👉 Open http://localhost:5173 in your browser.');
    return;
  }

  function shutdown() {
    for (const proc of children) {
      try {
        proc.kill();
      } catch (_) {}
    }
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

launchAll();
