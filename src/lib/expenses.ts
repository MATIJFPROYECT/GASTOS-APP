export const categories = [
  { id: 'home', name: 'Hogar', emoji: '🏠', color: '#6B70C9', background: '#EEEDFA' },
  { id: 'food', name: 'Alimentación', emoji: '🛒', color: '#42816C', background: '#E8F3EC' },
  { id: 'transport', name: 'Transporte', emoji: '🚌', color: '#4886AC', background: '#E8F2F8' },
  { id: 'leisure', name: 'Ocio', emoji: '🎉', color: '#C27B43', background: '#FBF0E4' },
  { id: 'health', name: 'Salud', emoji: '💊', color: '#C46F83', background: '#F9EAF0' },
  { id: 'shopping', name: 'Compras', emoji: '🛍️', color: '#A177B2', background: '#F2ECF7' },
  { id: 'subscriptions', name: 'Suscripciones', emoji: '📺', color: '#687FA9', background: '#ECF0F8' },
  { id: 'other', name: 'Otros', emoji: '📦', color: '#7B827C', background: '#EEF0EC' },
  { id: 'coffee', name: 'Café y snacks', emoji: '☕', color: '#A77948', background: '#F7EEDD' },
  { id: 'eating-out', name: 'Comer fuera', emoji: '🍔', color: '#B97659', background: '#F9EDE4' },
] as const;
export type CategoryId = typeof categories[number]['id'];
export type Expense = { id: string; title: string; cents: number; category: CategoryId; date: string };
export type FixedExpense = { id: string; title: string; cents: number; category: CategoryId; day: number; from: string; until?: string };
export type Data = { version: 1; expenses: Expense[]; fixed: FixedExpense[] };
export const emptyData: Data = { version: 1, expenses: [], fixed: [] };
export const categoryFor = (id: CategoryId) => categories.find(c => c.id === id)!;
export const money = (cents: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shiftMonth(month: string, offset: number) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
export function monthName(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}
export function parseAmount(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(value)) return null;
  const [whole, decimal = ''] = value.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return cents > 0 ? cents : null;
}
export function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '2000-01-01' || date > '2099-12-31') return false;
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
}
export function fixedForMonth(data: Data, month: string) {
  return data.fixed.filter(f => f.from <= month && (!f.until || month < f.until));
}
export const SMALL_EXPENSE_LIMIT = 1000; // Hasta 10 €, solo gastos diarios.
export function summary(data: Data, month: string) {
  const expenses = data.expenses.filter(e => e.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const fixed = fixedForMonth(data, month);
  const dailyTotal = expenses.reduce((n, e) => n + e.cents, 0);
  const fixedTotal = fixed.reduce((n, e) => n + e.cents, 0);
  const breakdown = categories.map(c => ({ ...c, cents: [...expenses, ...fixed].filter(e => e.category === c.id).reduce((n, e) => n + e.cents, 0) })).filter(c => c.cents > 0).sort((a, b) => b.cents - a.cents);
  const smallExpenses = expenses.filter(e => e.cents <= SMALL_EXPENSE_LIMIT);
  const smallTotal = smallExpenses.reduce((n, e) => n + e.cents, 0);
  return { expenses, fixed, dailyTotal, fixedTotal, total: dailyTotal + fixedTotal, breakdown, smallExpenses, smallTotal };
}
export function readData(raw: string | null): Data {
  if (raw === null) return { version: 1, expenses: [], fixed: [] };
  const data = JSON.parse(raw);
  const base = (e: any) => e && typeof e.id === 'string' && typeof e.title === 'string' && e.title.trim().length > 0 && Number.isSafeInteger(e.cents) && e.cents > 0 && categories.some(c => c.id === e.category);
  const month = (s: unknown) => typeof s === 'string' && validDate(`${s}-01`);
  if (data?.version !== 1 || !Array.isArray(data.expenses) || !Array.isArray(data.fixed) ||
    !data.expenses.every((e: any) => base(e) && typeof e.date === 'string' && validDate(e.date)) ||
    !data.fixed.every((e: any) => base(e) && Number.isInteger(e.day) && e.day >= 1 && e.day <= 31 && month(e.from) && (e.until === undefined || (month(e.until) && e.until >= e.from)))) {
    throw new Error('Formato de datos no reconocido');
  }
  return data;
}
