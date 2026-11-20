// ============================================================================
// GYMGUIDE - ROOT MONOREPO LAUNCHER (node start-all.js)
// Starts both the NestJS Backend (Port 4000) and Vite React Frontend (Port 5173)
// from the root C:\Project\GYMGUIDE directory in a single terminal.
// ============================================================================

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
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

async function launchAll() {
  console.log('🚀 Launching GymGuide Full-Stack Platform (Backend + Frontend)...');

  const children = [];

  const backendRunning = await isPortListening(4000);
  if (backendRunning) {
    console.log('✅ GymGuide NestJS Backend is already running at http://localhost:4000/api/v1');
    console.log('📘 Swagger OpenAPI Docs: http://localhost:4000/api/docs');
  } else {
    const backendProc = spawn(npmCmd, ['start'], {
      cwd: path.resolve(__dirname, 'backend'),
      stdio: 'inherit',
      shell: isWin,
    });
    children.push(backendProc);
  }

  const frontendRunning = await isPortListening(5173);
  if (frontendRunning) {
    console.log('✅ GymGuide React Frontend is already running at http://localhost:5173');
  } else {
    const frontendProc = spawn(npmCmd, ['run', 'dev'], {
      cwd: path.resolve(__dirname, 'frontend'),
      stdio: 'inherit',
      shell: isWin,
    });
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
