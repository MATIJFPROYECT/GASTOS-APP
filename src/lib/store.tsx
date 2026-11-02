import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Data, emptyData, readData, today } from './expenses';

const KEY = 'mis-gastos:v1';
type Store = { data: Data; month: string; setMonth: (m: string) => void; ready: boolean; loadError: boolean; reload: () => void; save: (data: Data) => Promise<void> };
const Context = createContext<Store | null>(null);
export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(emptyData);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const writing = useRef(false);
  const load = async () => {
    try { setData(readData(await AsyncStorage.getItem(KEY))); setReady(true); }
    catch { setLoadError(true); }
  };
  const reload = () => { setLoadError(false); setReady(false); void load(); };
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(raw => {
      const restored = readData(raw);
      if (active) { setData(restored); setReady(true); }
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);
  const save = async (next: Data) => {
    if (!ready || writing.current) throw new Error('Espera a que termine el guardado');
    writing.current = true;
    try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); setData(next); }
    finally { writing.current = false; }
  };
  return <Context.Provider value={{ data, month, setMonth, ready, loadError, reload, save }}>{children}</Context.Provider>;
}
export function useExpenses() {
  const context = useContext(Context);
  if (!context) throw new Error('ExpenseProvider is required');
  return context;
}
