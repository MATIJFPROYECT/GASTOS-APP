import { test, expect } from '@playwright/test';

test('add, edit, filter, persist and remove daily and fixed expenses on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Cada gasto, en su sitio.')).toBeVisible();
  await page.getByRole('button', { name: 'Añadir gasto', exact: true }).click();
  await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('12,50');
  await page.getByRole('textbox', { name: 'Nombre del gasto' }).fill('Compra semanal');
  await page.getByRole('button', { name: 'Guardar gasto', exact: true }).click();
  await expect(page.getByText('Compra semanal', { exact: true })).toBeVisible();
  await expect(page.getByTestId('monthly-total')).toContainText('12,50');
  await page.getByRole('button', { name: 'Añadir fijo', exact: true }).click();
  await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('700');
  await page.getByRole('textbox', { name: 'Nombre del gasto' }).fill('Alquiler');
  await page.getByRole('button', { name: 'Categoría Hogar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar gasto fijo', exact: true }).click();
  await expect(page.getByTestId('monthly-total')).toContainText('712,50');
  await page.screenshot({ path: '/tmp/gastos-resumen.png', fullPage: true });
  await page.reload();
  await expect(page.getByTestId('monthly-total')).toContainText('712,50');
  await page.getByRole('tab', { name: 'Día a día' }).click();
  await page.getByTestId('screen-daily').getByRole('button', { name: /Compra semanal.*Editar/ }).click();
  await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('15');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('button', { name: 'Transporte', exact: true }).click();
  await expect(page.getByText('Sin gastos en esta categoría')).toBeVisible();
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByTestId('screen-daily').getByRole('button', { name: /Compra semanal.*Editar/ }).click();
  await page.getByRole('button', { name: 'Eliminar gasto', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar gasto', exact: true }).click();
  await expect(page.getByTestId('screen-daily').getByText('Un pequeño hábito, más claridad')).toBeVisible();
  await page.getByRole('tab', { name: 'Gastos fijos' }).click();
  await page.getByTestId('screen-fixed').getByRole('button', { name: /Alquiler.*Editar/ }).click();
  await page.getByRole('button', { name: 'Dejar de contar este fijo' }).click();
  await page.getByRole('button', { name: 'Dejar de contar', exact: true }).click();
  await expect(page.getByText('Dale sitio a lo de cada mes')).toBeVisible();
});

test('invalid amounts and calendar dates cannot be saved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Añadir gasto', exact: true }).click();
  await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Guardar gasto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('importe mayor que cero');
  await page.getByRole('textbox', { name: 'Importe', exact: true }).fill('5');
  await page.getByRole('textbox', { name: 'Fecha', exact: true }).fill('31/02/2026');
  await page.getByRole('button', { name: 'Guardar gasto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('fecha válida');
});

test('emoji categories and small expense filter highlight daily spending', async ({ page }) => {
  await page.goto('/');
  for (const [title, amount] of [['Café pequeño', '3'], ['Comida grande', '15']]) {
    await page.getByRole('button', { name: 'Añadir gasto', exact: true }).click();
    await page.getByRole('textbox', { name: 'Importe', exact: true }).fill(amount);
    await page.getByRole('textbox', { name: 'Nombre del gasto' }).fill(title);
    const coffee = page.getByRole('button', { name: 'Categoría Café y snacks', exact: true });
    await expect(coffee).toContainText('☕');
    await coffee.click();
    await page.getByRole('button', { name: 'Guardar gasto', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Importe', exact: true })).toHaveCount(0);
  }
  await expect(page.getByTestId('screen-summary').getByTestId('small-expenses-total')).toContainText('3,00');
  await page.getByRole('tab', { name: 'Día a día' }).click();
  const daily = page.getByTestId('screen-daily');
  await daily.getByRole('button', { name: /Ver solo gastos de hasta 10/ }).click();
  await expect(daily.getByRole('button', { name: /Café pequeño.*Editar/ })).toBeVisible();
  await expect(daily.getByRole('button', { name: /Comida grande.*Editar/ })).toHaveCount(0);
  await daily.getByRole('button', { name: /Viendo solo gastos de hasta 10/ }).click();
  await expect(daily.getByRole('button', { name: /Comida grande.*Editar/ })).toBeVisible();
  await page.screenshot({ path: '/tmp/gastos-emojis.png', fullPage: true });
});
