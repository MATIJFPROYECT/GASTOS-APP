import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const base = (process.env.WEB_BASE_PATH ?? '/GASTOS-APP').replace(/\/$/, '');
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (!path.startsWith(`${base}/`)) { response.writeHead(404).end(); return; }
  const relative = path.slice(base.length + 1) || 'index.html';
  const file = resolve(root, relative);
  if (!file.startsWith(`${root}/`)) { response.writeHead(403).end(); return; }
  try {
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html' }).end(await readFile(resolve(root, '404.html')));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  const home = `${origin}${base}/`;
  const manifest = await (await fetch(`${home}manifest.webmanifest`)).json();
  assert.equal(manifest.start_url, `${base}/`);
  assert.equal(manifest.display, 'standalone');
  const icon = await fetch(`${origin}${manifest.icons[0].src}`);
  assert.equal(icon.status, 200);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(home);
  await expect(page.getByText('Cada gasto, en su sitio.')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
  await page.getByRole('button', { name: 'Añadir gasto', exact: true }).click();
  await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('2,50');
  await page.getByRole('textbox', { name: 'Nombre del gasto' }).fill('Café de prueba');
  await page.getByRole('button', { name: 'Categoría Café y snacks', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar gasto', exact: true }).click();
  await expect(page.getByTestId('small-expenses-total')).toContainText('2,50');
  await page.getByRole('tab', { name: 'Día a día' }).click();
  await expect(page).toHaveURL(`${home}movimientos`);
  await page.reload();
  await expect(page.getByTestId('screen-daily').getByText('Café de prueba', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Gastos fijos' }).click();
  await expect(page.getByText('Lo de todos los meses.')).toBeVisible();
  assert.deepEqual(errors, []);
  console.log('PASS: exportación publicada bajo subruta; recursos, metadatos iPhone, navegación, recarga y persistencia.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
