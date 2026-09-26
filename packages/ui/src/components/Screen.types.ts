import type { ReactNode } from 'react';

export interface ScreenProps {
  children: ReactNode;
  /** Mobile: wrap content in a ScrollView (default true). */
  scroll?: boolean;
  testID?: string;
}
