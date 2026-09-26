import type { StorybookConfig } from '@storybook/react-native-web-vite';

// 8.5 — a single react-native-web Storybook for the shared ui package.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/react-native-web-vite', options: {} },
};
export default config;
