import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';

const formattable = new Set(['.ts', '.html', '.scss', '.css', '.json', '.md']);

const raw = await readStdin();
const filePath = readEditedPath(raw);
if (filePath === null || !formattable.has(path.extname(filePath).toLowerCase())) {
  process.exit(0);
}

try {
  const source = await readFile(filePath, 'utf8');
  const config = await resolveConfig(filePath);
  const formatted = await format(source, { ...config, filepath: filePath });
  if (formatted !== source) {
    await writeFile(filePath, formatted);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`format-edited skipped ${filePath}: ${message}\n`);
}

process.exit(0);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function readEditedPath(raw) {
  if (raw.trim().length === 0) {
    return null;
  }

  try {
    const payload = JSON.parse(raw);
    const filePath = payload?.tool_input?.file_path;
    return typeof filePath === 'string' && filePath.length > 0 ? filePath : null;
  } catch {
    return null;
  }
}
