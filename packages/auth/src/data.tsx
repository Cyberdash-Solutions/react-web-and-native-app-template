import { DataProvider, type DataProviderProps } from '@repo/data';

import { useAuth } from './react';

/** DataProvider whose cache is scoped to the current auth session (see DataProvider.sessionKey). */
export function AuthScopedDataProvider(props: Omit<DataProviderProps, 'sessionKey'>) {
  const auth = useAuth();
  const sessionKey =
    auth.status === 'signedIn' || auth.status === 'refreshing'
      ? `user:${auth.user.id}`
      : 'anonymous';
  return <DataProvider {...props} sessionKey={sessionKey} />;
}
