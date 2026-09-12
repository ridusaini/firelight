import { defineConfig } from 'astro/config';

export default defineConfig({
  // @Note: can be moved to env later, fine for now
  site: 'https://ridusaini.github.io',
  base: '/firelight',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' }
});
