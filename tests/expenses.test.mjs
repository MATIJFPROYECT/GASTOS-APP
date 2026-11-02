import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, validDate, summary, readData, shiftMonth } from '../src/lib/expenses.ts';

test('amounts use exact cents and accept Spanish decimals', () => {
  assert.equal(parseAmount('12,50'), 1250);
  assert.equal(parseAmount('0.29'), 29);
  assert.equal(parseAmount(' 10 '), 1000);
  for (const input of ['0', '-5', '1,234', '1e3', '1.000,50', '', 'NaN']) assert.equal(parseAmount(input), null);
});
test('calendar dates reject invalid days and support leap years', () => {
  assert.equal(validDate('2028-02-29'), true);
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '26-01-01']) assert.equal(validDate(date), false);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
const data = { version: 1, expenses: [
  { id: '1', title: 'Compra', cents: 1250, category: 'food', date: '2026-11-02' },
  { id: '2', title: 'Bus', cents: 150, category: 'transport', date: '2026-11-01' },
  { id: '3', title: 'Otro mes', cents: 500, category: 'food', date: '2026-10-30' },
], fixed: [
  { id: '4', title: 'Alquiler', cents: 70000, category: 'home', day: 1, from: '2026-10', until: '2026-12' },
  { id: '5', title: 'Alquiler actualizado', cents: 75000, category: 'home', day: 1, from: '2026-12' },
] };
test('monthly totals combine daily and applicable fixed expenses exactly once', () => {
  const result = summary(data, '2026-11');
  assert.equal(result.dailyTotal, 1400);
  assert.equal(result.fixedTotal, 70000);
  assert.equal(result.total, 71400);
  assert.deepEqual(result.expenses.map(e => e.id), ['1', '2']);
  assert.equal(result.breakdown.reduce((n, c) => n + c.cents, 0), result.total);
  assert.equal(summary(data, '2026-09').total, 0);
});
test('changing or stopping a fixed expense preserves historical months', () => {
  assert.equal(summary(data, '2026-10').fixedTotal, 70000);
  assert.equal(summary(data, '2026-12').fixedTotal, 75000);
  const stopped = { ...data, fixed: data.fixed.map(f => f.id === '5' ? { ...f, until: '2027-01' } : f) };
  assert.equal(summary(stopped, '2027-01').fixedTotal, 0);
  assert.equal(summary(stopped, '2026-12').fixedTotal, 75000);
});
test('saved data round-trips and corrupt data is rejected instead of overwritten', () => {
  assert.deepEqual(readData(JSON.stringify(data)), data);
  assert.deepEqual(readData(null), { version: 1, expenses: [], fixed: [] });
  for (const raw of ['bad json', '{}', '{"version":2,"expenses":[],"fixed":[]}', JSON.stringify({ ...data, expenses: [{ ...data.expenses[0], cents: -10 }] })]) assert.throws(() => readData(raw));
});

test('small expenses include the 10 euro boundary, exclude fixed costs and respect the month', () => {
  const result = summary({ version: 1, expenses: [
    { id: '1', title: 'Café', cents: 250, category: 'coffee', date: '2026-11-02' },
    { id: '2', title: 'Comida', cents: 1000, category: 'eating-out', date: '2026-11-02' },
    { id: '3', title: 'Compra', cents: 1001, category: 'food', date: '2026-11-02' },
    { id: '4', title: 'Otro mes', cents: 100, category: 'coffee', date: '2026-10-02' },
  ], fixed: [{ id: '5', title: 'Suscripción', cents: 500, category: 'subscriptions', day: 1, from: '2026-11' }] }, '2026-11');
  assert.equal(result.smallTotal, 1250);
  assert.equal(result.smallExpenses.length, 2);
  assert.equal(result.dailyTotal, 2251);
  assert.equal(result.total, 2751);
});
