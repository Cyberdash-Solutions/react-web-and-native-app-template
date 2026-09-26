import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';

import type { AuthState } from './machine';
import type { AuthSession } from './session';

const AuthContext = createContext<AuthSession | null>(null);

export function AuthProvider({
  session,
  children,
  restoreOnMount = true,
}: {
  session: AuthSession;
  children: ReactNode;
  restoreOnMount?: boolean;
}) {
  useEffect(() => {
    if (restoreOnMount) void session.restore();
  }, [session, restoreOnMount]);
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuthSession(): AuthSession {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuthSession must be used inside <AuthProvider>');
  return session;
}

export function useAuth(): AuthState {
  const session = useAuthSession();
  return useSyncExternalStore(session.subscribe, session.getState, session.getState);
}
