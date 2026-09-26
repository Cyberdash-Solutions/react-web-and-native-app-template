import { render, renderHook, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { createTestContext, type ProviderOptions } from './context';

export * from '@testing-library/react-native';
export { createTestContext, type ProviderOptions, type TestContext } from './context';

/** 13.8 — React Native Testing Library render with the real providers (see ./context). */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const ctx = createTestContext(options);
  return { ...render(ui, { ...options, wrapper: ctx.wrapper }), ...ctx };
}

/** For hook tests (data, auth). */
export const createTestDataWrapper = createTestContext;
export { renderHook };
