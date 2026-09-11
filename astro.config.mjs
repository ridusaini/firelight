import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ridusaini.github.io',
  base: '/firelight',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' }
});
