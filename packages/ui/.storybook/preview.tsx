import type { Preview } from '@storybook/react-native-web-vite';

import { ThemeProvider } from '../src/theme';

const preview: Preview = {
  globalTypes: {
    scheme: {
      description: 'Color scheme',
      toolbar: { icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { scheme: 'light' },
  decorators: [
    (Story, ctx) => (
      <ThemeProvider preference={ctx.globals.scheme as 'light' | 'dark'}>
        <Story />
      </ThemeProvider>
    ),
  ],
  // 13.20 — fail the story test on a11y violations.
  parameters: { a11y: { test: 'error' } },
};
export default preview;
