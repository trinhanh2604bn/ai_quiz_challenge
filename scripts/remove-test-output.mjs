import { rmSync } from 'node:fs';

rmSync('dist/test-out', { recursive: true, force: true });
