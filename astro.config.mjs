// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://hwarim-hyun.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap(), mdx()],
  markdown: {
    // 라이트/다크 모드별 코드 하이라이트 테마. 전환 CSS 는 global.css 의 "code highlighting" 참고.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
    },
  },
});