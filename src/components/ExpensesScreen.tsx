import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories, CategoryId, categoryFor, Expense, FixedExpense, money, monthName, SMALL_EXPENSE_LIMIT, parseAmount, shiftMonth, summary, today, validDate } from '../lib/expenses';
import { useExpenses } from '../lib/store';

type Mode = 'summary' | 'daily' | 'fixed';
type Form = { kind: 'daily' | 'fixed'; item?: Expense | FixedExpense };
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const green = '#37624B';
function Icon({ name, color = green, size = 22 }: { name: IconName; color?: string; size?: number }) { return <Ionicons name={name} size={size} color={color} accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />; }
function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondaryButton, { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}><Text style={[s.buttonText, secondary && { color: green }]}>{title}</Text></Pressable>;
}
function Empty({ fixed, onPress }: { fixed?: boolean; onPress: () => void }) {
  return <View style={s.empty}>
    <View style={s.emptyIcon}><Icon name={fixed ? 'repeat-outline' : 'leaf-outline'} size={30} /></View>
    <Text style={s.emptyTitle}>{fixed ? 'Dale sitio a lo de cada mes' : 'Un pequeño hábito, más claridad'}</Text>
    <Text style={s.emptyDescription}>{fixed ? 'Añade tu alquiler, internet o suscripciones. Se incluirán automáticamente cada mes.' : 'Añade tu primer gasto del mes. Un café, la compra… todo empieza por algo pequeño.'}</Text>
    <Button title={fixed ? 'Añadir un gasto fijo' : 'Añadir mi primer gasto'} onPress={onPress} secondary />
  </View>;
}

