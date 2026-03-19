import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';
import sitemap from '@astrojs/sitemap';


// https://astro.build/config
export default defineConfig({
  site: 'https://zamm.dev',
  integrations: [mdx({ remarkPlugins: [remarkGfm] }), sitemap()]
});
