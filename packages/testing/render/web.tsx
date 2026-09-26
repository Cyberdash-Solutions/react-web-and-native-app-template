import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

import { createTestContext, type ProviderOptions } from './context';

export * from '@testing-library/react';

/**
 * 13.7 / 13.8 — React Testing Library flavour of renderWithProviders, for web-only components
 * and the web app's screens (react-native-web renders real DOM).
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const ctx = createTestContext(options);
  return { ...render(ui, { ...options, wrapper: ctx.wrapper }), ...ctx };
}
