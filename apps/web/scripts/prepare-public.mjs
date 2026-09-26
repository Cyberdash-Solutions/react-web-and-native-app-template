// Copies the web-pwa service worker into public/ and writes the web app manifest (11.2).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pub = path.join(import.meta.dirname, '../public');
fs.mkdirSync(pub, { recursive: true });
fs.copyFileSync(require.resolve('@repo/web-pwa/sw.js'), path.join(pub, 'sw.js'));
fs.writeFileSync(
  path.join(pub, 'manifest.json'),
  JSON.stringify(
    {
      name: 'Hello World',
      short_name: 'Hello',
      start_url: '/',
      display: 'standalone',
      theme_color: '#4F46E5',
      background_color: '#F8FAFC',
      icons: [{ src: '/favicon.png', sizes: '48x48', type: 'image/png' }],
    },
    null,
    2,
  ),
);
