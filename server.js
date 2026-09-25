// One server owns API, cookies and the public asset allowlist. Never serve the repo root.
const { spawn } = require('node:child_process');
const path = require('node:path');
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const args = ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', process.env.PORT || '8000'];
if (process.argv.includes('--reload')) args.push('--reload');
const child = spawn(python, args, { cwd: path.join(__dirname, 'backend'), stdio: 'inherit', env: process.env });
child.on('error', error => {
  console.error(`Cannot start Python backend: ${error.message}. Install backend/requirements.txt.`);
  process.exitCode = 1;
});
child.on('exit', code => { process.exitCode = code || 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
