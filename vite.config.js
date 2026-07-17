import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: {
    global: 'globalThis',
  },
  build: {
    modulePreload: {
      resolveDependencies(_filename, dependencies, { hostType }) {
        if (hostType !== 'html') return dependencies;
        return dependencies.filter((dependency) => !dependency.includes('_commonjsHelpers'));
      },
    },
  },
});