export function ExpensesScreen({ mode }: { mode: Mode }) {
  const { data, month, setMonth, ready, loadError, reload } = useExpenses();
  const [form, setForm] = useState<Form | null>(null);
  const [smallOnly, setSmallOnly] = useState(false);
  const [filter, setFilter] = useState<CategoryId | null>(null);
  const stats = summary(data, month);
  const visibleExpenses = smallOnly && mode === 'daily' ? stats.smallExpenses : stats.expenses;
  const rows = filter ? visibleExpenses.filter(e => e.category === filter) : visibleExpenses;
  const open = (kind: 'daily' | 'fixed', item?: Expense | FixedExpense) => setForm({ kind, item });

  return <SafeAreaView testID={`screen-${mode}`} edges={['top', 'left', 'right']} style={s.safe}>
    <View style={s.shell}>
      <View style={s.header}>
        <View style={s.brand}><View style={s.logo}><Icon name="leaf" size={20} color="#F6F6ED" /></View><Text style={s.brandName}>a cuenta<Text style={{ color: '#9AA78B' }}>.</Text></Text></View>
        <View style={s.localBadge}><View style={s.dot} /><Text style={s.localText}>Solo para ti</Text></View>
      </View>
      {!ready ? <View style={s.loading}>{loadError ? <><Icon name="cloud-offline-outline" size={36} /><Text style={s.emptyTitle}>No pudimos leer tus datos</Text><Text style={s.emptyDescription}>Tus datos no se han reemplazado. Prueba a abrirlos de nuevo.</Text><Button title="Reintentar" onPress={reload} /></> : <><ActivityIndicator color={green} /><Text style={s.muted}>Abriendo tus gastos…</Text></>}</View> : <>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.intro}><Text style={s.eyebrow}>TU DINERO, CON CALMA</Text><Text style={s.heading}>{mode === 'summary' ? 'Cada gasto, en su sitio.' : mode === 'daily' ? 'Los pequeños del día.' : 'Lo de todos los meses.'}</Text><Text style={s.subtitle}>{mode === 'summary' ? 'Una mirada sencilla a tu mes.' : mode === 'daily' ? 'Registra, categoriza y sigue con tu día.' : 'Tus gastos habituales, siempre presentes.'}</Text></View>
          <View style={s.monthSelector}>
            <Pressable accessibilityLabel="Mes anterior" accessibilityRole="button" onPress={() => setMonth(shiftMonth(month, -1))} style={s.arrow} disabled={month === '2000-01'}><Icon name="chevron-back" size={18} /></Pressable>
            <View style={s.monthCenter}><Icon name="calendar-outline" size={16} /><Text style={s.monthText}>{monthName(month)}</Text>{month === today().slice(0, 7) && <View style={s.nowBadge}><Text style={s.nowText}>ESTE MES</Text></View>}</View>
            <Pressable accessibilityLabel="Mes siguiente" accessibilityRole="button" onPress={() => setMonth(shiftMonth(month, 1))} style={s.arrow} disabled={month === '2099-12'}><Icon name="chevron-forward" size={18} /></Pressable>
          </View>
          {mode === 'summary' && <>
            <View style={s.totalCard}>
              <View style={s.between}><Text style={s.totalLabel}>Tu mes, en total</Text><View style={s.totalIcon}><Icon name="wallet-outline" color="#DDE9C8" size={21} /></View></View>
              <Text style={s.totalAmount} testID="monthly-total">{money(stats.total)}</Text>
              <Text style={s.totalHint}>Gastos diarios + fijos previstos</Text>
              <View style={s.totalDivider} />
              <View style={s.totalsRow}><View style={s.totalPart}><Text style={s.totalPartLabel}>Fijos previstos</Text><Text style={s.totalPartValue}>{money(stats.fixedTotal)}</Text></View><View style={s.totalPart}><Text style={s.totalPartLabel}>Día a día</Text><Text style={s.totalPartValue}>{money(stats.dailyTotal)}</Text></View></View>
            </View>
            <View style={s.quickActions}>
              <Pressable accessibilityRole="button" onPress={() => open('daily')} style={s.quickPrimary}><Icon name="add" color="white" size={23} /><Text style={s.buttonText}>Añadir gasto</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => open('fixed')} style={s.quickSecondary}><Icon name="repeat-outline" size={19} /><Text style={s.quickSecondaryText}>Añadir fijo</Text></Pressable>
            </View>
            <SmallExpenses total={stats.smallTotal} count={stats.smallExpenses.length} dailyTotal={stats.dailyTotal} />
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>¿En qué se va?</Text><Text style={s.caption}>Por categoría</Text></View>
            <View style={s.card}>
              {stats.breakdown.length ? stats.breakdown.map(category => <View key={category.id} style={s.breakdownRow}>
                <View style={[s.categoryIcon, { backgroundColor: category.background }]}><Text accessible={false} aria-hidden style={s.emoji}>{category.emoji}</Text></View>
                <View style={s.flex}><View style={s.between}><Text style={s.rowTitle}>{category.name}</Text><Text style={s.rowAmount}>{money(category.cents)}</Text></View><View style={s.track}><View style={[s.bar, { backgroundColor: category.color, width: `${category.cents / stats.total * 100}%` }]} /></View></View>
              </View>) : <View style={s.categoryEmpty}><Icon name="pie-chart-outline" size={26} color="#95A38B" /><Text style={s.categoryEmptyText}>Tu mapa de gastos aparecerá aquí.</Text></View>}
            </View>
          </>}
          {mode === 'fixed' && <><View style={s.miniTotal}><Text style={s.muted}>Fijos previstos al mes</Text><Text style={s.miniAmount}>{money(stats.fixedTotal)}</Text><Text style={s.caption}>{stats.fixed.length} {stats.fixed.length === 1 ? 'gasto recurrente' : 'gastos recurrentes'}</Text></View><Button title="+ Añadir gasto fijo" onPress={() => open('fixed')} /><View style={s.info}><Icon name="information-circle-outline" size={19} /><Text style={s.infoText}>Son previsiones mensuales, no pagos confirmados. No vuelvas a añadirlos como gastos diarios.</Text></View></>}
          {mode === 'daily' && <><View style={s.miniTotal}><Text style={s.muted}>Gastos del día a día</Text><Text style={s.miniAmount}>{money(stats.dailyTotal)}</Text><Text style={s.caption}>{stats.expenses.length} {stats.expenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}</Text></View><SmallExpenses total={stats.smallTotal} count={stats.smallExpenses.length} dailyTotal={stats.dailyTotal} /><Button title="+ Añadir gasto" onPress={() => open('daily')} /><Pressable accessibilityRole="button" accessibilityState={{ selected: smallOnly }} onPress={() => setSmallOnly(!smallOnly)} style={[s.smallFilter, smallOnly && s.activeChip]}><Text style={[s.chipText, smallOnly && s.activeChipText]}>🐜 {smallOnly ? 'Viendo solo gastos de hasta 10 €' : 'Ver solo gastos de hasta 10 €'}</Text></Pressable><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}><Pressable accessibilityRole="button" accessibilityState={{ selected: filter === null }} onPress={() => setFilter(null)} style={[s.chip, filter === null && s.activeChip]}><Text style={[s.chipText, filter === null && s.activeChipText]}>Todos</Text></Pressable>{categories.map(c => <Pressable accessibilityRole="button" accessibilityLabel={c.name} accessibilityState={{ selected: filter === c.id }} key={c.id} onPress={() => setFilter(c.id)} style={[s.chip, filter === c.id && s.activeChip]}><Text style={[s.chipText, filter === c.id && s.activeChipText]}>{c.emoji} {c.name}</Text></Pressable>)}</ScrollView></>}
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>{mode === 'fixed' ? 'Tus gastos fijos' : mode === 'daily' ? 'Movimientos' : 'Los últimos gastos'}</Text><Text style={s.caption}>{mode === 'fixed' ? 'Cada mes' : 'Día a día'}</Text></View>
          {mode === 'fixed' ? stats.fixed.length ? <View style={s.card}>{stats.fixed.map((item, i) => <ExpenseRow key={item.id} item={item} last={i === stats.fixed.length - 1} onPress={() => open('fixed', item)} />)}</View> : <Empty fixed onPress={() => open('fixed')} /> : rows.length ? <View style={s.card}>{(mode === 'summary' ? rows.slice(0, 4) : rows).map((item, i, list) => <ExpenseRow key={item.id} item={item} last={i === list.length - 1} onPress={() => open('daily', item)} />)}</View> : filter || smallOnly ? <View style={s.empty}><Text style={s.emptyTitle}>{smallOnly ? 'Sin pequeños gastos con este filtro' : 'Sin gastos en esta categoría'}</Text><Text style={s.emptyDescription}>Prueba otra categoría o añade un gasto.</Text></View> : <Empty onPress={() => open('daily')} />}
          <View style={s.footnote}><Icon name="phone-portrait-outline" color="#8F998D" size={14} /><Text style={s.footnoteText}>Tus datos se guardan en este dispositivo.</Text></View>
        </ScrollView>
        {form && <ExpenseForm form={form} close={() => setForm(null)} />}
      </>}
    </View>
  </SafeAreaView>;
}

