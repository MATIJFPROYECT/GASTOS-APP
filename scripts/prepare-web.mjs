import { readFile, writeFile } from 'node:fs/promises';

const base = (process.env.WEB_BASE_PATH ?? '').replace(/\/$/, '');
if (base && !/^\/[A-Za-z0-9_-]+$/.test(base)) throw new Error('WEB_BASE_PATH no válida');
const root = `${base}/`;
const manifest = {
  id: root,
  name: 'A cuenta · Mis gastos',
  short_name: 'A cuenta',
  lang: 'es',
  start_url: root,
  scope: root,
  display: 'standalone',
  theme_color: '#37624B',
  background_color: '#F7F8F2',
  icons: [{ src: `${root}apple-touch-icon.png`, sizes: '512x512', type: 'image/png', purpose: 'any' }],
};
let html = await readFile('dist/index.html', 'utf8');
html = html.replace('<html lang="en">', '<html lang="es">')
  .replace('initial-scale=1, shrink-to-fit=no', 'initial-scale=1, shrink-to-fit=no, viewport-fit=cover')
  .replace('</head>', `<meta name="theme-color" content="#37624B" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="A cuenta" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="description" content="Tus gastos fijos, diarios y hormiga, en su sitio." />
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png" />
<link rel="manifest" href="${root}manifest.webmanifest" />
<link rel="icon" type="image/svg+xml" href="${root}icon.svg" />
</head>`);
await writeFile('dist/index.html', html);
await writeFile('dist/404.html', html);
await writeFile('dist/manifest.webmanifest', JSON.stringify(manifest, null, 2));
await writeFile('dist/.nojekyll', '');
console.log(`Web lista para publicar en ${root}`);
