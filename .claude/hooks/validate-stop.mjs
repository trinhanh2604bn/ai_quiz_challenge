import { spawnSync } from 'node:child_process';

const raw = await readStdin();
if (stopHookAlreadyActive(raw)) {
  process.exit(0);
}

const result = spawnSync('npm', ['run', 'test:ci'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: true,
});

if (result.stdout) {
  process.stderr.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

if ((result.status ?? 1) !== 0) {
  process.stdout.write(
    `${JSON.stringify({
      decision: 'block',
      reason: 'npm run test:ci failed. Fix the failing unit tests before stopping.',
    })}\n`,
  );
}

process.exit(0);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function stopHookAlreadyActive(raw) {
  if (raw.trim().length === 0) {
    return false;
  }

  try {
    return JSON.parse(raw).stop_hook_active === true;
  } catch {
    return false;
  }
}