function SmallExpenses({ total, count, dailyTotal }: { total: number; count: number; dailyTotal: number }) {
  return <View style={s.smallCard}>
    <Text style={s.smallTitle}>🐜 Tus gastos hormiga</Text>
    <Text style={s.smallAmount} testID="small-expenses-total">{money(total)}</Text>
    <Text style={s.smallHint}>{count === 0 ? 'Los pequeños importes también cuentan. Un café aquí, un snack allá…' : `${count} ${count === 1 ? 'pequeño gasto suma' : 'pequeños gastos suman'} el ${Math.round(total / dailyTotal * 100)} % de tus gastos diarios del mes.`}</Text>
    <Text style={s.smallHint}>Aquí contamos los gastos diarios de hasta {money(SMALL_EXPENSE_LIMIT)}. Los fijos quedan fuera.</Text>
  </View>;
}

function ExpenseRow({ item, onPress, last }: { item: Expense | FixedExpense; onPress: () => void; last: boolean }) {
  const category = categoryFor(item.category);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${money(item.cents)}. Editar`} onPress={onPress} style={[s.expenseRow, !last && s.rowBorder]}>
    <View style={[s.categoryIcon, { backgroundColor: category.background }]}><Text accessible={false} aria-hidden style={s.emoji}>{category.emoji}</Text></View>
    <View style={s.flex}><Text style={s.rowTitle}>{item.title}</Text><Text style={s.rowSubtitle}>{category.name} · {'day' in item ? `Día ${item.day} de cada mes` : item.date.split('-').reverse().slice(0, 2).join('/')}</Text></View><Text style={s.rowAmount}>{money(item.cents)}</Text><Icon name="chevron-forward" size={14} color="#B3B9AD" />
  </Pressable>;
}

function ExpenseForm({ form, close }: { form: Form; close: () => void }) {
  const { data, month, setMonth, save } = useExpenses();
  const fixed = form.kind === 'fixed';
  const [title, setTitle] = useState(form.item?.title ?? '');
  const [amount, setAmount] = useState(form.item ? (form.item.cents / 100).toFixed(2).replace('.', ',') : '');
  const [category, setCategory] = useState<CategoryId>(form.item?.category ?? 'food');
  const initialDate = form.item && 'date' in form.item ? form.item.date : month === today().slice(0, 7) ? today() : `${month}-01`;
  const [date, setDate] = useState(initialDate.split('-').reverse().join('/'));
  const [day, setDay] = useState(form.item && 'day' in form.item ? String(form.item.day) : '1');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const submit = async (remove = false) => {
    if (busy) return;
    const cents = parseAmount(amount);
    const isoDate = date.trim().split('/').reverse().join('-');
    if (!remove) {
      if (!cents) return setError('Escribe un importe mayor que cero, con hasta 2 decimales. Ejemplo: 12,50.');
      if (!fixed && !validDate(isoDate)) return setError('Escribe una fecha válida entre 2000 y 2099: DD/MM/AAAA.');
      if (fixed && (!/^\d{1,2}$/.test(day) || Number(day) < 1 || Number(day) > 31)) return setError('El día del mes debe estar entre 1 y 31.');
      if (fixed && !title.trim()) return setError('Pon un nombre al gasto fijo, por ejemplo: Alquiler.');
    }
    setBusy(true); setError('');
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    try {
      if (fixed) {
        const old = form.item as FixedExpense | undefined;
        const updated = data.fixed.map(f => f.id === old?.id ? { ...f, until: month } : f);
        await save({ ...data, fixed: remove ? updated : [...updated, { id, title: title.trim(), cents: cents!, category, day: Number(day), from: month, ...(old?.until ? { until: old.until } : {}) }] });
      } else {
        const remaining = data.expenses.filter(e => e.id !== form.item?.id);
        await save({ ...data, expenses: remove ? remaining : [...remaining, { id: form.item?.id ?? id, title: title.trim() || categoryFor(category).name, cents: cents!, category, date: isoDate }] });
        if (!remove) setMonth(isoDate.slice(0, 7));
      }
      close();
    } catch { setError('No se pudo guardar. Revisa el espacio disponible y vuelve a intentarlo.'); setBusy(false); }
  };
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) close(); }}>
    <View style={s.overlay}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalKeyboard}>
      <SafeAreaView edges={['bottom']} style={s.sheet}>
        <View style={s.handle} />
        <View style={s.sheetHeader}><View><Text style={s.eyebrow}>{fixed ? 'UN MES MÁS TRANQUILO' : 'EN UN MOMENTO'}</Text><Text style={s.sheetTitle}>{form.item ? 'Editar gasto' : fixed ? 'Nuevo gasto fijo' : 'Añadir un gasto'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario" disabled={busy} onPress={close} style={s.close}><Icon name="close" size={23} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.formContent}>
          {confirm ? <View style={s.confirm}><Text style={s.emptyTitle}>{fixed ? '¿Dejar de contar este fijo?' : '¿Eliminar este gasto?'}</Text><Text style={s.emptyDescription}>{fixed ? `Dejará de incluirse desde ${monthName(month)}. Los meses anteriores se conservan.` : 'Este gasto se borrará de tu registro.'}</Text><Button title={busy ? 'Guardando…' : fixed ? 'Dejar de contar' : 'Eliminar gasto'} onPress={() => void submit(true)} disabled={busy} /><Button title="Cancelar" secondary onPress={() => setConfirm(false)} disabled={busy} /></View> : <>
            <Text style={s.label}>Importe</Text><View style={s.amountInputRow}><TextInput accessibilityLabel="Importe" autoFocus={!form.item} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#B3B9AC" maxLength={10} style={s.amountInput} editable={!busy} /><Text style={s.currency}>€</Text></View>
            <Text style={s.label}>{fixed ? 'Nombre del gasto' : '¿En qué lo has gastado?'}<Text style={s.optional}>{fixed ? '' : '  (opcional)'}</Text></Text><TextInput accessibilityLabel="Nombre del gasto" value={title} onChangeText={setTitle} placeholder={fixed ? 'Alquiler, gimnasio, internet…' : 'Un café, la compra…'} placeholderTextColor="#90988B" style={s.input} maxLength={60} editable={!busy} />
            <Text style={s.label}>Categoría</Text><View style={s.categoryGrid}>{categories.map(c => <Pressable accessibilityRole="button" accessibilityLabel={`Categoría ${c.name}`} accessibilityState={{ selected: category === c.id }} disabled={busy} key={c.id} onPress={() => setCategory(c.id)} style={[s.categoryOption, category === c.id && s.selectedCategory]}><Text accessible={false} aria-hidden style={s.emoji}>{c.emoji}</Text><Text style={[s.categoryOptionText, category === c.id && { color: green, fontWeight: '700' }]}>{c.name}</Text></Pressable>)}</View>
            <Text style={s.label}>{fixed ? 'Día habitual de pago' : 'Fecha'}</Text><TextInput accessibilityLabel={fixed ? 'Día habitual de pago' : 'Fecha'} value={fixed ? day : date} onChangeText={fixed ? setDay : setDate} keyboardType={fixed ? 'number-pad' : 'numbers-and-punctuation'} placeholder={fixed ? '1' : 'DD/MM/AAAA'} maxLength={fixed ? 2 : 10} style={s.input} editable={!busy} />
            {fixed && <Text style={s.formHint}>Se contará desde {monthName(month)}{form.item ? '; los cambios no afectarán a meses anteriores' : ' y se repetirá cada mes'}. En meses cortos, el día 29, 30 o 31 corresponde al último día.</Text>}
            <Button title={busy ? 'Guardando…' : form.item ? 'Guardar cambios' : fixed ? 'Guardar gasto fijo' : 'Guardar gasto'} onPress={() => void submit()} disabled={busy} />
            {form.item && <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirm(true)} style={s.deleteButton}><Text style={s.deleteText}>{fixed ? 'Dejar de contar este fijo' : 'Eliminar gasto'}</Text></Pressable>}
          </>}
          {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView></View>
  </Modal>;
}

const s = StyleSheet.create({
  emoji: { fontSize: 23 },
  smallCard: { backgroundColor: '#FBF0DE', borderRadius: 18, padding: 18, marginTop: 16, marginBottom: 4, gap: 9, borderWidth: 1, borderColor: '#EFE0C7' },
  smallTitle: { fontSize: 16, fontWeight: '600', color: '#75572E' },
  smallAmount: { fontSize: 28, fontWeight: '600', color: '#75572E', letterSpacing: -0.7 },
  smallHint: { color: '#896F4C', fontSize: 12, lineHeight: 19 },
  smallFilter: { alignItems: 'center', backgroundColor: '#F6ECD9', borderRadius: 12, padding: 14, marginTop: 14 },
  safe: { flex: 1, backgroundColor: '#F7F8F2' }, shell: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logo: { width: 32, height: 32, backgroundColor: green, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, brandName: { fontSize: 23, fontWeight: '700', letterSpacing: -1, color: '#2A4131' },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF1E7', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#7F9767' }, localText: { color: '#758369', fontSize: 11, fontWeight: '500' },
  content: { padding: 24, paddingTop: 18, paddingBottom: 24 }, intro: { marginBottom: 25 }, eyebrow: { color: '#7C8B71', fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginBottom: 10 }, heading: { fontSize: 29, fontWeight: '600', letterSpacing: -1.2, color: '#293B2E' }, subtitle: { color: '#87907F', fontSize: 14, marginTop: 8 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EEF0E7', padding: 5, borderRadius: 14, marginBottom: 20 }, arrow: { minWidth: 36, minHeight: 38, alignItems: 'center', justifyContent: 'center' }, monthCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flexWrap: 'wrap' }, monthText: { color: '#4E5E46', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }, nowBadge: { backgroundColor: '#DFE6D4', paddingHorizontal: 5, paddingVertical: 4, borderRadius: 4 }, nowText: { fontSize: 8, color: '#718160', fontWeight: '700', letterSpacing: 0.4 },
  totalCard: { backgroundColor: '#345A45', borderRadius: 23, padding: 24 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, totalLabel: { color: '#DAE5D4', fontSize: 14, fontWeight: '500' }, totalIcon: { backgroundColor: '#476B52', borderRadius: 12, padding: 9 }, totalAmount: { color: '#FFFDEF', fontSize: 42, fontWeight: '500', letterSpacing: -1.7, marginTop: 5 }, totalHint: { color: '#B6C9AB', fontSize: 11, marginTop: 6 }, totalDivider: { height: 1, backgroundColor: '#5A775F', marginVertical: 22 }, totalsRow: { flexDirection: 'row', gap: 20 }, totalPart: { flex: 1 }, totalPartLabel: { color: '#BACCAB', fontSize: 11 }, totalPartValue: { color: '#F2F4E5', fontSize: 19, fontWeight: '600', marginTop: 7, letterSpacing: -0.5 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 12 }, quickPrimary: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: green, borderRadius: 14, paddingVertical: 16, gap: 6 }, quickSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EDDF', borderRadius: 14, gap: 6, paddingHorizontal: 7 }, quickSecondaryText: { color: green, fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 14 }, sectionTitle: { color: '#344331', fontSize: 17, fontWeight: '600', letterSpacing: -0.5 }, caption: { color: '#8B9484', fontSize: 11 }, card: { backgroundColor: '#FFF', borderRadius: 18, borderColor: '#EBEEE4', borderWidth: 1, paddingHorizontal: 16 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }, categoryIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' }, flex: { flex: 1 }, rowTitle: { color: '#394734', fontWeight: '600', fontSize: 13 }, rowAmount: { color: '#394734', fontSize: 13, fontWeight: '600' }, track: { height: 4, backgroundColor: '#F1F3EB', borderRadius: 4, marginTop: 10, overflow: 'hidden' }, bar: { height: 4, borderRadius: 4 }, categoryEmpty: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, paddingVertical: 28 }, categoryEmptyText: { color: '#8A9480', fontSize: 12, flexShrink: 1 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 16 }, rowBorder: { borderBottomColor: '#EFF1EA', borderBottomWidth: 1 }, rowSubtitle: { fontSize: 10, color: '#909887', marginTop: 5 },
  button: { backgroundColor: green, paddingVertical: 17, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50 }, buttonText: { fontSize: 13, fontWeight: '600', color: '#FFF' }, secondaryButton: { backgroundColor: '#E8EEDF' }, empty: { alignItems: 'center', backgroundColor: '#F0F3E8', borderRadius: 18, padding: 25, gap: 15 }, emptyIcon: { width: 58, height: 58, borderRadius: 22, backgroundColor: '#E3EAD8', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: '#3B5137', fontSize: 17, fontWeight: '600', textAlign: 'center' }, emptyDescription: { color: '#7C8B71', fontSize: 13, textAlign: 'center', lineHeight: 21 },
  footnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 }, footnoteText: { color: '#8F998D', fontSize: 10 }, muted: { color: '#7B8874', fontSize: 13 }, miniTotal: { alignItems: 'center', paddingVertical: 22, gap: 9, marginBottom: 18 }, miniAmount: { color: '#2D4D38', fontSize: 39, letterSpacing: -1, fontWeight: '600' }, filters: { gap: 7, paddingTop: 20, paddingBottom: 2 }, chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EDF0E5' }, activeChip: { backgroundColor: green }, chipText: { color: '#7C8972', fontSize: 12 }, activeChipText: { color: '#FFF' }, info: { flexDirection: 'row', gap: 9, padding: 15, backgroundColor: '#EAF0E1', borderRadius: 12, marginTop: 18 }, infoText: { color: '#6A7F5F', fontSize: 12, lineHeight: 19, flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, padding: 30 },
  overlay: { flex: 1, backgroundColor: 'rgba(25,42,29,0.45)', justifyContent: 'flex-end', alignItems: 'center' }, modalKeyboard: { width: '100%', maxWidth: 640, maxHeight: '94%' }, sheet: { backgroundColor: '#F9FAF5', borderTopLeftRadius: 28, borderTopRightRadius: 28, flexShrink: 1 }, handle: { alignSelf: 'center', height: 4, width: 36, backgroundColor: '#DCE2D4', borderRadius: 3, marginTop: 10 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 }, sheetTitle: { fontSize: 24, color: '#30422F', fontWeight: '600', letterSpacing: -0.6 }, close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECF0E4', alignItems: 'center', justifyContent: 'center' }, formContent: { paddingHorizontal: 24, paddingBottom: 24 }, label: { color: '#4D6044', fontSize: 12, fontWeight: '600', marginTop: 18, marginBottom: 10 }, optional: { color: '#96A08D', fontWeight: '400' }, amountInputRow: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#E0E6D7', borderBottomWidth: 1, paddingBottom: 10 }, amountInput: { flex: 1, fontSize: 43, color: '#345A45', fontWeight: '500', padding: 0 }, currency: { fontSize: 30, color: '#8EA07E', marginRight: 5 }, input: { backgroundColor: '#FFF', borderColor: '#E4E9DC', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, color: '#394C32', minHeight: 50 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, categoryOption: { width: '31%', flexGrow: 0, alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, paddingHorizontal: 2, borderRadius: 12, backgroundColor: '#F0F2E9', borderColor: 'transparent', borderWidth: 1 }, selectedCategory: { backgroundColor: '#E5EDDB', borderColor: '#8DA17C' }, categoryOptionText: { color: '#7C8973', fontSize: 11, textAlign: 'center' }, formHint: { fontSize: 11, color: '#8C9881', lineHeight: 18, marginVertical: 14 }, deleteButton: { alignItems: 'center', paddingVertical: 16 }, deleteText: { color: '#B17063', fontSize: 12 }, error: { color: '#A1493E', backgroundColor: '#F8EAE3', padding: 12, borderRadius: 10, marginTop: 14, lineHeight: 20, fontSize: 12 }, confirm: { paddingVertical: 22, gap: 18 },
});
