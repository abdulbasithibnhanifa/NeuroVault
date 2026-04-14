import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/worker.ts'],
  format: ['cjs'],
  target: 'node20',
  clean: true,
  noExternal: ['@neurovault/shared'],
  sourcemap: true,
});
