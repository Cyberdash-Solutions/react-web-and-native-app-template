import { createContext, useContext, useState, type ReactNode } from 'react';
import { useStore, type StoreApi } from 'zustand';

import { createPreferencesStore, type PreferencesState } from './preferences';

const PreferencesContext = createContext<StoreApi<PreferencesState> | null>(null);

export function PreferencesProvider({
  store,
  children,
}: {
  store?: StoreApi<PreferencesState>;
  children: ReactNode;
}) {
  const [value] = useState(() => store ?? createPreferencesStore());
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/**
 * 7.1 — Always select a slice: `usePreferences((s) => s.colorScheme)` re-renders only when that
 * slice changes, so a shared store can't cause app-wide re-renders.
 */
export function usePreferences<T>(selector: (state: PreferencesState) => T): T {
  const store = useContext(PreferencesContext);
  if (!store) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return useStore(store, selector);
}
